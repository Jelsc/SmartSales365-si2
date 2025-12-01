"""
Integración del módulo AFP con el sistema de ventas
Genera estados financieros automáticamente desde pedidos y pagos
"""
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
from ventas.models import Pedido, ItemPedido
from pagos.models import TransaccionPago
from productos.models import Producto
from .models import (
    Empresa, PeriodoFinanciero, BalanceGeneral,
    EstadoResultados, FlujoEfectivo
)


class GeneradorEstadosDesdeVentas:
    """
    Genera estados financieros automáticamente desde las ventas del sistema
    """
    
    @staticmethod
    def generar_estado_resultados_desde_ventas(
        empresa: Empresa,
        periodo: PeriodoFinanciero,
        fecha_inicio: datetime,
        fecha_fin: datetime
    ) -> EstadoResultados:
        """
        Genera Estado de Resultados desde las ventas del periodo
        
        Ventas Netas = Total de pedidos PAGADOS/ENTREGADOS
        COGS = Costo de productos vendidos (si tienes costo en productos)
        Gastos Operativos = Puedes configurarlos manualmente o desde otros módulos
        """
        
        # Ventas Netas: Suma de pedidos pagados/entregados en el periodo
        pedidos_periodo = Pedido.objects.filter(
            creado__gte=fecha_inicio,
            creado__lte=fecha_fin,
            estado__in=['PAGADO', 'ENTREGADO']
        )
        
        ventas_netas = pedidos_periodo.aggregate(
            total=Sum('total')
        )['total'] or Decimal('0')
        
        # Descuentos aplicados
        descuentos = pedidos_periodo.aggregate(
            total=Sum('descuento')
        )['total'] or Decimal('0')
        
        ventas_netas = ventas_netas - descuentos
        
        # COGS (Costo de Ventas): Suma del costo de productos vendidos
        # Si tus productos tienen un campo 'costo' o 'precio_costo', úsalo
        # Si no, puedes calcularlo como % del precio o configurarlo manualmente
        items_vendidos = ItemPedido.objects.filter(
            pedido__in=pedidos_periodo
        )
        
        # Intentar obtener costo de productos
        # Si existe campo 'costo', usarlo; si no, usar 70% del precio como estimación
        costo_ventas = Decimal('0')
        for item in items_vendidos:
            producto = item.producto
            # Intentar obtener costo del producto (si existe el campo)
            if hasattr(producto, 'costo') and producto.costo is not None:
                costo_unitario = producto.costo
            else:
                # Si no existe campo costo, estimar 70% del precio como costo
                costo_unitario = item.precio_unitario * Decimal('0.7')
            costo_ventas += costo_unitario * item.cantidad
        
        # Gastos operativos: Puedes configurarlos manualmente o desde otros módulos
        # Por ahora, estimamos 15% de las ventas como gastos operativos
        gastos_operativos = ventas_netas * Decimal('0.15')
        
        # Gastos financieros: Comisiones de pagos
        # Usar transacciones exitosas del periodo
        transacciones_periodo = TransaccionPago.objects.filter(
            creado__gte=fecha_inicio,
            creado__lte=fecha_fin,
            estado='EXITOSO'
        )
        
        # Calcular comisiones estimadas (puedes ajustar según tu lógica)
        # Por ahora, estimamos 3% de comisión sobre el monto total
        gastos_financieros = Decimal('0')
        for transaccion in transacciones_periodo:
            # Estimar comisión (ajusta según tu lógica de comisiones)
            comision_estimada = transaccion.monto * Decimal('0.03')  # 3% estimado
            gastos_financieros += comision_estimada
        
        # Impuestos: Ya están en los pedidos
        impuestos = pedidos_periodo.aggregate(
            total=Sum('impuestos')
        )['total'] or Decimal('0')
        
        # Crear o actualizar Estado de Resultados
        estado, created = EstadoResultados.objects.update_or_create(
            periodo=periodo,
            defaults={
                'ventas_netas': ventas_netas,
                'otros_ingresos': Decimal('0'),
                'costo_ventas': costo_ventas,
                'gastos_operativos': gastos_operativos,
                'gastos_financieros': gastos_financieros,
                'impuestos': impuestos,
            }
        )
        
        return estado
    
    @staticmethod
    def generar_balance_desde_ventas(
        empresa: Empresa,
        periodo: PeriodoFinanciero,
        fecha_corte: datetime
    ) -> BalanceGeneral:
        """
        Genera Balance General desde las ventas y pagos
        
        Activo Corriente:
        - Caja y Bancos: Pagos recibidos pendientes de retiro
        - Cuentas por Cobrar: Pedidos PENDIENTE/PROCESANDO (no pagados)
        - Inventarios: Valor de stock actual
        
        Pasivo Corriente:
        - Cuentas por Pagar: Puedes configurarlo manualmente
        """
        
        # CAJA Y BANCOS: Transacciones exitosas
        transacciones_exitosas = TransaccionPago.objects.filter(
            estado='EXITOSO',
            creado__lte=fecha_corte
        ).aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0')
        
        # Restar comisiones estimadas (3% del total)
        comisiones_totales = transacciones_exitosas * Decimal('0.03')
        pagos_completados = transacciones_exitosas - comisiones_totales
        
        # CUENTAS POR COBRAR: Pedidos no pagados
        pedidos_por_cobrar = Pedido.objects.filter(
            estado__in=['PENDIENTE', 'PROCESANDO'],
            creado__lte=fecha_corte
        ).aggregate(
            total=Sum('total')
        )['total'] or Decimal('0')
        
        # INVENTARIOS: Valor del stock actual
        # Usar costo si existe, sino precio de venta
        inventarios = Decimal('0')
        for producto in Producto.objects.all():
            if producto.stock > 0:
                # Si tiene costo, usar costo; si no, usar precio
                valor_unitario = producto.costo if (hasattr(producto, 'costo') and producto.costo is not None) else producto.precio
                inventarios += Decimal(str(producto.stock)) * valor_unitario
        
        # OTROS ACTIVOS CORRIENTES: Puedes configurarlo manualmente
        otros_activos_corrientes = Decimal('0')
        
        # ACTIVO NO CORRIENTE: Configurar manualmente
        propiedades_planta_equipo = Decimal('0')
        inversiones_largo_plazo = Decimal('0')
        intangibles = Decimal('0')
        otros_activos_no_corrientes = Decimal('0')
        
        # PASIVO CORRIENTE: Configurar manualmente o desde otros módulos
        cuentas_por_pagar = Decimal('0')
        prestamos_corto_plazo = Decimal('0')
        pasivos_acreedores = Decimal('0')
        otros_pasivos_corrientes = Decimal('0')
        
        # PASIVO NO CORRIENTE: Configurar manualmente
        prestamos_largo_plazo = Decimal('0')
        otros_pasivos_no_corrientes = Decimal('0')
        
        # PATRIMONIO: Calcular desde utilidades acumuladas
        # Utilidades acumuladas = Suma de utilidades netas de periodos anteriores
        periodos_anteriores = PeriodoFinanciero.objects.filter(
            empresa=empresa,
            fecha_cierre__lt=periodo.fecha_cierre
        )
        
        utilidades_acumuladas = Decimal('0')
        for p_anterior in periodos_anteriores:
            try:
                er_anterior = p_anterior.estado_resultados
                utilidades_acumuladas += er_anterior.utilidad_neta
            except:
                pass
        
        # Si no hay periodos anteriores y no hay utilidades acumuladas,
        # usar la utilidad neta del periodo actual como patrimonio inicial
        # (esto es para el primer periodo de un negocio nuevo)
        if utilidades_acumuladas == 0:
            try:
                estado_actual = periodo.estado_resultados
                if estado_actual.utilidad_neta > 0:
                    # Si hay utilidad neta positiva, usarla como patrimonio inicial
                    utilidades_acumuladas = estado_actual.utilidad_neta
            except EstadoResultados.DoesNotExist:
                # Si el estado de resultados aún no existe, intentar calcularlo desde las ventas
                # Esto puede pasar si se genera el balance antes del estado de resultados
                pass
            except:
                pass
        
        # Inicializar patrimonio base
        capital_social = Decimal('0')  # Configurar manualmente
        reservas = Decimal('0')  # Configurar manualmente
        otros_patrimonios = Decimal('0')
        
        # Calcular activos y pasivos totales para asegurar que el balance cuadre
        activos_totales = (
            pagos_completados + pedidos_por_cobrar + inventarios + otros_activos_corrientes +
            propiedades_planta_equipo + inversiones_largo_plazo + intangibles + otros_activos_no_corrientes
        )
        pasivos_totales = (
            cuentas_por_pagar + prestamos_corto_plazo + pasivos_acreedores + otros_pasivos_corrientes +
            prestamos_largo_plazo + otros_pasivos_no_corrientes
        )
        
        # Calcular patrimonio necesario para que el balance cuadre
        # Balance debe cuadrar: Activos = Pasivos + Patrimonio
        # Por lo tanto: Patrimonio = Activos - Pasivos
        patrimonio_necesario = activos_totales - pasivos_totales
        
        # Calcular patrimonio actual (sin incluir el ajuste aún)
        patrimonio_actual = capital_social + reservas + utilidades_acumuladas + otros_patrimonios
        
        # Asegurar que el patrimonio sea al menos el necesario para que el balance cuadre
        # Si el patrimonio actual es menor al necesario, ajustar utilidades_acumuladas
        if patrimonio_actual < patrimonio_necesario:
            # La diferencia debe ir a utilidades_acumuladas
            diferencia = patrimonio_necesario - patrimonio_actual
            utilidades_acumuladas += diferencia
        # Si el patrimonio actual es mayor, mantenerlo (puede ser de periodos anteriores)
        
        # Log para debugging (puedes removerlo después)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Balance cálculo - Activos: {activos_totales}, Pasivos: {pasivos_totales}, Patrimonio necesario: {patrimonio_necesario}, Utilidades acumuladas: {utilidades_acumuladas}")
        
        # Crear o actualizar Balance General
        balance, created = BalanceGeneral.objects.update_or_create(
            periodo=periodo,
            defaults={
                # Activo Corriente
                'caja_bancos': pagos_completados,
                'cuentas_por_cobrar': pedidos_por_cobrar,
                'inventarios': inventarios,
                'otros_activos_corrientes': otros_activos_corrientes,
                # Activo No Corriente
                'propiedades_planta_equipo': propiedades_planta_equipo,
                'inversiones_largo_plazo': inversiones_largo_plazo,
                'intangibles': intangibles,
                'otros_activos_no_corrientes': otros_activos_no_corrientes,
                # Pasivo Corriente
                'cuentas_por_pagar': cuentas_por_pagar,
                'prestamos_corto_plazo': prestamos_corto_plazo,
                'pasivos_acreedores': pasivos_acreedores,
                'otros_pasivos_corrientes': otros_pasivos_corrientes,
                # Pasivo No Corriente
                'prestamos_largo_plazo': prestamos_largo_plazo,
                'otros_pasivos_no_corrientes': otros_pasivos_no_corrientes,
                # Patrimonio
                'capital_social': capital_social,
                'reservas': reservas,
                'utilidades_acumuladas': utilidades_acumuladas,
                'otros_patrimonios': otros_patrimonios,
            }
        )
        
        return balance
    
    @staticmethod
    def generar_flujo_efectivo_desde_ventas(
        empresa: Empresa,
        periodo: PeriodoFinanciero,
        fecha_inicio: datetime,
        fecha_fin: datetime
    ) -> FlujoEfectivo:
        """
        Genera Flujo de Efectivo desde pagos y gastos
        """
        
        # Obtener estado de resultados
        try:
            estado = periodo.estado_resultados
            utilidad_neta = estado.utilidad_neta
        except:
            utilidad_neta = Decimal('0')
        
        # ACTIVIDADES OPERATIVAS
        # Depreciación: Configurar manualmente
        ajustes_depreciacion = Decimal('0')
        
        # Cambios en capital de trabajo
        # Calcular diferencia de activos/pasivos corrientes entre periodos
        cambios_capital_trabajo = Decimal('0')
        try:
            periodo_anterior = PeriodoFinanciero.objects.filter(
                empresa=empresa,
                fecha_cierre__lt=periodo.fecha_cierre
            ).order_by('-fecha_cierre').first()
            
            if periodo_anterior:
                balance_anterior = periodo_anterior.balance_general
                balance_actual = periodo.balance_general
                
                activo_corriente_anterior = balance_anterior.activo_corriente
                pasivo_corriente_anterior = balance_anterior.pasivo_corriente
                capital_trabajo_anterior = activo_corriente_anterior - pasivo_corriente_anterior
                
                activo_corriente_actual = balance_actual.activo_corriente
                pasivo_corriente_actual = balance_actual.pasivo_corriente
                capital_trabajo_actual = activo_corriente_actual - pasivo_corriente_actual
                
                cambios_capital_trabajo = capital_trabajo_anterior - capital_trabajo_actual
        except:
            pass
        
        flujo_operativo = utilidad_neta + ajustes_depreciacion - cambios_capital_trabajo
        
        # ACTIVIDADES DE INVERSIÓN
        compras_activos_fijos = Decimal('0')  # Configurar manualmente
        ventas_activos_fijos = Decimal('0')  # Configurar manualmente
        flujo_inversion = ventas_activos_fijos - compras_activos_fijos
        
        # ACTIVIDADES DE FINANCIAMIENTO
        prestamos_recibidos = Decimal('0')  # Configurar manualmente
        pago_prestamos = Decimal('0')  # Configurar manualmente
        flujo_financiamiento = prestamos_recibidos - pago_prestamos
        
        # Crear o actualizar Flujo de Efectivo
        flujo, created = FlujoEfectivo.objects.update_or_create(
            periodo=periodo,
            defaults={
                'utilidad_neta': utilidad_neta,
                'ajustes_depreciacion': ajustes_depreciacion,
                'cambios_capital_trabajo': cambios_capital_trabajo,
                'flujo_operativo': flujo_operativo,
                'compras_activos_fijos': compras_activos_fijos,
                'ventas_activos_fijos': ventas_activos_fijos,
                'flujo_inversion': flujo_inversion,
                'prestamos_recibidos': prestamos_recibidos,
                'pago_prestamos': pago_prestamos,
                'flujo_financiamiento': flujo_financiamiento,
            }
        )
        
        return flujo
    
    @staticmethod
    def generar_periodo_completo_desde_ventas(
        empresa: Empresa,
        tipo_periodo: str,
        año: int,
        mes: int = None,
        trimestre: int = None
    ) -> PeriodoFinanciero:
        """
        Genera un periodo financiero completo desde las ventas automáticamente
        """
        from datetime import date
        
        # Calcular fechas del periodo
        if tipo_periodo == 'MES':
            fecha_inicio = date(año, mes, 1)
            if mes == 12:
                fecha_fin = date(año + 1, 1, 1) - timedelta(days=1)
            else:
                fecha_fin = date(año, mes + 1, 1) - timedelta(days=1)
        elif tipo_periodo == 'TRIMESTRE':
            mes_inicio = (trimestre - 1) * 3 + 1
            fecha_inicio = date(año, mes_inicio, 1)
            if trimestre == 4:
                fecha_fin = date(año + 1, 1, 1) - timedelta(days=1)
            else:
                fecha_fin = date(año, mes_inicio + 3, 1) - timedelta(days=1)
        else:  # AÑO
            fecha_inicio = date(año, 1, 1)
            fecha_fin = date(año, 12, 31)
        
        # Convertir a datetime para consultas
        fecha_inicio_dt = timezone.make_aware(datetime.combine(fecha_inicio, datetime.min.time()))
        fecha_fin_dt = timezone.make_aware(datetime.combine(fecha_fin, datetime.max.time()))
        
        # Crear periodo
        periodo = PeriodoFinanciero.objects.create(
            empresa=empresa,
            tipo_periodo=tipo_periodo,
            año=año,
            mes=mes,
            trimestre=trimestre,
            fecha_cierre=fecha_fin,
            version=1
        )
        
        # Generar estados financieros
        GeneradorEstadosDesdeVentas.generar_estado_resultados_desde_ventas(
            empresa, periodo, fecha_inicio_dt, fecha_fin_dt
        )
        
        GeneradorEstadosDesdeVentas.generar_balance_desde_ventas(
            empresa, periodo, fecha_fin_dt
        )
        
        GeneradorEstadosDesdeVentas.generar_flujo_efectivo_desde_ventas(
            empresa, periodo, fecha_inicio_dt, fecha_fin_dt
        )
        
        return periodo

