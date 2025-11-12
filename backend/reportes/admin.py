from django.contrib import admin
from .models import ReporteGenerado


@admin.register(ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    """Panel de administración para reportes generados"""
    
    list_display = [
        'id',
        'tipo',
        'usuario',
        'formato',
        'agrupacion',
        'periodo_inicio',
        'periodo_fin',
        'created_at',
    ]
    
    list_filter = [
        'tipo',
        'formato',
        'agrupacion',
        'created_at',
    ]
    
    search_fields = [
        'prompt_original',
        'usuario__username',
        'usuario__email',
    ]
    
    readonly_fields = [
        'created_at',
        'prompt_original',
        'datos_json',
    ]
    
    fieldsets = (
        ('Información del Usuario', {
            'fields': ('usuario', 'prompt_original', 'created_at')
        }),
        ('Configuración del Reporte', {
            'fields': ('tipo', 'formato', 'agrupacion')
        }),
        ('Período', {
            'fields': ('periodo_inicio', 'periodo_fin')
        }),
        ('Resultado', {
            'fields': ('archivo', 'datos_json')
        }),
    )
    
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        """No permitir creación manual desde admin"""
        return False
