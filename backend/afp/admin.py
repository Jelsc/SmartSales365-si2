from django.contrib import admin
from .models import (
    Empresa, PeriodoFinanciero, BalanceGeneral,
    EstadoResultados, FlujoEfectivo, ConfiguracionAlerta
)


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'activo', 'creado']
    list_filter = ['activo', 'creado']
    search_fields = ['nombre', 'codigo']


@admin.register(PeriodoFinanciero)
class PeriodoFinancieroAdmin(admin.ModelAdmin):
    list_display = ['empresa', 'tipo_periodo', 'año', 'mes', 'trimestre', 'version', 'fecha_cierre', 'creado_por']
    list_filter = ['tipo_periodo', 'año', 'empresa']
    search_fields = ['empresa__nombre']
    readonly_fields = ['creado', 'actualizado']


@admin.register(BalanceGeneral)
class BalanceGeneralAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'total_activo', 'total_pasivo', 'total_patrimonio']
    readonly_fields = ['activo_corriente', 'activo_no_corriente', 'total_activo',
                      'pasivo_corriente', 'pasivo_no_corriente', 'total_pasivo',
                      'total_patrimonio', 'pasivo_mas_patrimonio']


@admin.register(EstadoResultados)
class EstadoResultadosAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'ventas_netas', 'utilidad_neta']
    readonly_fields = ['utilidad_bruta', 'ebit', 'utilidad_antes_impuestos', 'utilidad_neta']


@admin.register(FlujoEfectivo)
class FlujoEfectivoAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'flujo_operativo', 'flujo_neto']
    readonly_fields = ['flujo_neto']


@admin.register(ConfiguracionAlerta)
class ConfiguracionAlertaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'umbral_minimo', 'umbral_maximo', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'codigo']

