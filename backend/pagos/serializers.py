from rest_framework import serializers
from .models import MetodoPago, TransaccionPago


class MetodoPagoSerializer(serializers.ModelSerializer):
    """Serializer para métodos de pago"""
    
    class Meta:
        model = MetodoPago
        fields = [
            'id',
            'nombre',
            'tipo',
            'activo',
            'descripcion',
        ]
        read_only_fields = ['id']


class TransaccionPagoSerializer(serializers.ModelSerializer):
    """Serializer para transacciones de pago"""
    metodo_pago_detalle = MetodoPagoSerializer(source='metodo_pago', read_only=True)
    
    class Meta:
        model = TransaccionPago
        fields = [
            'id',
            'pedido',
            'metodo_pago',
            'metodo_pago_detalle',
            'estado',
            'monto',
            'moneda',
            'id_externo',
            'mensaje_error',
            'creado',
            'procesado_en',
        ]
        read_only_fields = [
            'id',
            'estado',
            'mensaje_error',
            'creado',
            'procesado_en',
        ]


class CrearPaymentIntentSerializer(serializers.Serializer):
    """Serializer para crear un Payment Intent de Stripe"""
    pedido_id = serializers.IntegerField()
    
    def validate_pedido_id(self, value):
        """Validar que el pedido existe y pertenece al usuario"""
        from ventas.models import Pedido
        request = self.context.get('request')
        
        try:
            pedido = Pedido.objects.get(id=value)
        except Pedido.DoesNotExist:
            raise serializers.ValidationError('Pedido no encontrado')
        
        # Verificar que el pedido pertenece al usuario
        if not request.user.is_staff and pedido.usuario != request.user:
            raise serializers.ValidationError('No tienes permiso para este pedido')
        
        # Verificar que el pedido está en estado PENDIENTE
        if pedido.estado != 'PENDIENTE':
            raise serializers.ValidationError(
                f'El pedido está en estado {pedido.get_estado_display()}. '
                'Solo se pueden pagar pedidos pendientes.'
            )
        
        return value


class ConfirmarPagoSerializer(serializers.Serializer):
    """Serializer para confirmar un pago"""
    payment_intent_id = serializers.CharField()
    
    def validate_payment_intent_id(self, value):
        """Validar que el payment intent existe"""
        # Permitir IDs simulados en desarrollo
        if value and value.startswith('simulated_'):
            return value
        # Validar IDs reales de Stripe
        if not value or not value.startswith('pi_'):
            raise serializers.ValidationError('Payment Intent ID inválido')
        return value


class WebhookStripeSerializer(serializers.Serializer):
    """Serializer para procesar webhooks de Stripe"""
    type = serializers.CharField()
    data = serializers.JSONField()
