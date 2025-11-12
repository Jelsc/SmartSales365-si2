from django.contrib import admin
from .models import Producto, Categoria


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'productos_count', 'created_at']
    list_filter = ['activo', 'created_at']
    search_fields = ['nombre', 'descripcion']
    list_editable = ['activo']
    ordering = ['nombre']

    def productos_count(self, obj):
        return obj.productos.count()
    productos_count.short_description = 'N° Productos'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre',
        'categoria',
        'precio',
        'stock',
        'activo',
        'destacado',
        'disponible',
        'created_at'
    ]
    list_filter = ['activo', 'destacado', 'categoria', 'created_at']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
    list_editable = ['precio', 'stock', 'activo', 'destacado']
    readonly_fields = ['created_at', 'updated_at', 'disponible']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria')
        }),
        ('Precio y Stock', {
            'fields': ('precio', 'stock')
        }),
        ('Multimedia', {
            'fields': ('imagen',)
        }),
        ('Estado', {
            'fields': ('activo', 'destacado', 'disponible')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def disponible(self, obj):
        return obj.disponible
    disponible.boolean = True
    disponible.short_description = 'Disponible'

