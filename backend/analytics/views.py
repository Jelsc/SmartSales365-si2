"""
Views del módulo Analytics
Endpoints para predicciones ML y estadísticas del dashboard
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncDate

from .ml_service import predictor, ProductosAnalyzer
from .serializers import (
    PrediccionVentaSerializer,
    PrediccionMesSerializer,
    ProductoTopSerializer,
    ProductoBajoStockSerializer,
    CategoriaTopSerializer,
    MetricasEntrenamientoSerializer
)


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet para analytics y predicciones del dashboard
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='metricas-generales')
    def metricas_generales(self, request):
        """
        GET /api/analytics/metricas-generales/
        Retorna métricas generales del negocio
        """
        from ventas.models import Pedido
        from productos.models import Producto
        from django.contrib.auth import get_user_model
        
        # Fecha de hace 30 días
        hace_30_dias = timezone.now() - timedelta(days=30)
        hace_60_dias = timezone.now() - timedelta(days=60)
        
        # Ventas del mes actual
        ventas_mes_actual = Pedido.objects.filter(
            creado__gte=hace_30_dias,
            estado__in=['ENTREGADO', 'PAGADO']
        ).aggregate(
            total=Sum('total'),
            cantidad=Count('id')
        )
        
        # Ventas del mes anterior (para comparación)
        ventas_mes_anterior = Pedido.objects.filter(
            creado__gte=hace_60_dias,
            creado__lt=hace_30_dias,
            estado__in=['ENTREGADO', 'PAGADO']
        ).aggregate(
            total=Sum('total'),
            cantidad=Count('id')
        )
        
        # Calcular crecimiento
        total_actual = float(ventas_mes_actual['total'] or 0)
        total_anterior = float(ventas_mes_anterior['total'] or 0)
        
        if total_anterior > 0:
            crecimiento = ((total_actual - total_anterior) / total_anterior) * 100
        else:
            crecimiento = 100 if total_actual > 0 else 0
        
        # Clientes activos (compraron en últimos 30 días)
        clientes_activos = get_user_model().objects.filter(
            pedidos__creado__gte=hace_30_dias,
            pedidos__estado__in=['ENTREGADO', 'PAGADO']
        ).distinct().count()
        
        # Productos activos
        productos_activos = Producto.objects.filter(activo=True).count()
        productos_bajo_stock = Producto.objects.filter(activo=True, stock__lte=10).count()
        
        # Ticket promedio
        if ventas_mes_actual['cantidad']:
            ticket_promedio = total_actual / ventas_mes_actual['cantidad']
        else:
            ticket_promedio = 0
        
        return Response({
            'ventas_mes': {
                'total': round(total_actual, 2),
                'cantidad_ordenes': ventas_mes_actual['cantidad'] or 0,
                'crecimiento': round(crecimiento, 1),
                'ticket_promedio': round(ticket_promedio, 2)
            },
            'productos': {
                'total_activos': productos_activos,
                'bajo_stock': productos_bajo_stock,
                'porcentaje_bajo_stock': round((productos_bajo_stock / productos_activos * 100) if productos_activos > 0 else 0, 1)
            },
            'clientes': {
                'activos_mes': clientes_activos
            }
        })
    
    @action(detail=False, methods=['get'], url_path='prediccion-ventas')
    def prediccion_ventas(self, request):
        """
        GET /api/analytics/prediccion-ventas/?dias=7
        Predice ventas para los próximos N días usando ML
        """
        dias = int(request.query_params.get('dias', 7))
        
        predicciones = predictor.predecir_proximos_dias(dias=dias)
        serializer = PrediccionVentaSerializer(predicciones, many=True)
        
        # Determinar confiabilidad basado en si hay predicciones de baja confianza
        tiene_baja_confianza = any(p.get('confianza') == 'baja' for p in predicciones)
        
        return Response({
            'predicciones': serializer.data,
            'total_estimado': sum(p['venta_estimada'] for p in predicciones),
            'modelo': 'RandomForest' if not tiene_baja_confianza else 'Datos de ejemplo',
            'confiabilidad': 'baja' if tiene_baja_confianza else 'alta'
        })
    
    @action(detail=False, methods=['get'], url_path='prediccion-mes')
    def prediccion_mes(self, request):
        """
        GET /api/analytics/prediccion-mes/
        Predice ventas totales del mes
        """
        try:
            prediccion = predictor.predecir_ventas_mes()
            serializer = PrediccionMesSerializer(prediccion)
            
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='entrenar-modelo')
    def entrenar_modelo(self, request):
        """
        POST /api/analytics/entrenar-modelo/
        Entrena/re-entrena el modelo de ML con datos históricos
        """
        try:
            resultados = predictor.entrenar_modelo()
            serializer = MetricasEntrenamientoSerializer(resultados)
            
            return Response({
                'mensaje': 'Modelo entrenado exitosamente',
                'metricas': serializer.data
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='productos-top')
    def productos_top(self, request):
        """
        GET /api/analytics/productos-top/?limite=10
        Productos más vendidos
        """
        limite = int(request.query_params.get('limite', 10))
        
        productos = ProductosAnalyzer.productos_mas_vendidos(limite=limite)
        serializer = ProductoTopSerializer(productos, many=True)
        
        return Response({
            'productos': serializer.data,
            'total': len(productos)
        })
    
    @action(detail=False, methods=['get'], url_path='productos-bajo-stock')
    def productos_bajo_stock(self, request):
        """
        GET /api/analytics/productos-bajo-stock/?umbral=10
        Productos con stock bajo
        """
        umbral = int(request.query_params.get('umbral', 10))
        
        productos = ProductosAnalyzer.productos_bajo_stock(umbral=umbral)
        serializer = ProductoBajoStockSerializer(productos, many=True)
        
        return Response({
            'productos': serializer.data,
            'total': len(productos),
            'umbral': umbral
        })
    
    @action(detail=False, methods=['get'], url_path='categorias-top')
    def categorias_top(self, request):
        """
        GET /api/analytics/categorias-top/
        Categorías más rentables
        """
        categorias = ProductosAnalyzer.categorias_top()
        serializer = CategoriaTopSerializer(categorias, many=True)
        
        return Response({
            'categorias': serializer.data,
            'total': len(categorias)
        })
    
    @action(detail=False, methods=['get'], url_path='grafico-ventas-diarias')
    def grafico_ventas_diarias(self, request):
        """
        GET /api/analytics/grafico-ventas-diarias/?dias=30
        Datos para gráfico de ventas por día (últimos N días)
        """
        from ventas.models import Pedido
        
        dias = int(request.query_params.get('dias', 30))
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        ventas_por_dia = Pedido.objects.filter(
            creado__gte=fecha_inicio,
            estado__in=['ENTREGADO', 'PAGADO']
        ).annotate(
            fecha=TruncDate('creado')
        ).values('fecha').annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('fecha')
        
        return Response({
            'datos': list(ventas_por_dia),
            'periodo': f'Últimos {dias} días'
        })
    
    @action(detail=False, methods=['get'], url_path='tendencias')
    def tendencias(self, request):
        """
        GET /api/analytics/tendencias/
        Análisis de tendencias generales
        """
        from ventas.models import Pedido
        
        # Comparar últimos 7 días vs 7 días anteriores
        hoy = timezone.now()
        hace_7 = hoy - timedelta(days=7)
        hace_14 = hoy - timedelta(days=14)
        
        ventas_semana_actual = Pedido.objects.filter(
            creado__gte=hace_7,
            estado__in=['ENTREGADO', 'PAGADO']
        ).aggregate(total=Sum('total'), cantidad=Count('id'))
        
        ventas_semana_anterior = Pedido.objects.filter(
            creado__gte=hace_14,
            creado__lt=hace_7,
            estado__in=['ENTREGADO', 'PAGADO']
        ).aggregate(total=Sum('total'), cantidad=Count('id'))
        
        total_actual = float(ventas_semana_actual['total'] or 0)
        total_anterior = float(ventas_semana_anterior['total'] or 0)
        
        if total_anterior > 0:
            tendencia = ((total_actual - total_anterior) / total_anterior) * 100
        else:
            tendencia = 100 if total_actual > 0 else 0
        
        return Response({
            'semana_actual': {
                'total': round(total_actual, 2),
                'cantidad': ventas_semana_actual['cantidad'] or 0
            },
            'semana_anterior': {
                'total': round(total_anterior, 2),
                'cantidad': ventas_semana_anterior['cantidad'] or 0
            },
            'tendencia_porcentaje': round(tendencia, 1),
            'direccion': 'alza' if tendencia > 0 else 'baja' if tendencia < 0 else 'estable'
        })
    
    @action(detail=False, methods=['get'], url_path='ventas-por-producto')
    def ventas_por_producto(self, request):
        """
        GET /api/analytics/dashboard/ventas-por-producto/?dias=30
        Ventas históricas por producto (REQUISITO)
        """
        dias = int(request.query_params.get('dias', 30))
        
        productos = ProductosAnalyzer.ventas_por_producto(dias=dias)
        
        return Response({
            'productos': productos,
            'total': len(productos),
            'periodo': f'Últimos {dias} días'
        })
    
    @action(detail=False, methods=['get'], url_path='ventas-por-categoria')
    def ventas_por_categoria(self, request):
        """
        GET /api/analytics/dashboard/ventas-por-categoria/?dias=30
        Ventas históricas por categoría (REQUISITO)
        Para predicciones futuras por categoría
        """
        dias = int(request.query_params.get('dias', 30))
        
        categorias = ProductosAnalyzer.ventas_por_categoria(dias=dias)
        
        return Response({
            'categorias': categorias,
            'total': len(categorias),
            'periodo': f'Últimos {dias} días'
        })
    
    @action(detail=False, methods=['get'], url_path='ventas-por-cliente')
    def ventas_por_cliente(self, request):
        """
        GET /api/analytics/dashboard/ventas-por-cliente/?dias=30&limite=20
        Ventas históricas por cliente (REQUISITO)
        """
        dias = int(request.query_params.get('dias', 30))
        limite = int(request.query_params.get('limite', 20))
        
        clientes = ProductosAnalyzer.ventas_por_cliente(dias=dias, limite=limite)
        
        return Response({
            'clientes': clientes,
            'total': len(clientes),
            'periodo': f'Últimos {dias} días'
        })
    
    @action(detail=False, methods=['get'], url_path='ventas-por-periodo')
    def ventas_por_periodo(self, request):
        """
        GET /api/analytics/dashboard/ventas-por-periodo/?periodo=semanal
        Ventas históricas por período (REQUISITO)
        
        Parámetros:
        - periodo: 'diario', 'semanal', 'mensual' (default: semanal)
        - dias: últimos N días para analizar (default: 90)
        """
        from ventas.models import Pedido
        from django.db.models.functions import TruncWeek, TruncMonth
        
        periodo = request.query_params.get('periodo', 'semanal')
        dias = int(request.query_params.get('dias', 90))
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        ventas_query = Pedido.objects.filter(
            creado__gte=fecha_inicio,
            estado__in=['ENTREGADO', 'PAGADO']
        )
        
        if periodo == 'diario':
            ventas = ventas_query.annotate(
                periodo=TruncDate('creado')
            ).values('periodo').annotate(
                total=Sum('total'),
                cantidad=Count('id')
            ).order_by('periodo')
        elif periodo == 'semanal':
            ventas = ventas_query.annotate(
                periodo=TruncWeek('creado')
            ).values('periodo').annotate(
                total=Sum('total'),
                cantidad=Count('id')
            ).order_by('periodo')
        elif periodo == 'mensual':
            ventas = ventas_query.annotate(
                periodo=TruncMonth('creado')
            ).values('periodo').annotate(
                total=Sum('total'),
                cantidad=Count('id')
            ).order_by('periodo')
        else:
            return Response({
                'error': 'Período inválido. Use: diario, semanal, mensual'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'periodo_tipo': periodo,
            'datos': list(ventas),
            'total_registros': len(ventas)
        })
