from django.contrib import admin
from .models import Categoria, Producto, ProductoImagen, ProductoVariante


class ProductoImagenInline(admin.TabularInline):
    """Inline para gestionar imágenes del producto"""
    model = ProductoImagen
    extra = 1
    fields = ['imagen', 'es_principal', 'orden', 'alt_text']


class ProductoVarianteInline(admin.TabularInline):
    """Inline para gestionar variantes del producto"""
    model = ProductoVariante
    extra = 1
    fields = ['nombre', 'sku', 'precio_adicional', 'stock', 'activa']


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'slug', 'activa', 'orden', 'total_productos', 'creado']
    list_filter = ['activa', 'creado']
    search_fields = ['nombre', 'descripcion']
    prepopulated_fields = {'slug': ('nombre',)}
    ordering = ['orden', 'nombre']
    
    def total_productos(self, obj):
        return obj.productos.count()
    total_productos.short_description = 'Total Productos'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'categoria', 'precio', 'precio_oferta', 'stock', 
        'activo', 'destacado', 'vistas', 'ventas', 'creado'
    ]
    list_filter = [
        'activo', 'destacado', 'en_oferta', 'categoria', 'creado'
    ]
    search_fields = ['nombre', 'descripcion', 'sku', 'marca', 'modelo']
    prepopulated_fields = {'slug': ('nombre',)}
    readonly_fields = ['sku', 'vistas', 'ventas', 'creado', 'actualizado']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'slug', 'descripcion', 'descripcion_corta', 'categoria')
        }),
        ('Precios', {
            'fields': (
                'precio', 'en_oferta', 'precio_oferta', 'descuento_porcentaje',
                'fecha_inicio_oferta', 'fecha_fin_oferta'
            )
        }),
        ('Inventario', {
            'fields': ('stock', 'stock_minimo')
        }),
        ('Garantía', {
            'fields': ('meses_garantia', 'descripcion_garantia')
        }),
        ('Características', {
            'fields': ('sku', 'codigo_barras', 'marca', 'modelo', 'peso')
        }),
        ('Estado y Visibilidad', {
            'fields': ('activo', 'destacado')
        }),
        ('Estadísticas', {
            'fields': ('vistas', 'ventas', 'creado', 'actualizado'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductoImagenInline, ProductoVarianteInline]
    
    actions = ['activar_productos', 'desactivar_productos', 'marcar_destacados']
    
    def activar_productos(self, request, queryset):
        queryset.update(activo=True)
    activar_productos.short_description = "Activar productos seleccionados"
    
    def desactivar_productos(self, request, queryset):
        queryset.update(activo=False)
    desactivar_productos.short_description = "Desactivar productos seleccionados"
    
    def marcar_destacados(self, request, queryset):
        queryset.update(destacado=True)
    marcar_destacados.short_description = "Marcar como destacados"


@admin.register(ProductoImagen)
class ProductoImagenAdmin(admin.ModelAdmin):
    list_display = ['producto', 'es_principal', 'orden', 'creado']
    list_filter = ['es_principal', 'producto__categoria', 'creado']
    search_fields = ['producto__nombre', 'alt_text']
    ordering = ['producto', 'orden']


@admin.register(ProductoVariante)
class ProductoVarianteAdmin(admin.ModelAdmin):
    list_display = ['producto', 'nombre', 'sku', 'precio_adicional', 'stock', 'activa']
    list_filter = ['activa', 'producto__categoria', 'creado']
    search_fields = ['nombre', 'sku', 'producto__nombre']
    ordering = ['producto', 'nombre']
