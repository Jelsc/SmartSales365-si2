from rest_framework import serializers
from .models import (
    Empresa, PeriodoFinanciero, BalanceGeneral,
    EstadoResultados, FlujoEfectivo, ConfiguracionAlerta
)


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'codigo', 'activo', 'creado', 'actualizado']
        read_only_fields = ['id', 'creado', 'actualizado']


class PeriodoFinancieroSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    tipo_periodo_display = serializers.CharField(source='get_tipo_periodo_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = PeriodoFinanciero
        fields = [
            'id', 'empresa', 'empresa_nombre', 'tipo_periodo', 'tipo_periodo_display',
            'año', 'mes', 'trimestre', 'fecha_cierre', 'version',
            'creado_por', 'creado_por_nombre', 'creado', 'actualizado'
        ]
        read_only_fields = ['id', 'creado', 'actualizado']


class BalanceGeneralSerializer(serializers.ModelSerializer):
    periodo_info = PeriodoFinancieroSerializer(source='periodo', read_only=True)
    
    # Propiedades calculadas
    activo_corriente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    activo_no_corriente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_activo = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    pasivo_corriente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    pasivo_no_corriente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_pasivo = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_patrimonio = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    pasivo_mas_patrimonio = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = BalanceGeneral
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']


class EstadoResultadosSerializer(serializers.ModelSerializer):
    periodo_info = PeriodoFinancieroSerializer(source='periodo', read_only=True)
    
    # Propiedades calculadas
    utilidad_bruta = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    ebit = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    utilidad_antes_impuestos = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    utilidad_neta = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = EstadoResultados
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']


class FlujoEfectivoSerializer(serializers.ModelSerializer):
    periodo_info = PeriodoFinancieroSerializer(source='periodo', read_only=True)
    flujo_neto = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = FlujoEfectivo
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']


class ConfiguracionAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionAlerta
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']


class CargarArchivoSerializer(serializers.Serializer):
    """Serializer para cargar archivos CSV/Excel"""
    archivo = serializers.FileField(required=True)
    empresa_id = serializers.IntegerField(required=True)
    tipo_periodo = serializers.ChoiceField(
        choices=['MES', 'TRIMESTRE', 'AÑO'],
        required=True
    )
    año = serializers.IntegerField(required=True)
    mes = serializers.IntegerField(required=False, allow_null=True)
    trimestre = serializers.IntegerField(required=False, allow_null=True)
    fecha_cierre = serializers.DateField(required=True)
    version = serializers.IntegerField(default=1)


class EscenarioWhatIfSerializer(serializers.Serializer):
    """Serializer para escenarios what-if"""
    # periodo_id no es necesario porque se obtiene de la URL
    variacion_precio = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0,
        help_text="Variación porcentual de precio"
    )
    variacion_costo = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0,
        help_text="Variación porcentual de costo"
    )
    dias_cobro = serializers.IntegerField(
        required=False, allow_null=True,
        help_text="Días de cobro objetivo"
    )
    dias_pago = serializers.IntegerField(
        required=False, allow_null=True,
        help_text="Días de pago objetivo"
    )
    dias_inventario = serializers.IntegerField(
        required=False, allow_null=True,
        help_text="Días de inventario objetivo"
    )

