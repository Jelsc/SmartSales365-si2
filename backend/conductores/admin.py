from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Conductor


@admin.register(Conductor)
class ConductorAdmin(admin.ModelAdmin):
    list_display = [
        'nombre_completo',
        'nro_licencia',
        'tipo_licencia',
        'estado',
        'licencia_status',
        'experiencia_anios',
        'fecha_creacion'
    ]
    
    list_filter = [
        'estado',
        'tipo_licencia',
        'fecha_creacion',
        'fecha_venc_licencia'
    ]
    
    search_fields = [
        'nombre',
        'apellido',
        'email',
        'telefono',
        'nro_licencia'
    ]
    
    readonly_fields = [
        'fecha_creacion',
        'fecha_actualizacion',
        'ultima_actualizacion_ubicacion',
        'licencia_status',
        'dias_para_vencer_licencia'
    ]
    
    fieldsets = [
        ('Información del Personal', {
            'fields': ['usuario']
        }),
        ('Información de Licencia', {
            'fields': [
                'nro_licencia',
                'tipo_licencia',
                'fecha_venc_licencia',
                'licencia_status',
                'dias_para_vencer_licencia'
            ]
        }),
        ('Estado y Experiencia', {
            'fields': [
                'experiencia_anios',
            ]
        }),
        ('Contacto de Emergencia', {
            'fields': [
                'telefono_emergencia',
                'contacto_emergencia'
            ],
            'classes': ['collapse']
        }),
        ('Ubicación', {
            'fields': [
                'ultima_ubicacion_lat',
                'ultima_ubicacion_lng',
                'ultima_actualizacion_ubicacion'
            ],
            'classes': ['collapse']
        }),
        ('Fechas', {
            'fields': [
                'fecha_creacion',
                'fecha_actualizacion'
            ],
            'classes': ['collapse']
        })
    ]
    
    def nombre_completo(self, obj):
        """Muestra el nombre completo del conductor"""
        return obj.nombre_completo
    nombre_completo.short_description = "Nombre Completo"
    nombre_completo.admin_order_field = 'nombre'
    
    def licencia_status(self, obj):
        """Muestra el estado de la licencia con colores"""
        if obj.licencia_vencida:
            return format_html(
                '<span style="color: red; font-weight: bold;">VENCIDA</span>'
            )
        elif obj.dias_para_vencer_licencia <= 30:
            return format_html(
                '<span style="color: orange; font-weight: bold;">VENCE PRONTO ({})</span>',
                obj.dias_para_vencer_licencia
            )
        else:
            return format_html(
                '<span style="color: green;">VÁLIDA ({})</span>',
                obj.dias_para_vencer_licencia
            )
    licencia_status.short_description = "Estado Licencia"
    
    def get_queryset(self, request):
        """Optimiza las consultas"""
        return super().get_queryset(request).select_related('usuario')
    
    def save_model(self, request, obj, form, change):
        """Personaliza el guardado del modelo"""
        super().save_model(request, obj, form, change)
    
    actions = ['activar_conductores', 'desactivar_conductores', 'marcar_disponibles']
    
    def activar_conductores(self, request, queryset):
        """Acción para activar conductores seleccionados"""
        updated = queryset.update(usuario__is_active=True)
        self.message_user(
            request,
            f'{updated} conductor(es) activado(s) exitosamente.'
        )
    activar_conductores.short_description = "Activar conductores seleccionados"
    
    def desactivar_conductores(self, request, queryset):
        """Acción para desactivar conductores seleccionados"""
        updated = queryset.update(usuario__is_active=False)
        self.message_user(
            request,
            f'{updated} conductor(es) desactivado(s) exitosamente.'
        )
    desactivar_conductores.short_description = "Desactivar conductores seleccionados"
    
    def marcar_disponibles(self, request, queryset):
        """Acción para marcar conductores como disponibles"""
        # Esta acción ya no es necesaria ya que el estado se maneja a través del usuario
        self.message_user(
            request,
            'El estado de los conductores se maneja a través del usuario vinculado.'
        )
    marcar_disponibles.short_description = "Marcar como disponibles"
