from django.contrib import admin
from .models import MetodoPago, TransaccionPago


@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'activo', 'creado']
    list_filter = ['tipo', 'activo']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['creado', 'actualizado']


@admin.register(TransaccionPago)
class TransaccionPagoAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'pedido',
        'metodo_pago',
        'monto',
        'moneda',
        'estado',
        'creado',
        'procesado_en'
    ]
    list_filter = ['estado', 'metodo_pago', 'moneda', 'creado']
    search_fields = [
        'pedido__numero_pedido',
        'id_externo',
        'mensaje_error'
    ]
    readonly_fields = [
        'creado',
        'actualizado',
        'procesado_en',
        'metadata'
    ]
    
    fieldsets = (
        ('Información General', {
            'fields': ('pedido', 'metodo_pago', 'estado')
        }),
        ('Detalles de Pago', {
            'fields': ('monto', 'moneda', 'id_externo')
        }),
        ('Metadata y Errores', {
            'fields': ('metadata', 'mensaje_error'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('creado', 'actualizado', 'procesado_en')
        }),
    )
    
    actions = ['marcar_como_exitoso', 'marcar_como_fallido']
    
    @admin.action(description='Marcar como exitoso')
    def marcar_como_exitoso(self, request, queryset):
        for transaccion in queryset:
            transaccion.marcar_como_exitoso()
        self.message_user(request, f'{queryset.count()} transacciones marcadas como exitosas')
    
    @admin.action(description='Marcar como fallido')
    def marcar_como_fallido(self, request, queryset):
        for transaccion in queryset:
            transaccion.marcar_como_fallido()
        self.message_user(request, f'{queryset.count()} transacciones marcadas como fallidas')
