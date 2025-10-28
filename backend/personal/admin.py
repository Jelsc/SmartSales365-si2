from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Personal


@admin.register(Personal)
class PersonalAdmin(admin.ModelAdmin):
    """Admin para Personal - Refactorizado"""
    
    list_display = [
        'nombre_completo',
        'ci',
        'email',
        'codigo_empleado',
        'estado_display',
        'usuario_link',
        'anos_antiguedad',
        'fecha_creacion'
    ]

    list_filter = [
        'estado',
        'fecha_ingreso',
        'fecha_creacion'
    ]
    
    search_fields = [
        'nombre',
        'apellido',
        'email',
        'ci',
        'codigo_empleado'
    ]

    search_fields = ["nombre", "apellido", "email", "ci", "departamento"]

    readonly_fields = [
        'fecha_creacion',
        'fecha_actualizacion',
        'anos_antiguedad'
    ]

    fieldsets = [
        ('Información Personal', {
            'fields': [
                'nombre',
                'apellido',
                'ci',
                'email',
                'telefono',
                'fecha_nacimiento'
            ]
        }),
        ('Información Laboral', {
            'fields': [
                'codigo_empleado',
                'fecha_ingreso',
                'anos_antiguedad',
                'estado'
            ]
        }),
        ('Usuario del Sistema', {
            'fields': [
                'usuario'
            ]
        }),
        ('Contacto de Emergencia', {
            'fields': [
                'telefono_emergencia',
                'contacto_emergencia'
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
        """Muestra el nombre completo del empleado"""
        return obj.nombre_completo

    nombre_completo.short_description = "Nombre Completo"

    nombre_completo.admin_order_field = 'nombre'
    
    def estado_display(self, obj):
        """Muestra el estado con colores"""
        if obj.estado:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Activo</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Inactivo</span>'
            )
    estado_display.short_description = "Estado"
    estado_display.admin_order_field = 'estado'
    
    def usuario_link(self, obj):
        """Muestra enlace al usuario si existe"""
        if obj.usuario:
            url = reverse('admin:users_customuser_change', args=[obj.usuario.id])
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.usuario.username
            )
        return "Sin usuario"
    usuario_link.short_description = "Usuario"
    def anos_antiguedad(self, obj):
        """Muestra los años de antigüedad"""
        return f"{obj.anos_antiguedad} años"

    anos_antiguedad.short_description = "Antigüedad"

    def get_queryset(self, request):
        """Optimiza las consultas"""
        return super().get_queryset(request).select_related('usuario')
    
    actions = ['activar_empleados', 'desactivar_empleados']
    
    def activar_empleados(self, request, queryset):
        """Acción para activar empleados seleccionados"""
        updated = queryset.update(estado=True)
        self.message_user(
            request,
            f'{updated} empleado(s) activado(s) exitosamente.'
        )
    activar_empleados.short_description = "Activar empleados seleccionados"

    def desactivar_empleados(self, request, queryset):
        """Acción para desactivar empleados seleccionados"""
        updated = queryset.update(estado=False)
        self.message_user(
            request, f"{updated} empleado(s) desactivado(s) exitosamente."
        )
    desactivar_empleados.short_description = "Desactivar empleados seleccionados"
