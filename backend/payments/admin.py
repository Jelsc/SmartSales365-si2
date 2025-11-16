"""
Admin para el sistema de pagos
"""
from django.contrib import admin
from .models import MetodoPago, Pago, Transaccion, Reembolso, WebhookLog


@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    """Admin para métodos de pago"""
    list_display = [
        'nombre',
        'tipo',
        'proveedor',
        'activo',
        'comision_porcentaje',
        'comision_fija',
        'created_at'
    ]
    list_filter = ['proveedor', 'tipo', 'activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['proveedor', 'nombre']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'tipo', 'proveedor', 'descripcion', 'activo')
        }),
        ('Comisiones', {
            'fields': ('comision_porcentaje', 'comision_fija')
        }),
        ('Configuración', {
            'fields': ('configuracion',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    """Admin para pagos"""
    list_display = [
        'numero_orden',
        'usuario',
        'metodo_pago',
        'monto',
        'moneda',
        'estado',
        'created_at',
        'pagado_at'
    ]
    list_filter = ['estado', 'moneda', 'metodo_pago', 'created_at']
    search_fields = [
        'numero_orden',
        'usuario__email',
        'usuario__username',
        'cliente_nombre',
        'cliente_email',
        'stripe_payment_intent_id',
        'mercadopago_payment_id'
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'id',
        'numero_orden',
        'comision',
        'monto_neto',
        'created_at',
        'updated_at',
        'pagado_at'
    ]
    
    fieldsets = (
        ('Información del Pago', {
            'fields': (
                'id',
                'numero_orden',
                'usuario',
                'metodo_pago',
                'estado',
                'descripcion'
            )
        }),
        ('Montos', {
            'fields': ('monto', 'moneda', 'comision', 'monto_neto')
        }),
        ('IDs Externos', {
            'fields': (
                'stripe_payment_intent_id',
                'mercadopago_payment_id',
                'external_reference'
            ),
            'classes': ('collapse',)
        }),
        ('Información del Cliente', {
            'fields': (
                'cliente_nombre',
                'cliente_email',
                'cliente_telefono',
                'direccion_facturacion'
            )
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'pagado_at')
        }),
    )
    
    def has_add_permission(self, request):
        """No permitir crear pagos desde el admin (solo desde API)"""
        return False


@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
    """Admin para transacciones"""
    list_display = [
        'pago',
        'tipo',
        'exitosa',
        'monto',
        'moneda',
        'created_at'
    ]
    list_filter = ['tipo', 'exitosa', 'moneda', 'created_at']
    search_fields = [
        'pago__numero_orden',
        'external_id',
        'error_mensaje'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Información de la Transacción', {
            'fields': (
                'pago',
                'tipo',
                'exitosa',
                'monto',
                'moneda',
                'external_id',
                'descripcion',
                'error_mensaje'
            )
        }),
        ('Request & Response', {
            'fields': ('request_data', 'response_data'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        """No permitir crear transacciones desde el admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir editar transacciones (solo lectura)"""
        return False


@admin.register(Reembolso)
class ReembolsoAdmin(admin.ModelAdmin):
    """Admin para reembolsos"""
    list_display = [
        'pago',
        'solicitado_por',
        'monto',
        'motivo',
        'estado',
        'created_at',
        'procesado_at'
    ]
    list_filter = ['estado', 'motivo', 'created_at', 'procesado_at']
    search_fields = [
        'pago__numero_orden',
        'solicitado_por__email',
        'descripcion',
        'stripe_refund_id',
        'mercadopago_refund_id'
    ]
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'procesado_at']
    
    fieldsets = (
        ('Información del Reembolso', {
            'fields': ('id', 'pago', 'solicitado_por', 'monto', 'motivo', 'estado', 'descripcion')
        }),
        ('IDs Externos', {
            'fields': ('stripe_refund_id', 'mercadopago_refund_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'procesado_at')
        }),
    )


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    """Admin para logs de webhooks"""
    list_display = [
        'id',
        'proveedor',
        'evento_tipo',
        'procesado',
        'pago',
        'created_at'
    ]
    list_filter = ['proveedor', 'procesado', 'created_at']
    search_fields = ['evento_tipo', 'error', 'pago__numero_orden']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'procesado_at']
    
    fieldsets = (
        ('Información del Webhook', {
            'fields': ('id', 'proveedor', 'evento_tipo', 'procesado', 'pago')
        }),
        ('Datos', {
            'fields': ('payload', 'headers'),
            'classes': ('collapse',)
        }),
        ('Error', {
            'fields': ('error',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'procesado_at')
        }),
    )
    
    def has_add_permission(self, request):
        """No permitir crear logs desde el admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir editar logs (solo lectura)"""
        return False
