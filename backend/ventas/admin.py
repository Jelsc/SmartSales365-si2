from django.contrib import admin
from .models import Pedido, ItemPedido, DireccionEnvio


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ['subtotal']
    fields = ['producto', 'nombre_producto', 'sku', 'cantidad', 'precio_unitario', 'subtotal']


class DireccionEnvioInline(admin.StackedInline):
    model = DireccionEnvio
    extra = 0


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['numero_pedido', 'usuario', 'estado', 'total', 'creado', 'actualizado']
    list_filter = ['estado', 'creado', 'pagado_en', 'enviado_en']
    search_fields = ['numero_pedido', 'usuario__email', 'usuario__first_name', 'usuario__last_name']
    readonly_fields = ['numero_pedido', 'creado', 'actualizado', 'pagado_en', 'enviado_en', 'entregado_en']
    inlines = [ItemPedidoInline, DireccionEnvioInline]
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('numero_pedido', 'usuario', 'estado')
        }),
        ('Montos', {
            'fields': ('subtotal', 'descuento', 'impuestos', 'costo_envio', 'total')
        }),
        ('Notas', {
            'fields': ('notas_cliente', 'notas_internas'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('creado', 'actualizado', 'pagado_en', 'enviado_en', 'entregado_en'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['marcar_como_pagado', 'marcar_como_enviado', 'marcar_como_entregado']
    
    def marcar_como_pagado(self, request, queryset):
        for pedido in queryset:
            pedido.actualizar_estado('PAGADO')
        self.message_user(request, f"{queryset.count()} pedidos marcados como pagados.")
    marcar_como_pagado.short_description = "Marcar como PAGADO"
    
    def marcar_como_enviado(self, request, queryset):
        for pedido in queryset:
            pedido.actualizar_estado('ENVIADO')
        self.message_user(request, f"{queryset.count()} pedidos marcados como enviados.")
    marcar_como_enviado.short_description = "Marcar como ENVIADO"
    
    def marcar_como_entregado(self, request, queryset):
        for pedido in queryset:
            pedido.actualizar_estado('ENTREGADO')
        self.message_user(request, f"{queryset.count()} pedidos marcados como entregados.")
    marcar_como_entregado.short_description = "Marcar como ENTREGADO"


@admin.register(ItemPedido)
class ItemPedidoAdmin(admin.ModelAdmin):
    list_display = ['id', 'pedido', 'nombre_producto', 'sku', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['pedido__estado', 'pedido__creado']
    search_fields = ['pedido__numero_pedido', 'nombre_producto', 'sku']
    readonly_fields = ['subtotal']


@admin.register(DireccionEnvio)
class DireccionEnvioAdmin(admin.ModelAdmin):
    list_display = ['pedido', 'nombre_completo', 'telefono', 'ciudad', 'departamento']
    search_fields = ['pedido__numero_pedido', 'nombre_completo', 'telefono', 'ciudad']
    list_filter = ['departamento', 'ciudad']
