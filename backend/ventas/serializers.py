from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from .models import Pedido, ItemPedido, DireccionEnvio
from productos.serializers import ProductoListSerializer
from carrito.models import Carrito


class ItemPedidoSerializer(serializers.ModelSerializer):
    """Serializer para los items de un pedido"""
    producto_nombre = serializers.CharField(source='nombre_producto', read_only=True)
    producto_imagen = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemPedido
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'producto_imagen',
            'nombre_producto',
            'sku',
            'precio_unitario',
            'cantidad',
            'subtotal',
            'variante_info',
        ]
        read_only_fields = [
            'id',
            'nombre_producto',
            'sku',
            'precio_unitario',
            'subtotal',
        ]
    
    def get_producto_imagen(self, obj):
        """Obtener la URL de la imagen del producto"""
        if obj.producto and obj.producto.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.producto.imagen.url)
            return obj.producto.imagen.url
        return None


class DireccionEnvioSerializer(serializers.ModelSerializer):
    """Serializer para la dirección de envío"""
    
    class Meta:
        model = DireccionEnvio
        fields = [
            'id',
            'nombre_completo',
            'telefono',
            'email',
            'direccion',
            'referencia',
            'ciudad',
            'departamento',
            'codigo_postal',
        ]
        read_only_fields = ['id']


class PedidoListSerializer(serializers.ModelSerializer):
    """Serializer para listar pedidos (vista resumida)"""
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Pedido
        fields = [
            'id',
            'numero_pedido',
            'estado',
            'total',
            'total_items',
            'creado',
            'actualizado',
        ]
        read_only_fields = fields
    
    def get_total_items(self, obj):
        """Calcular total de items en el pedido"""
        return obj.items.count()


class PedidoDetailSerializer(serializers.ModelSerializer):
    """Serializer para ver detalle completo de un pedido"""
    items = ItemPedidoSerializer(many=True, read_only=True)
    direccion_envio = DireccionEnvioSerializer(read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id',
            'numero_pedido',
            'usuario',
            'estado',
            'subtotal',
            'descuento',
            'impuestos',
            'costo_envio',
            'total',
            'notas_cliente',
            'notas_internas',
            'items',
            'direccion_envio',
            'creado',
            'actualizado',
            'pagado_en',
            'enviado_en',
            'entregado_en',
        ]
        read_only_fields = fields


class PedidoCreateSerializer(serializers.Serializer):
    """Serializer para crear un nuevo pedido desde el carrito"""
    direccion = DireccionEnvioSerializer()
    notas_cliente = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500
    )
    metodo_pago = serializers.CharField(
        max_length=50,
        required=False,
        default='pendiente'
    )
    
    def validate(self, attrs):
        """Validar que el usuario tenga items en el carrito"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Usuario no autenticado')
        
        # Verificar que el carrito tenga items
        try:
            carrito = Carrito.objects.get(usuario=request.user)
            if carrito.items.count() == 0:
                raise serializers.ValidationError('El carrito está vacío')
        except Carrito.DoesNotExist:
            raise serializers.ValidationError('No se encontró el carrito')
        
        attrs['carrito'] = carrito
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Crear pedido desde el carrito"""
        request = self.context.get('request')
        carrito = validated_data.pop('carrito')
        direccion_data = validated_data.pop('direccion')
        notas_cliente = validated_data.get('notas_cliente', '')
        
        # Calcular montos
        subtotal = carrito.subtotal
        # TODO: Calcular impuestos y costo de envío según reglas de negocio
        impuestos = Decimal('0.00')
        costo_envio = Decimal('0.00')
        descuento = Decimal('0.00')
        total = subtotal + impuestos + costo_envio - descuento
        
        # Crear el pedido
        pedido = Pedido.objects.create(
            usuario=request.user,
            estado='PENDIENTE',
            subtotal=subtotal,
            descuento=descuento,
            impuestos=impuestos,
            costo_envio=costo_envio,
            total=total,
            notas_cliente=notas_cliente,
        )
        
        # Crear items del pedido desde el carrito
        for item_carrito in carrito.items.all():
            ItemPedido.objects.create(
                pedido=pedido,
                producto=item_carrito.producto,
                cantidad=item_carrito.cantidad,
                precio_unitario=item_carrito.precio_unitario,
                # nombre_producto, sku y subtotal se auto-completan en el save() del modelo
            )
        
        # Crear dirección de envío
        DireccionEnvio.objects.create(
            pedido=pedido,
            **direccion_data
        )
        
        # NO vaciar el carrito aquí
        # El carrito se vaciará después de confirmar el pago exitoso
        # para evitar perder items si el pago falla
        
        return pedido
    
    def to_representation(self, instance):
        """
        Customizar la respuesta para incluir información del pedido creado
        """
        return {
            'id': instance.id,
            'numero_pedido': instance.numero_pedido,
            'estado': instance.estado,
            'total': str(instance.total),
            'subtotal': str(instance.subtotal),
            'items_count': instance.items.count(),
        }


class ActualizarEstadoPedidoSerializer(serializers.Serializer):
    """Serializer para actualizar el estado de un pedido"""
    estado = serializers.ChoiceField(choices=Pedido.ESTADO_CHOICES)
    notas_internas = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500
    )
    
    def update(self, instance, validated_data):
        """Actualizar el estado del pedido"""
        nuevo_estado = validated_data.get('estado')
        notas_internas = validated_data.get('notas_internas', '')
        
        # Actualizar estado (esto también actualiza las fechas automáticamente)
        instance.actualizar_estado(nuevo_estado)
        
        # Actualizar notas si se proporcionaron
        if notas_internas:
            if instance.notas_internas:
                instance.notas_internas += f"\n{notas_internas}"
            else:
                instance.notas_internas = notas_internas
            instance.save()
        
        return instance
