from rest_framework import serializers
from .models import Carrito, ItemCarrito
from productos.serializers import ProductoListSerializer


class ItemCarritoSerializer(serializers.ModelSerializer):
    producto_detalle = ProductoListSerializer(source='producto', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ItemCarrito
        fields = [
            'id',
            'producto',
            'producto_detalle',
            'variante',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'agregado'
        ]
        read_only_fields = ['precio_unitario', 'subtotal', 'agregado']


class CarritoSerializer(serializers.ModelSerializer):
    items = ItemCarritoSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Carrito
        fields = [
            'id',
            'usuario',
            'session_key',
            'items',
            'total_items',
            'subtotal',
            'total',
            'creado',
            'actualizado'
        ]
        read_only_fields = ['usuario', 'session_key', 'creado', 'actualizado']


class AgregarItemCarritoSerializer(serializers.Serializer):
    """Serializer para agregar un item al carrito"""
    producto_id = serializers.IntegerField()
    variante_id = serializers.IntegerField(required=False, allow_null=True)
    cantidad = serializers.IntegerField(min_value=1, default=1)


class ActualizarItemCarritoSerializer(serializers.Serializer):
    """Serializer para actualizar la cantidad de un item"""
    cantidad = serializers.IntegerField(min_value=0)
