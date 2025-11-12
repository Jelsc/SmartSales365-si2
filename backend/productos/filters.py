import django_filters
from .models import Producto


class ProductoFilter(django_filters.FilterSet):
    """
    Filtros avanzados para productos
    """
    # Filtros por rango de precio
    precio_min = django_filters.NumberFilter(field_name='precio', lookup_expr='gte')
    precio_max = django_filters.NumberFilter(field_name='precio', lookup_expr='lte')
    
    # Filtros de categoría
    categoria = django_filters.NumberFilter(field_name='categoria__id')
    categoria_slug = django_filters.CharFilter(field_name='categoria__slug', lookup_expr='iexact')
    
    # Filtros booleanos
    en_oferta = django_filters.BooleanFilter(field_name='en_oferta')
    destacado = django_filters.BooleanFilter(field_name='destacado')
    
    # Filtros de stock
    con_stock = django_filters.BooleanFilter(method='filter_con_stock')
    stock_bajo = django_filters.BooleanFilter(method='filter_stock_bajo')
    
    # Filtro por marca
    marca = django_filters.CharFilter(lookup_expr='icontains')
    
    # Ordenamiento
    ordering = django_filters.OrderingFilter(
        fields=(
            ('precio', 'precio'),
            ('creado', 'creado'),
            ('nombre', 'nombre'),
            ('ventas', 'ventas'),
            ('vistas', 'vistas'),
            ('descuento_porcentaje', 'descuento_porcentaje'),
            ('stock', 'stock'),
        )
    )
    
    class Meta:
        model = Producto
        fields = {
            'nombre': ['icontains'],
            'descripcion': ['icontains'],
            'activo': ['exact'],
        }
    
    def filter_con_stock(self, queryset, name, value):
        """Filtrar productos con stock disponible"""
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)
    
    def filter_stock_bajo(self, queryset, name, value):
        """Filtrar productos con stock bajo"""
        if value:
            return queryset.filter(stock__lte=models.F('stock_minimo'))
        return queryset
