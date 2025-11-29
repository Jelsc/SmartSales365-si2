"""
Servicios para cálculos financieros y análisis
"""
from decimal import Decimal
from typing import Dict, Optional, List
from .models import BalanceGeneral, EstadoResultados, FlujoEfectivo, ConfiguracionAlerta


class CalculadoraRatios:
    """Calculadora de ratios financieros"""

    @staticmethod
    def calcular_ratios_liquidez(balance: BalanceGeneral) -> Dict[str, Decimal]:
        """Calcula ratios de liquidez"""
        ratios = {}
        
        # Ratio Corriente
        if balance.pasivo_corriente > 0:
            ratios['liquidez_corriente'] = balance.activo_corriente / balance.pasivo_corriente
        else:
            ratios['liquidez_corriente'] = Decimal('0')
        
        # Prueba Ácida
        activo_liquido = balance.activo_corriente - balance.inventarios
        if balance.pasivo_corriente > 0:
            ratios['prueba_acida'] = activo_liquido / balance.pasivo_corriente
        else:
            ratios['prueba_acida'] = Decimal('0')
        
        return ratios

    @staticmethod
    def calcular_ratios_gestion(
        balance: BalanceGeneral,
        estado: EstadoResultados,
        balance_anterior: Optional[BalanceGeneral] = None
    ) -> Dict[str, Decimal]:
        """Calcula ratios de gestión/actividad"""
        ratios = {}
        
        # Rotación de Inventario
        inventario_promedio = balance.inventarios
        if balance_anterior:
            inventario_promedio = (balance.inventarios + balance_anterior.inventarios) / 2
        
        if inventario_promedio > 0:
            ratios['rotacion_inventario'] = estado.costo_ventas / inventario_promedio
            ratios['dias_inventario'] = Decimal('365') / ratios['rotacion_inventario']
        else:
            ratios['rotacion_inventario'] = Decimal('0')
            ratios['dias_inventario'] = Decimal('0')
        
        # Rotación de Cuentas por Cobrar
        cxc_promedio = balance.cuentas_por_cobrar
        if balance_anterior:
            cxc_promedio = (balance.cuentas_por_cobrar + balance_anterior.cuentas_por_cobrar) / 2
        
        if cxc_promedio > 0:
            ratios['rotacion_cxc'] = estado.ventas_netas / cxc_promedio
            ratios['dias_cobro'] = Decimal('365') / ratios['rotacion_cxc']
        else:
            ratios['rotacion_cxc'] = Decimal('0')
            ratios['dias_cobro'] = Decimal('0')
        
        # Rotación de Cuentas por Pagar
        cxp_promedio = balance.cuentas_por_pagar
        if balance_anterior:
            cxp_promedio = (balance.cuentas_por_pagar + balance_anterior.cuentas_por_pagar) / 2
        
        if cxp_promedio > 0:
            ratios['rotacion_cxp'] = estado.costo_ventas / cxp_promedio
            ratios['dias_pago'] = Decimal('365') / ratios['rotacion_cxp']
        else:
            ratios['rotacion_cxp'] = Decimal('0')
            ratios['dias_pago'] = Decimal('0')
        
        return ratios

    @staticmethod
    def calcular_ratios_endeudamiento(balance: BalanceGeneral, estado: EstadoResultados) -> Dict[str, Decimal]:
        """Calcula ratios de endeudamiento"""
        ratios = {}
        
        total_deuda = balance.total_pasivo
        
        # Deuda/Activo
        if balance.total_activo > 0:
            ratios['deuda_activo'] = total_deuda / balance.total_activo
        else:
            ratios['deuda_activo'] = Decimal('0')
        
        # Deuda/Patrimonio
        if balance.total_patrimonio > 0:
            ratios['deuda_patrimonio'] = total_deuda / balance.total_patrimonio
        else:
            ratios['deuda_patrimonio'] = Decimal('0')
        
        # Cobertura de Intereses
        if estado.gastos_financieros > 0:
            ratios['cobertura_intereses'] = estado.ebit / estado.gastos_financieros
        else:
            ratios['cobertura_intereses'] = Decimal('999999')  # Infinito prácticamente
        
        return ratios

    @staticmethod
    def calcular_ratios_rentabilidad(
        balance: BalanceGeneral,
        estado: EstadoResultados,
        balance_anterior: Optional[BalanceGeneral] = None
    ) -> Dict[str, Decimal]:
        """Calcula ratios de rentabilidad (DuPont)"""
        ratios = {}
        
        # Margen Neto
        if estado.ventas_netas > 0:
            ratios['margen_neto'] = estado.utilidad_neta / estado.ventas_netas
        else:
            ratios['margen_neto'] = Decimal('0')
        
        # Rotación de Activos
        activos_promedio = balance.total_activo
        if balance_anterior:
            activos_promedio = (balance.total_activo + balance_anterior.total_activo) / 2
        
        if activos_promedio > 0:
            ratios['rotacion_activos'] = estado.ventas_netas / activos_promedio
        else:
            ratios['rotacion_activos'] = Decimal('0')
        
        # ROA (Return on Assets)
        if activos_promedio > 0:
            ratios['roa'] = estado.utilidad_neta / activos_promedio
        else:
            ratios['roa'] = Decimal('0')
        
        # ROE DuPont
        patrimonio_promedio = balance.total_patrimonio
        if balance_anterior:
            patrimonio_promedio = (balance.total_patrimonio + balance_anterior.total_patrimonio) / 2
        
        if patrimonio_promedio > 0:
            apalancamiento = activos_promedio / patrimonio_promedio
            ratios['roe_dupont'] = ratios['margen_neto'] * ratios['rotacion_activos'] * apalancamiento
            ratios['apalancamiento'] = apalancamiento
        else:
            ratios['roe_dupont'] = Decimal('0')
            ratios['apalancamiento'] = Decimal('0')
        
        return ratios

    @staticmethod
    def calcular_todos_los_ratios(
        balance: BalanceGeneral,
        estado: EstadoResultados,
        balance_anterior: Optional[BalanceGeneral] = None
    ) -> Dict[str, any]:
        """Calcula todos los ratios financieros"""
        return {
            'liquidez': CalculadoraRatios.calcular_ratios_liquidez(balance),
            'gestion': CalculadoraRatios.calcular_ratios_gestion(balance, estado, balance_anterior),
            'endeudamiento': CalculadoraRatios.calcular_ratios_endeudamiento(balance, estado),
            'rentabilidad': CalculadoraRatios.calcular_ratios_rentabilidad(balance, estado, balance_anterior),
        }


class AnalizadorPatrimonial:
    """Analizador patrimonial (vertical y horizontal)"""

    @staticmethod
    def analisis_vertical(balance: BalanceGeneral) -> Dict[str, Dict[str, Decimal]]:
        """Análisis vertical (% sobre total)"""
        analisis = {
            'activo': {},
            'pasivo_patrimonio': {}
        }
        
        total_activo = balance.total_activo
        total_pasivo_patrimonio = balance.pasivo_mas_patrimonio
        
        if total_activo > 0:
            analisis['activo'] = {
                'caja_bancos': (balance.caja_bancos / total_activo) * 100,
                'cuentas_por_cobrar': (balance.cuentas_por_cobrar / total_activo) * 100,
                'inventarios': (balance.inventarios / total_activo) * 100,
                'otros_activos_corrientes': (balance.otros_activos_corrientes / total_activo) * 100,
                'propiedades_planta_equipo': (balance.propiedades_planta_equipo / total_activo) * 100,
                'inversiones_largo_plazo': (balance.inversiones_largo_plazo / total_activo) * 100,
                'intangibles': (balance.intangibles / total_activo) * 100,
                'otros_activos_no_corrientes': (balance.otros_activos_no_corrientes / total_activo) * 100,
            }
        
        if total_pasivo_patrimonio > 0:
            analisis['pasivo_patrimonio'] = {
                'cuentas_por_pagar': (balance.cuentas_por_pagar / total_pasivo_patrimonio) * 100,
                'prestamos_corto_plazo': (balance.prestamos_corto_plazo / total_pasivo_patrimonio) * 100,
                'pasivos_acreedores': (balance.pasivos_acreedores / total_pasivo_patrimonio) * 100,
                'otros_pasivos_corrientes': (balance.otros_pasivos_corrientes / total_pasivo_patrimonio) * 100,
                'prestamos_largo_plazo': (balance.prestamos_largo_plazo / total_pasivo_patrimonio) * 100,
                'otros_pasivos_no_corrientes': (balance.otros_pasivos_no_corrientes / total_pasivo_patrimonio) * 100,
                'capital_social': (balance.capital_social / total_pasivo_patrimonio) * 100,
                'reservas': (balance.reservas / total_pasivo_patrimonio) * 100,
                'utilidades_acumuladas': (balance.utilidades_acumuladas / total_pasivo_patrimonio) * 100,
                'otros_patrimonios': (balance.otros_patrimonios / total_pasivo_patrimonio) * 100,
            }
        
        return analisis

    @staticmethod
    def analisis_horizontal(
        balance_actual: BalanceGeneral,
        balance_anterior: BalanceGeneral
    ) -> Dict[str, Dict[str, Decimal]]:
        """Análisis horizontal (variación %)"""
        analisis = {
            'activo': {},
            'pasivo_patrimonio': {}
        }
        
        def calcular_variacion(actual: Decimal, anterior: Decimal) -> Decimal:
            if anterior == 0:
                return Decimal('0') if actual == 0 else Decimal('100')
            return ((actual - anterior) / anterior) * 100
        
        analisis['activo'] = {
            'caja_bancos': calcular_variacion(balance_actual.caja_bancos, balance_anterior.caja_bancos),
            'cuentas_por_cobrar': calcular_variacion(balance_actual.cuentas_por_cobrar, balance_anterior.cuentas_por_cobrar),
            'inventarios': calcular_variacion(balance_actual.inventarios, balance_anterior.inventarios),
            'otros_activos_corrientes': calcular_variacion(balance_actual.otros_activos_corrientes, balance_anterior.otros_activos_corrientes),
            'propiedades_planta_equipo': calcular_variacion(balance_actual.propiedades_planta_equipo, balance_anterior.propiedades_planta_equipo),
            'inversiones_largo_plazo': calcular_variacion(balance_actual.inversiones_largo_plazo, balance_anterior.inversiones_largo_plazo),
            'intangibles': calcular_variacion(balance_actual.intangibles, balance_anterior.intangibles),
            'otros_activos_no_corrientes': calcular_variacion(balance_actual.otros_activos_no_corrientes, balance_anterior.otros_activos_no_corrientes),
        }
        
        analisis['pasivo_patrimonio'] = {
            'cuentas_por_pagar': calcular_variacion(balance_actual.cuentas_por_pagar, balance_anterior.cuentas_por_pagar),
            'prestamos_corto_plazo': calcular_variacion(balance_actual.prestamos_corto_plazo, balance_anterior.prestamos_corto_plazo),
            'pasivos_acreedores': calcular_variacion(balance_actual.pasivos_acreedores, balance_anterior.pasivos_acreedores),
            'otros_pasivos_corrientes': calcular_variacion(balance_actual.otros_pasivos_corrientes, balance_anterior.otros_pasivos_corrientes),
            'prestamos_largo_plazo': calcular_variacion(balance_actual.prestamos_largo_plazo, balance_anterior.prestamos_largo_plazo),
            'otros_pasivos_no_corrientes': calcular_variacion(balance_actual.otros_pasivos_no_corrientes, balance_anterior.otros_pasivos_no_corrientes),
            'capital_social': calcular_variacion(balance_actual.capital_social, balance_anterior.capital_social),
            'reservas': calcular_variacion(balance_actual.reservas, balance_anterior.reservas),
            'utilidades_acumuladas': calcular_variacion(balance_actual.utilidades_acumuladas, balance_anterior.utilidades_acumuladas),
            'otros_patrimonios': calcular_variacion(balance_actual.otros_patrimonios, balance_anterior.otros_patrimonios),
        }
        
        return analisis

    @staticmethod
    def estructura_capital(balance: BalanceGeneral) -> Dict[str, Decimal]:
        """Estructura de capital"""
        estructura = {}
        
        # Pasivo/Patrimonio
        if balance.total_patrimonio > 0:
            estructura['pasivo_patrimonio'] = balance.total_pasivo / balance.total_patrimonio
        else:
            estructura['pasivo_patrimonio'] = Decimal('0')
        
        # Pasivo NC / Total Pasivos
        if balance.total_pasivo > 0:
            estructura['pasivo_nc_total'] = balance.pasivo_no_corriente / balance.total_pasivo
        else:
            estructura['pasivo_nc_total'] = Decimal('0')
        
        # Cobertura de activos corrientes vs pasivos corrientes
        if balance.pasivo_corriente > 0:
            estructura['cobertura_activos_corrientes'] = balance.activo_corriente / balance.pasivo_corriente
        else:
            estructura['cobertura_activos_corrientes'] = Decimal('0')
        
        return estructura


class CalculadoraEscenarios:
    """Calculadora de escenarios what-if"""

    @staticmethod
    def calcular_escenario(
        balance: BalanceGeneral,
        estado: EstadoResultados,
        variacion_precio: Decimal = Decimal('0'),
        variacion_costo: Decimal = Decimal('0'),
        dias_cobro: Optional[int] = None,
        dias_pago: Optional[int] = None,
        dias_inventario: Optional[int] = None
    ) -> Dict[str, any]:
        """Calcula un escenario what-if"""
        escenario = {
            'impacto_ventas': {},
            'impacto_costo': {},
            'impacto_capital_trabajo': {},
            'flujo_caja_proyectado': Decimal('0'),
            'necesidad_capital_trabajo': Decimal('0'),
        }
        
        # Impacto en ventas por variación de precio
        ventas_originales = estado.ventas_netas
        if variacion_precio != 0:
            escenario['impacto_ventas']['nuevas_ventas'] = ventas_originales * (1 + variacion_precio / 100)
            escenario['impacto_ventas']['variacion'] = ventas_originales * (variacion_precio / 100)
        else:
            escenario['impacto_ventas']['nuevas_ventas'] = ventas_originales
            escenario['impacto_ventas']['variacion'] = Decimal('0')
        
        # Impacto en costos por variación de costo
        costo_original = estado.costo_ventas
        if variacion_costo != 0:
            escenario['impacto_costo']['nuevo_costo'] = costo_original * (1 + variacion_costo / 100)
            escenario['impacto_costo']['variacion'] = costo_original * (variacion_costo / 100)
        else:
            escenario['impacto_costo']['nuevo_costo'] = costo_original
            escenario['impacto_costo']['variacion'] = Decimal('0')
        
        # Impacto en capital de trabajo
        nueva_utilidad_bruta = escenario['impacto_ventas']['nuevas_ventas'] - escenario['impacto_costo']['nuevo_costo']
        
        # Calcular nuevas cuentas por cobrar si cambian días de cobro
        nuevas_cxc = balance.cuentas_por_cobrar
        if dias_cobro is not None and escenario['impacto_ventas']['nuevas_ventas'] > 0:
            nuevas_cxc = (escenario['impacto_ventas']['nuevas_ventas'] / 365) * dias_cobro
        
        # Calcular nuevas cuentas por pagar si cambian días de pago
        nuevas_cxp = balance.cuentas_por_pagar
        if dias_pago is not None and escenario['impacto_costo']['nuevo_costo'] > 0:
            nuevas_cxp = (escenario['impacto_costo']['nuevo_costo'] / 365) * dias_pago
        
        # Calcular nuevo inventario si cambian días de inventario
        nuevo_inventario = balance.inventarios
        if dias_inventario is not None and escenario['impacto_costo']['nuevo_costo'] > 0:
            nuevo_inventario = (escenario['impacto_costo']['nuevo_costo'] / 365) * dias_inventario
        
        # Capital de trabajo necesario
        nuevo_activo_corriente = balance.caja_bancos + nuevas_cxc + nuevo_inventario + balance.otros_activos_corrientes
        nuevo_pasivo_corriente = nuevas_cxp + balance.prestamos_corto_plazo + balance.pasivos_acreedores + balance.otros_pasivos_corrientes
        
        escenario['impacto_capital_trabajo'] = {
            'nuevas_cxc': nuevas_cxc,
            'nuevas_cxp': nuevas_cxp,
            'nuevo_inventario': nuevo_inventario,
            'nuevo_activo_corriente': nuevo_activo_corriente,
            'nuevo_pasivo_corriente': nuevo_pasivo_corriente,
        }
        
        escenario['necesidad_capital_trabajo'] = nuevo_activo_corriente - nuevo_pasivo_corriente
        capital_trabajo_actual = balance.activo_corriente - balance.pasivo_corriente
        escenario['variacion_capital_trabajo'] = escenario['necesidad_capital_trabajo'] - capital_trabajo_actual
        
        # Flujo de caja proyectado (simplificado)
        nuevo_ebit = nueva_utilidad_bruta - estado.gastos_operativos
        nuevo_utilidad_antes_impuestos = nuevo_ebit - estado.gastos_financieros
        nuevo_utilidad_neta = nuevo_utilidad_antes_impuestos - estado.impuestos
        
        escenario['flujo_caja_proyectado'] = nuevo_utilidad_neta - escenario['variacion_capital_trabajo']
        
        return escenario


class EvaluadorAlertas:
    """Evaluador de alertas financieras"""

    @staticmethod
    def evaluar_alertas(ratios: Dict[str, any]) -> List[Dict[str, any]]:
        """Evalúa alertas basadas en umbrales configurados"""
        alertas = []
        
        # Obtener configuraciones activas
        configuraciones = ConfiguracionAlerta.objects.filter(activo=True)
        
        for config in configuraciones:
            valor = None
            codigo = config.codigo.lower()
            
            # Mapear códigos a valores de ratios
            if codigo == 'liquidez_corriente':
                valor = ratios.get('liquidez', {}).get('liquidez_corriente')
            elif codigo == 'prueba_acida':
                valor = ratios.get('liquidez', {}).get('prueba_acida')
            elif codigo == 'cobertura_intereses':
                valor = ratios.get('endeudamiento', {}).get('cobertura_intereses')
            elif codigo == 'deuda_activo':
                valor = ratios.get('endeudamiento', {}).get('deuda_activo')
            elif codigo == 'roa':
                valor = ratios.get('rentabilidad', {}).get('roa')
            elif codigo == 'roe':
                valor = ratios.get('rentabilidad', {}).get('roe_dupont')
            
            if valor is not None:
                estado = 'ok'
                mensaje = f"{config.nombre} está en rango normal"
                
                if config.umbral_minimo is not None and valor < config.umbral_minimo:
                    estado = 'critico'
                    mensaje = f"{config.nombre} está por debajo del umbral mínimo ({config.umbral_minimo})"
                elif config.umbral_maximo is not None and valor > config.umbral_maximo:
                    estado = 'advertencia'
                    mensaje = f"{config.nombre} está por encima del umbral máximo ({config.umbral_maximo})"
                
                alertas.append({
                    'codigo': config.codigo,
                    'nombre': config.nombre,
                    'valor': float(valor),
                    'estado': estado,
                    'mensaje': mensaje,
                    'umbral_minimo': float(config.umbral_minimo) if config.umbral_minimo else None,
                    'umbral_maximo': float(config.umbral_maximo) if config.umbral_maximo else None,
                })
        
        return alertas

