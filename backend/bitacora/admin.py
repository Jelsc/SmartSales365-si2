from django.contrib import admin
from .models import Bitacora

@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = (
        'fecha_hora',
        'nombre_usuario',
        'accion_display',
        'descripcion_display',
        'ip_display',
        'user_agent_display',
        'modulo_display',
    )
    list_filter = ('accion', 'modulo')
    search_fields = ('accion', 'descripcion', 'usuario__username', 'modulo')
    ordering = ('-fecha_hora',)

    @admin.display(description="Usuario")
    def nombre_usuario(self, obj):
        return getattr(obj.usuario, "username", "Sistema")

    @admin.display(description='Acción')
    def accion_display(self, obj):
        return obj.accion or "-"

    @admin.display(description='Descripción')
    def descripcion_display(self, obj):
        return obj.descripcion or "-"

    @admin.display(description='IP')
    def ip_display(self, obj):
        return obj.ip or "-"

    @admin.display(description='User Agent')
    def user_agent_display(self, obj):
        return obj.user_agent or "-"

    @admin.display(description='Módulo')
    def modulo_display(self, obj):
        return obj.modulo or "-"