from rest_framework import serializers
from .models import Producto, Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    productos_count = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'activo', 'productos_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_productos_count(self, obj):
        return obj.productos.filter(activo=True).count()


class ProductoSerializer(serializers.ModelSerializer):
    """Serializer para productos"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    disponible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'precio',
            'imagen',
            'stock',
            'categoria',
            'categoria_nombre',
            'activo',
            'destacado',
            'disponible',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'disponible']

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de productos"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'precio',
            'imagen',
            'stock',
            'categoria_nombre',
            'destacado',
        ]
