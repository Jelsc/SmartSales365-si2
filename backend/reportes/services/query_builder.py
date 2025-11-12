"""
QueryBuilder: Servicio para construir consultas dinámicas de Django ORM.
Genera queries complejas con agrupaciones y agregaciones.
"""
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDate
from typing import Dict, Any, List
from datetime import date


class QueryBuilder:
    """
    Servicio para construir consultas dinámicas de Django ORM.
    Evita SQL crudo y aprovecha el ORM para seguridad y mantenibilidad.
    """

    def construir_query_ventas(self, parametros: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de ventas.
        
        Args:
            parametros: Dict con 'periodo', 'agrupacion', 'filtros'
            
        Returns:
            List[Dict]: Lista de resultados con agregaciones
        """
        from payments.models import Pago
        
        periodo = parametros.get('periodo', {})
        agrupacion = parametros.get('agrupacion', 'ninguno')
        filtros = parametros.get('filtros', {})
        
        # Query base: pagos completados en el período
        query = Pago.objects.filter(estado='completado')
        
        # Filtrar por período
        if periodo.get('inicio') and periodo.get('fin'):
            query = query.filter(
                created_at__range=[periodo['inicio'], periodo['fin']]
            )
        
        # Agrupar según parámetro
        if agrupacion == 'producto':
            # Como Pago no tiene relación con Producto, retornar resumen general
            resultados = query.aggregate(
                total_vendido=Sum('monto'),
                cantidad_ventas=Count('id'),
                ticket_promedio=Avg('monto')
            )
            
            resultados_list = [{
                'concepto': 'Total de ventas',
                'total_vendido': float(resultados['total_vendido'] or 0),
                'cantidad_ventas': resultados['cantidad_ventas'] or 0,
                'ticket_promedio': float(resultados['ticket_promedio'] or 0),
            }]
            
        elif agrupacion == 'cliente':
            # Agrupar por cliente
            resultados = query.values(
                'usuario__first_name',
                'usuario__last_name',
                'usuario__email'
            ).annotate(
                total_gastado=Sum('monto'),
                cantidad_compras=Count('id'),
                ticket_promedio=Avg('monto')
            ).order_by(filtros.get('orden', '-total_gastado'))
            
            resultados_list = []
            for item in resultados:
                nombre_completo = f"{item['usuario__first_name']} {item['usuario__last_name']}".strip()
                if not nombre_completo:
                    nombre_completo = item['usuario__email']
                
                resultados_list.append({
                    'cliente': nombre_completo,
                    'email': item['usuario__email'],
                    'total_gastado': float(item['total_gastado'] or 0),
                    'cantidad_compras': item['cantidad_compras'],
                    'ticket_promedio': float(item['ticket_promedio'] or 0),
                })
        
        elif agrupacion == 'fecha':
            # Agrupar por fecha
            resultados = query.annotate(
                fecha_venta=TruncDate('created_at')
            ).values('fecha_venta').annotate(
                total_vendido=Sum('monto'),
                cantidad_ventas=Count('id'),
                ticket_promedio=Avg('monto')
            ).order_by('-fecha_venta')
            
            resultados_list = []
            for item in resultados:
                resultados_list.append({
                    'fecha': item['fecha_venta'].isoformat() if item['fecha_venta'] else None,
                    'total_vendido': float(item['total_vendido'] or 0),
                    'cantidad_ventas': item['cantidad_ventas'],
                    'ticket_promedio': float(item['ticket_promedio'] or 0),
                })
        
        else:
            # Sin agrupación: totales generales
            totales = query.aggregate(
                total_vendido=Sum('monto'),
                cantidad_ventas=Count('id'),
                ticket_promedio=Avg('monto')
            )
            
            resultados_list = [{
                'total_vendido': float(totales['total_vendido'] or 0),
                'cantidad_ventas': totales['cantidad_ventas'] or 0,
                'ticket_promedio': float(totales['ticket_promedio'] or 0),
            }]
        
        # Aplicar límite si existe
        if 'limit' in filtros:
            resultados_list = resultados_list[:filtros['limit']]
        
        return resultados_list

    def construir_query_productos(self, parametros: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de productos.
        
        Args:
            parametros: Dict con 'periodo', 'filtros'
            
        Returns:
            List[Dict]: Lista de productos con métricas básicas
        """
        from productos.models import Producto
        
        filtros = parametros.get('filtros', {})
        
        # Como Producto no tiene relación con Pago, retornar info básica de productos
        query = Producto.objects.filter(activo=True)
        
        # Ordenar
        orden = filtros.get('orden', '-created_at')
        query = query.order_by(orden)
        
        # Aplicar límite si existe
        if 'limit' in filtros:
            query = query[:filtros['limit']]
        
        # Convertir a lista de diccionarios
        resultados_list = []
        for producto in query:
            resultados_list.append({
                'nombre': producto.nombre,
                'precio': float(producto.precio),
                'stock': producto.stock,
                'categoria': producto.categoria.nombre if producto.categoria else 'Sin categoría',
                'activo': producto.activo,
            })
        
        return resultados_list

    def construir_query_clientes(self, parametros: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de clientes.
        """
        from django.contrib.auth import get_user_model
        from payments.models import Pago
        
        User = get_user_model()
        periodo = parametros.get('periodo', {})
        filtros = parametros.get('filtros', {})
        
        # Filtro de período
        filtro_fecha = Q()
        if periodo.get('inicio') and periodo.get('fin'):
            filtro_fecha = Q(
                pagos__created_at__range=[periodo['inicio'], periodo['fin']],
                pagos__estado='completado'
            )
        
        # Query con anotaciones
        query = User.objects.annotate(
            total_gastado=Sum('pagos__monto', filter=filtro_fecha),
            cantidad_compras=Count('pagos', filter=filtro_fecha)
        ).filter(
            cantidad_compras__gt=0
        ).order_by(filtros.get('orden', '-total_gastado'))
        
        # Aplicar límite
        if 'limit' in filtros:
            query = query[:filtros['limit']]
        
        resultados_list = []
        for user in query:
            resultados_list.append({
                'cliente': user.get_full_name() or user.email,
                'email': user.email,
                'total_gastado': float(user.total_gastado or 0),
                'cantidad_compras': user.cantidad_compras or 0,
            })
        
        return resultados_list

    def construir_query_ingresos(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """
        Construye query para reporte de ingresos (resumen general).
        """
        from payments.models import Pago
        
        periodo = parametros.get('periodo', {})
        
        # Query base
        query = Pago.objects.filter(estado='completado')
        
        # Filtrar por período
        if periodo.get('inicio') and periodo.get('fin'):
            query = query.filter(
                created_at__range=[periodo['inicio'], periodo['fin']]
            )
        
        # Agregaciones
        totales = query.aggregate(
            total_ingresos=Sum('monto'),
            cantidad_transacciones=Count('id'),
            ticket_promedio=Avg('monto')
        )
        
        return {
            'total_ingresos': float(totales['total_ingresos'] or 0),
            'cantidad_transacciones': totales['cantidad_transacciones'] or 0,
            'ticket_promedio': float(totales['ticket_promedio'] or 0),
        }