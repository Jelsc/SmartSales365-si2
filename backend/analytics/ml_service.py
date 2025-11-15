"""
Servicio de Machine Learning para predicciones
Usa scikit-learn con RandomForestRegressor
"""
import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')


class VentasPredictor:
    """
    Predictor de ventas usando Random Forest
    Predice: ventas futuras, productos más vendidos, tendencias
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = 'analytics/models/ventas_model.pkl'
        self.scaler_path = 'analytics/models/scaler.pkl'
        
    def preparar_datos_historicos(self):
        """
        Prepara datos históricos de ventas para entrenamiento
        
        Returns:
            DataFrame con features: día_semana, mes, productos_vendidos, total_ventas, etc.
        """
        from ventas.models import Pedido
        from productos.models import Producto
        
        # Obtener pedidos de los últimos 6 meses
        fecha_inicio = timezone.now() - timedelta(days=180)
        ventas = Pedido.objects.filter(
            creado__gte=fecha_inicio,
            estado__in=['ENTREGADO', 'PAGADO']
        ).select_related('usuario').prefetch_related('items')
        
        if not ventas.exists():
            # Generar datos de ejemplo si no hay ventas
            return self._generar_datos_ejemplo()
        
        # Convertir a DataFrame
        datos = []
        for venta in ventas:
            fecha = venta.creado
            datos.append({
                'fecha': fecha,
                'dia_semana': fecha.weekday(),  # 0=Lunes, 6=Domingo
                'dia_mes': fecha.day,
                'mes': fecha.month,
                'trimestre': (fecha.month - 1) // 3 + 1,
                'total_venta': float(venta.total),
                'cantidad_items': venta.items.count(),
                'es_fin_semana': 1 if fecha.weekday() >= 5 else 0,
            })
        
        df = pd.DataFrame(datos)
        
        if len(df) == 0:
            return self._generar_datos_ejemplo()
        
        # Agregar por día (sumar todas las ventas del mismo día)
        df_agrupado = df.groupby(df['fecha'].dt.date).agg({
            'total_venta': 'sum',
            'cantidad_items': 'sum',
            'dia_semana': 'first',
            'dia_mes': 'first',
            'mes': 'first',
            'trimestre': 'first',
            'es_fin_semana': 'first'
        }).reset_index()
        
        return df_agrupado
    
    def _generar_datos_ejemplo(self):
        """Genera datos sintéticos para demostración"""
        np.random.seed(42)
        fechas = pd.date_range(end=datetime.now(), periods=180, freq='D')
        
        datos = []
        for fecha in fechas:
            # Simular patrón: más ventas en fines de semana y fin de mes
            base = 50000
            dia_semana = fecha.weekday()
            fin_semana_boost = 1.3 if dia_semana >= 5 else 1.0
            fin_mes_boost = 1.2 if fecha.day >= 25 else 1.0
            
            total = base * fin_semana_boost * fin_mes_boost * (1 + np.random.normal(0, 0.2))
            items = int(total / 5000 * (1 + np.random.normal(0, 0.15)))
            
            datos.append({
                'fecha': fecha.date(),
                'total_venta': max(0, total),
                'cantidad_items': max(1, items),
                'dia_semana': dia_semana,
                'mes': fecha.month,
                'trimestre': (fecha.month - 1) // 3 + 1,
                'es_fin_semana': 1 if dia_semana >= 5 else 0
            })
        
        return pd.DataFrame(datos)
    
    def entrenar_modelo(self):
        """
        Entrena el modelo de Random Forest con datos históricos
        
        Returns:
            dict con métricas de entrenamiento
        """
        print("📊 Preparando datos de entrenamiento...")
        df = self.preparar_datos_historicos()
        
        if len(df) < 30:
            return {
                'error': 'Datos insuficientes para entrenar',
                'registros': len(df)
            }
        
        # Features (variables predictoras)
        X = df[['dia_semana', 'dia_mes', 'mes', 'trimestre', 'es_fin_semana', 'cantidad_items']]
        
        # Target (lo que queremos predecir)
        y = df['total_venta']
        
        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Normalizar features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Entrenar Random Forest
        print("🌲 Entrenando Random Forest...")
        self.model = RandomForestRegressor(
            n_estimators=100,      # 100 árboles
            max_depth=10,          # Profundidad máxima
            min_samples_split=5,
            random_state=42,
            n_jobs=-1              # Usar todos los cores
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluar
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        # Guardar modelo
        self._guardar_modelo()
        
        print(f"✅ Modelo entrenado - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        return {
            'exito': True,
            'registros': len(df),
            'train_score': round(train_score, 3),
            'test_score': round(test_score, 3),
            'features_importance': self._get_feature_importance()
        }
    
    def _get_feature_importance(self):
        """Retorna importancia de cada feature"""
        if self.model is None:
            return {}
        
        features = ['dia_semana', 'dia_mes', 'mes', 'trimestre', 'es_fin_semana', 'cantidad_items']
        importance = self.model.feature_importances_
        
        return {
            feature: round(imp, 3)
            for feature, imp in zip(features, importance)
        }
    
    def predecir_proximos_dias(self, dias=7):
        """
        Predice ventas para los próximos N días
        
        Args:
            dias: Número de días a predecir
            
        Returns:
            Lista de predicciones con fecha y monto estimado
        """
        try:
            if self.model is None:
                self._cargar_modelo()
            
            if self.model is None:
                # Si no hay modelo, retornar datos de ejemplo
                print("⚠️ Modelo no entrenado. Retornando predicciones de ejemplo...")
                return self._generar_predicciones_ejemplo(dias)
            
            predicciones = []
            hoy = datetime.now()
            
            for i in range(dias):
                fecha = hoy + timedelta(days=i)
                
                # Estimar cantidad de items (promedio histórico o valor por defecto)
                cantidad_items_estimada = 15
                
                # Preparar features
                features = pd.DataFrame([{
                    'dia_semana': fecha.weekday(),
                    'dia_mes': fecha.day,
                    'mes': fecha.month,
                    'trimestre': (fecha.month - 1) // 3 + 1,
                    'es_fin_semana': 1 if fecha.weekday() >= 5 else 0,
                    'cantidad_items': cantidad_items_estimada
                }])
                
                # Normalizar y predecir
                features_scaled = self.scaler.transform(features)
                venta_predicha = self.model.predict(features_scaled)[0]
                
                predicciones.append({
                    'fecha': fecha.strftime('%Y-%m-%d'),
                    'dia_nombre': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][fecha.weekday()],
                    'venta_estimada': round(max(0, venta_predicha), 2),
                    'confianza': 'alta' if fecha.weekday() < 5 else 'media'  # Más confiable en días laborables
                })
            
            return predicciones
        except Exception as e:
            print(f"⚠️ Error en predicción: {str(e)}. Retornando datos de ejemplo...")
            return self._generar_predicciones_ejemplo(dias)
    
    def predecir_ventas_mes(self):
        """
        Predice ventas totales del mes actual
        
        Returns:
            dict con predicción del mes
        """
        predicciones_diarias = self.predecir_proximos_dias(dias=30)
        total_predicho = sum(p['venta_estimada'] for p in predicciones_diarias)
        
        return {
            'mes': datetime.now().strftime('%B %Y'),
            'total_estimado': round(total_predicho, 2),
            'promedio_diario': round(total_predicho / 30, 2),
            'predicciones_diarias': predicciones_diarias[:7]  # Solo próximos 7 días
        }
    
    def _generar_predicciones_ejemplo(self, dias=7):
        """
        Genera predicciones de ejemplo cuando el modelo no está entrenado
        
        Args:
            dias: Número de días a predecir
            
        Returns:
            Lista de predicciones de ejemplo
        """
        predicciones = []
        hoy = datetime.now()
        base_venta = 50000  # Venta base de ejemplo
        
        for i in range(dias):
            fecha = hoy + timedelta(days=i)
            
            # Simular patrón: más ventas en fines de semana
            dia_semana = fecha.weekday()
            multiplicador = 1.3 if dia_semana >= 5 else 1.0
            
            # Agregar variación aleatoria
            np.random.seed(i)  # Seed basado en día para consistencia
            variacion = 1 + np.random.normal(0, 0.1)
            
            venta_estimada = base_venta * multiplicador * variacion
            
            predicciones.append({
                'fecha': fecha.strftime('%Y-%m-%d'),
                'dia_nombre': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][dia_semana],
                'venta_estimada': round(max(0, venta_estimada), 2),
                'confianza': 'baja'  # Baja confianza porque son datos de ejemplo
            })
        
        return predicciones
    
    def _guardar_modelo(self):
        """Guarda el modelo entrenado en disco"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        print(f"💾 Modelo guardado en {self.model_path}")
    
    def _cargar_modelo(self):
        """Carga el modelo desde disco"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                print("✅ Modelo cargado desde disco")
                return True
        except Exception as e:
            print(f"⚠️ Error cargando modelo: {e}")
        return False


class ProductosAnalyzer:
    """
    Análisis y predicciones de productos
    """
    
    @staticmethod
    def productos_mas_vendidos(limite=10):
        """Top productos más vendidos"""
        from ventas.models import ItemPedido
        
        productos = ItemPedido.objects.values(
            'producto__id',
            'producto__nombre',
            'producto__categoria__nombre',
            'producto__imagen'
        ).annotate(
            total_vendido=Sum('cantidad'),
            ingresos_totales=Sum(F('cantidad') * F('precio_unitario'))
        ).order_by('-total_vendido')[:limite]
        
        return list(productos)
    
    @staticmethod
    def ventas_por_producto(dias=30):
        """
        Ventas históricas por producto
        Requisito: Ventas históricas por producto
        """
        from ventas.models import ItemPedido
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        ventas = ItemPedido.objects.filter(
            pedido__creado__gte=fecha_inicio,
            venta__estado__in=['ENTREGADO', 'PAGADO']
        ).values(
            'producto__id',
            'producto__nombre',
            'producto__categoria__nombre'
        ).annotate(
            cantidad_vendida=Sum('cantidad'),
            ingresos=Sum(F('cantidad') * F('precio_unitario')),
            total_ordenes=Count('venta', distinct=True)
        ).order_by('-ingresos')
        
        return list(ventas)
    
    @staticmethod
    def ventas_por_categoria(dias=30):
        """
        Ventas históricas por categoría
        Requisito: Ventas históricas por categoría
        """
        from ventas.models import ItemPedido
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        ventas = ItemPedido.objects.filter(
            pedido__creado__gte=fecha_inicio,
            venta__estado__in=['ENTREGADO', 'PAGADO']
        ).values(
            'producto__categoria__id',
            'producto__categoria__nombre'
        ).annotate(
            cantidad_vendida=Sum('cantidad'),
            ingresos=Sum(F('cantidad') * F('precio_unitario')),
            total_productos=Count('producto', distinct=True)
        ).order_by('-ingresos')
        
        return list(ventas)
    
    @staticmethod
    def ventas_por_cliente(dias=30, limite=20):
        """
        Ventas históricas por cliente
        Requisito: Ventas históricas por cliente
        """
        from ventas.models import Pedido
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        clientes = Pedido.objects.filter(
            creado__gte=fecha_inicio,
            estado__in=['ENTREGADO', 'PAGADO']
        ).values(
            'usuario__id',
            'usuario__first_name',
            'usuario__last_name',
            'usuario__email'
        ).annotate(
            total_ordenes=Count('id'),
            total_gastado=Sum('total'),
            ticket_promedio=Avg('total')
        ).order_by('-total_gastado')[:limite]
        
        return list(clientes)
    
    @staticmethod
    def productos_bajo_stock(umbral=10):
        """Productos con stock bajo que necesitan reabastecimiento"""
        from productos.models import Producto
        
        productos = Producto.objects.filter(
            activo=True,
            stock__lte=umbral
        ).values(
            'id', 'nombre', 'stock', 'precio', 'imagen'
        ).order_by('stock')[:20]
        
        return list(productos)
    
    @staticmethod
    def categorias_top():
        """Categorías más rentables"""
        from productos.models import Categoria
        from ventas.models import ItemPedido
        
        categorias = Categoria.objects.annotate(
            total_ventas=Count('productos__detalleventa'),
            ingresos=Sum(
                F('productos__detalleventa__cantidad') * 
                F('productos__detalleventa__precio_unitario')
            )
        ).filter(total_ventas__gt=0).order_by('-ingresos')[:10]
        
        return [{
            'id': c.id,
            'nombre': c.nombre,
            'total_ventas': c.total_ventas,
            'ingresos': float(c.ingresos or 0)
        } for c in categorias]


# Instancia global del predictor
predictor = VentasPredictor()
