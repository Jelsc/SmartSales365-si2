from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Empresa(models.Model):
    """
    Empresa o Sucursal para la cual se realizarán los análisis financieros
    """
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la empresa")
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    activo = models.BooleanField(default=True, verbose_name="Activa")
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class PeriodoFinanciero(models.Model):
    """
    Representa un periodo contable (mes, trimestre, año)
    """
    TIPO_PERIODO_CHOICES = [
        ('MES', 'Mes'),
        ('TRIMESTRE', 'Trimestre'),
        ('AÑO', 'Año'),
    ]

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name='periodos',
        verbose_name="Empresa"
    )
    tipo_periodo = models.CharField(
        max_length=20,
        choices=TIPO_PERIODO_CHOICES,
        verbose_name="Tipo de periodo"
    )
    año = models.IntegerField(verbose_name="Año")
    mes = models.IntegerField(null=True, blank=True, verbose_name="Mes (1-12)")
    trimestre = models.IntegerField(null=True, blank=True, verbose_name="Trimestre (1-4)")
    fecha_cierre = models.DateField(verbose_name="Fecha de cierre")
    version = models.IntegerField(default=1, verbose_name="Versión")
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='periodos_creados',
        verbose_name="Creado por"
    )
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Periodo Financiero"
        verbose_name_plural = "Periodos Financieros"
        unique_together = ['empresa', 'tipo_periodo', 'año', 'mes', 'trimestre', 'version']
        ordering = ['-año', '-mes', '-trimestre', '-version']

    def __str__(self):
        if self.tipo_periodo == 'MES' and self.mes:
            return f"{self.empresa.nombre} - {self.mes}/{self.año} (v{self.version})"
        elif self.tipo_periodo == 'TRIMESTRE' and self.trimestre:
            return f"{self.empresa.nombre} - T{self.trimestre}/{self.año} (v{self.version})"
        else:
            return f"{self.empresa.nombre} - {self.año} (v{self.version})"


class BalanceGeneral(models.Model):
    """
    Balance General - Activo, Pasivo y Patrimonio
    """
    periodo = models.OneToOneField(
        PeriodoFinanciero,
        on_delete=models.CASCADE,
        related_name='balance_general',
        verbose_name="Periodo"
    )

    # ACTIVO
    # Activo Corriente
    caja_bancos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Caja y Bancos"
    )
    cuentas_por_cobrar = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Cuentas por Cobrar"
    )
    inventarios = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Inventarios"
    )
    otros_activos_corrientes = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Activos Corrientes"
    )

    # Activo No Corriente
    propiedades_planta_equipo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Propiedades, Planta y Equipo"
    )
    inversiones_largo_plazo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Inversiones a Largo Plazo"
    )
    intangibles = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Activos Intangibles"
    )
    otros_activos_no_corrientes = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Activos No Corrientes"
    )

    # PASIVO
    # Pasivo Corriente
    cuentas_por_pagar = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Cuentas por Pagar"
    )
    prestamos_corto_plazo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Préstamos a Corto Plazo"
    )
    pasivos_acreedores = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Pasivos con Acreedores"
    )
    otros_pasivos_corrientes = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Pasivos Corrientes"
    )

    # Pasivo No Corriente
    prestamos_largo_plazo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Préstamos a Largo Plazo"
    )
    otros_pasivos_no_corrientes = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Pasivos No Corrientes"
    )

    # PATRIMONIO
    capital_social = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Capital Social"
    )
    reservas = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Reservas"
    )
    utilidades_acumuladas = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Utilidades Acumuladas"
    )
    otros_patrimonios = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Patrimonios"
    )

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Balance General"
        verbose_name_plural = "Balances Generales"

    @property
    def activo_corriente(self):
        return (
            self.caja_bancos +
            self.cuentas_por_cobrar +
            self.inventarios +
            self.otros_activos_corrientes
        )

    @property
    def activo_no_corriente(self):
        return (
            self.propiedades_planta_equipo +
            self.inversiones_largo_plazo +
            self.intangibles +
            self.otros_activos_no_corrientes
        )

    @property
    def total_activo(self):
        return self.activo_corriente + self.activo_no_corriente

    @property
    def pasivo_corriente(self):
        return (
            self.cuentas_por_pagar +
            self.prestamos_corto_plazo +
            self.pasivos_acreedores +
            self.otros_pasivos_corrientes
        )

    @property
    def pasivo_no_corriente(self):
        return (
            self.prestamos_largo_plazo +
            self.otros_pasivos_no_corrientes
        )

    @property
    def total_pasivo(self):
        return self.pasivo_corriente + self.pasivo_no_corriente

    @property
    def total_patrimonio(self):
        return (
            self.capital_social +
            self.reservas +
            self.utilidades_acumuladas +
            self.otros_patrimonios
        )

    @property
    def pasivo_mas_patrimonio(self):
        return self.total_pasivo + self.total_patrimonio

    def __str__(self):
        return f"Balance General - {self.periodo}"


class EstadoResultados(models.Model):
    """
    Estado de Resultados (Pérdidas y Ganancias)
    """
    periodo = models.OneToOneField(
        PeriodoFinanciero,
        on_delete=models.CASCADE,
        related_name='estado_resultados',
        verbose_name="Periodo"
    )

    # INGRESOS
    ventas_netas = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Ventas Netas"
    )
    otros_ingresos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Otros Ingresos"
    )

    # COSTOS Y GASTOS
    costo_ventas = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Costo de Ventas (COGS)"
    )
    gastos_operativos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Gastos Operativos"
    )
    gastos_financieros = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Gastos Financieros"
    )
    impuestos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Impuestos"
    )

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Estado de Resultados"
        verbose_name_plural = "Estados de Resultados"

    @property
    def utilidad_bruta(self):
        return self.ventas_netas - self.costo_ventas

    @property
    def ebit(self):
        """Earnings Before Interest and Taxes"""
        return self.utilidad_bruta - self.gastos_operativos

    @property
    def utilidad_antes_impuestos(self):
        return self.ebit - self.gastos_financieros

    @property
    def utilidad_neta(self):
        return self.utilidad_antes_impuestos - self.impuestos

    def __str__(self):
        return f"Estado de Resultados - {self.periodo}"


class FlujoEfectivo(models.Model):
    """
    Flujo de Efectivo (método indirecto) - Opcional
    """
    periodo = models.OneToOneField(
        PeriodoFinanciero,
        on_delete=models.CASCADE,
        related_name='flujo_efectivo',
        verbose_name="Periodo"
    )

    # ACTIVIDADES OPERATIVAS
    utilidad_neta = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Utilidad Neta"
    )
    ajustes_depreciacion = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Depreciación y Amortización"
    )
    cambios_capital_trabajo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Cambios en Capital de Trabajo"
    )
    flujo_operativo = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Flujo de Efectivo Operativo"
    )

    # ACTIVIDADES DE INVERSIÓN
    compras_activos_fijos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Compras de Activos Fijos"
    )
    ventas_activos_fijos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Ventas de Activos Fijos"
    )
    flujo_inversion = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Flujo de Efectivo de Inversión"
    )

    # ACTIVIDADES DE FINANCIAMIENTO
    prestamos_recibidos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Préstamos Recibidos"
    )
    pago_prestamos = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Pago de Préstamos"
    )
    flujo_financiamiento = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Flujo de Efectivo de Financiamiento"
    )

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Flujo de Efectivo"
        verbose_name_plural = "Flujos de Efectivo"

    @property
    def flujo_neto(self):
        return (
            self.flujo_operativo +
            self.flujo_inversion +
            self.flujo_financiamiento
        )

    def __str__(self):
        return f"Flujo de Efectivo - {self.periodo}"


class ConfiguracionAlerta(models.Model):
    """
    Configuración de umbrales para alertas financieras
    """
    nombre = models.CharField(max_length=100, verbose_name="Nombre del indicador")
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    umbral_minimo = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Umbral Mínimo"
    )
    umbral_maximo = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Umbral Máximo"
    )
    activo = models.BooleanField(default=True, verbose_name="Activa")
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de Alerta"
        verbose_name_plural = "Configuraciones de Alertas"

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

