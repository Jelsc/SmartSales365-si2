"""
Generador de reportes dinámicos basado en parámetros interpretados
"""
from django.db.models import Count, Sum, Avg, Q, F, Min, Max
from django.db.models.functions import TruncDate, TruncMonth
from datetime import datetime
from typing import Dict, List
from ventas.models import Pedido, ItemPedido
from productos.models import Producto
from django.contrib.auth import get_user_model

User = get_user_model()


class ReporteGenerator:
    """
    Generador de consultas y datos para reportes
    """
    
    def generar_datos(self, parametros: Dict) -> Dict:
        """
        Generar los datos del reporte según los parámetros
        
        Args:
            parametros: Diccionario con tipo, fechas, agrupación, etc.
        
        Returns:
            {
                'datos': [...],
                'columnas': [...],
                'titulo': '...',
                'subtitulo': '...',
                'total_registros': N
            }
        """
        tipo = parametros.get('tipo', 'ventas')
        
        if tipo == 'ventas':
            return self._generar_reporte_ventas(parametros)
        elif tipo == 'productos':
            return self._generar_reporte_productos(parametros)
        elif tipo == 'clientes':
            return self._generar_reporte_clientes(parametros)
        else:
            return self._generar_reporte_ventas(parametros)
    
    def _generar_reporte_ventas(self, params: Dict) -> Dict:
        """Generar reporte de ventas"""
        queryset = Pedido.objects.filter(estado__in=['PAGADO', 'PROCESANDO', 'ENVIADO', 'ENTREGADO'])
        
        # Aplicar filtro de fechas
        if params.get('fecha_inicio'):
            queryset = queryset.filter(creado__gte=params['fecha_inicio'])
        if params.get('fecha_fin'):
            queryset = queryset.filter(creado__lte=params['fecha_fin'])
        
        agrupacion = params.get('agrupacion', [])
        
        # Caso 1: Agrupado por producto
        if 'producto' in agrupacion:
            datos = self._agrupar_por_producto(queryset, params)
            columnas = ['Producto', 'Cantidad Vendida', 'Total Ventas', 'Precio Promedio']
            titulo = 'Reporte de Ventas por Producto'
        
        # Caso 2: Agrupado por cliente
        elif 'cliente' in agrupacion:
            datos = self._agrupar_por_cliente(queryset, params)
            columnas = ['Cliente', 'Cantidad de Compras', 'Monto Total', 'Rango de Fechas']
            titulo = 'Reporte de Ventas por Cliente'
        
        # Caso 3: Agrupado por fecha
        elif 'fecha' in agrupacion or not agrupacion:
            datos = self._agrupar_por_fecha(queryset, params)
            columnas = ['Fecha', 'Cantidad de Pedidos', 'Total Vendido', 'Ticket Promedio']
            titulo = 'Reporte de Ventas Diarias'
        
        # Caso 4: Agrupado por categoría
        elif 'categoria' in agrupacion:
            datos = self._agrupar_por_categoria(queryset, params)
            columnas = ['Categoría', 'Cantidad Vendida', 'Total Ventas']
            titulo = 'Reporte de Ventas por Categoría'
        
        else:
            # Vista general
            datos = self._vista_general_ventas(queryset, params)
            columnas = ['Pedido', 'Cliente', 'Fecha', 'Total', 'Estado']
            titulo = 'Reporte General de Ventas'
        
        # Generar subtítulo con rango de fechas
        subtitulo = self._generar_subtitulo(params)
        
        return {
            'datos': datos,
            'columnas': columnas,
            'titulo': titulo,
            'subtitulo': subtitulo,
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _agrupar_por_producto(self, queryset, params) -> List[Dict]:
        """Agrupar ventas por producto"""
        items = ItemPedido.objects.filter(
            pedido__in=queryset
        ).values(
            'producto__nombre'
        ).annotate(
            cantidad_vendida=Sum('cantidad'),
            total_ventas=Sum(F('cantidad') * F('precio_unitario')),
            precio_promedio=Avg('precio_unitario')
        ).order_by('-total_ventas')
        
        return [
            {
                'producto': item['producto__nombre'],
                'cantidad_vendida': item['cantidad_vendida'],
                'total_ventas': float(item['total_ventas'] or 0),
                'precio_promedio': float(item['precio_promedio'] or 0)
            }
            for item in items
        ]
    
    def _agrupar_por_cliente(self, queryset, params) -> List[Dict]:
        """Agrupar ventas por cliente"""
        ventas = queryset.values(
            'usuario__email',
            'usuario__first_name',
            'usuario__last_name'
        ).annotate(
            cantidad_compras=Count('id'),
            monto_total=Sum('total'),
            primera_compra=Min('creado'),
            ultima_compra=Max('creado')
        ).order_by('-monto_total')
        
        
        ventas = queryset.values(
            'usuario__email',
            'usuario__first_name',
            'usuario__last_name'
        ).annotate(
            cantidad_compras=Count('id'),
            monto_total=Sum('total'),
            primera_compra=Min('creado'),
            ultima_compra=Max('creado')
        ).order_by('-monto_total')
        
        return [
            {
                'cliente': f"{venta['usuario__first_name'] or ''} {venta['usuario__last_name'] or ''}".strip() or venta['usuario__email'],
                'cantidad_compras': venta['cantidad_compras'],
                'monto_total': float(venta['monto_total'] or 0),
                'rango_fechas': f"{venta['primera_compra'].strftime('%d/%m/%Y')} - {venta['ultima_compra'].strftime('%d/%m/%Y')}"
            }
            for venta in ventas
        ]
    
    def _agrupar_por_fecha(self, queryset, params) -> List[Dict]:
        """Agrupar ventas por fecha"""
        ventas = queryset.annotate(
            fecha=TruncDate('creado')
        ).values('fecha').annotate(
            cantidad_pedidos=Count('id'),
            total_vendido=Sum('total'),
            ticket_promedio=Avg('total')
        ).order_by('-fecha')
        
        return [
            {
                'fecha': venta['fecha'].strftime('%d/%m/%Y'),
                'cantidad_pedidos': venta['cantidad_pedidos'],
                'total_vendido': float(venta['total_vendido'] or 0),
                'ticket_promedio': float(venta['ticket_promedio'] or 0)
            }
            for venta in ventas
        ]
    
    def _agrupar_por_categoria(self, queryset, params) -> List[Dict]:
        """Agrupar ventas por categoría de producto"""
        items = ItemPedido.objects.filter(
            pedido__in=queryset
        ).values(
            'producto__categoria__nombre'
        ).annotate(
            cantidad_vendida=Sum('cantidad'),
            total_ventas=Sum(F('cantidad') * F('precio_unitario'))
        ).order_by('-total_ventas')
        
        return [
            {
                'categoria': item['producto__categoria__nombre'] or 'Sin categoría',
                'cantidad_vendida': item['cantidad_vendida'],
                'total_ventas': float(item['total_ventas'] or 0)
            }
            for item in items
        ]
    
    def _vista_general_ventas(self, queryset, params) -> List[Dict]:
        """Vista general de pedidos"""
        pedidos = queryset.select_related('usuario').order_by('-creado')[:100]  # Límite de 100
        
        return [
            {
                'numero_pedido': pedido.numero_pedido,
                'cliente': pedido.usuario.email,
                'fecha': pedido.creado.strftime('%d/%m/%Y %H:%M'),
                'total': float(pedido.total),
                'estado': pedido.get_estado_display()
            }
            for pedido in pedidos
        ]
    
    def _generar_reporte_productos(self, params: Dict) -> Dict:
        """Generar reporte de productos"""
        queryset = Producto.objects.filter(activo=True)
        
        datos = [
            {
                'producto': prod.nombre,
                'sku': prod.sku,
                'categoria': prod.categoria.nombre if prod.categoria else 'Sin categoría',
                'precio': float(prod.precio),
                'stock': prod.stock,
                'stock_minimo': prod.stock_minimo
            }
            for prod in queryset.select_related('categoria')
        ]
        
        return {
            'datos': datos,
            'columnas': ['Producto', 'SKU', 'Categoría', 'Precio', 'Stock', 'Stock Mínimo'],
            'titulo': 'Reporte de Productos',
            'subtitulo': self._generar_subtitulo(params),
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _generar_reporte_clientes(self, params: Dict) -> Dict:
        """Generar reporte de clientes"""
        queryset = User.objects.filter(is_active=True).exclude(is_superuser=True)
        
        datos = [
            {
                'cliente': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
                'email': user.email,
                'fecha_registro': user.date_joined.strftime('%d/%m/%Y'),
                'total_pedidos': user.pedidos.count(),
                'total_gastado': float(user.pedidos.filter(
                    estado__in=['PAGADO', 'PROCESANDO', 'ENVIADO', 'ENTREGADO']
                ).aggregate(total=Sum('total'))['total'] or 0)
            }
            for user in queryset
        ]
        
        return {
            'datos': datos,
            'columnas': ['Cliente', 'Email', 'Fecha Registro', 'Total Pedidos', 'Total Gastado'],
            'titulo': 'Reporte de Clientes',
            'subtitulo': self._generar_subtitulo(params),
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _generar_subtitulo(self, params: Dict) -> str:
        """Generar subtítulo con información del reporte"""
        partes = []
        
        if params.get('fecha_inicio') and params.get('fecha_fin'):
            fecha_inicio = params['fecha_inicio'].strftime('%d/%m/%Y')
            fecha_fin = params['fecha_fin'].strftime('%d/%m/%Y')
            partes.append(f"Periodo: {fecha_inicio} - {fecha_fin}")
        elif params.get('fecha_inicio'):
            fecha_inicio = params['fecha_inicio'].strftime('%d/%m/%Y')
            partes.append(f"Desde: {fecha_inicio}")
        elif params.get('fecha_fin'):
            fecha_fin = params['fecha_fin'].strftime('%d/%m/%Y')
            partes.append(f"Hasta: {fecha_fin}")
        
        if params.get('agrupacion'):
            agrupacion = ', '.join(params['agrupacion'])
            partes.append(f"Agrupado por: {agrupacion}")
        
        return ' | '.join(partes) if partes else f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}"
