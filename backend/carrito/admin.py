from django.contrib import admin
from .models import Carrito, ItemCarrito


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario_display', 'total_items', 'subtotal', 'creado', 'actualizado']
    list_filter = ['creado', 'actualizado']
    search_fields = ['usuario__email', 'session_key']
    readonly_fields = ['creado', 'actualizado', 'total_items', 'subtotal']
    
    def usuario_display(self, obj):
        if obj.usuario:
            return obj.usuario.email
        return f"Anónimo ({obj.session_key[:10]}...)"
    usuario_display.short_description = 'Usuario'


@admin.register(ItemCarrito)
class ItemCarritoAdmin(admin.ModelAdmin):
    list_display = ['id', 'carrito', 'producto', 'variante', 'cantidad', 'precio_unitario', 'subtotal', 'agregado']
    list_filter = ['agregado']
    search_fields = ['producto__nombre', 'carrito__usuario__email']
    readonly_fields = ['agregado', 'subtotal']
