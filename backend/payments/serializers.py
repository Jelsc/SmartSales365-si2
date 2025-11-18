"""
Serializadores para el sistema de pagos
"""
from rest_framework import serializers
from .models import MetodoPago, Pago, Transaccion, Reembolso, WebhookLog


class MetodoPagoSerializer(serializers.ModelSerializer):
    """Serializer para métodos de pago"""
    
    class Meta:
        model = MetodoPago
        fields = [
            'id',
            'nombre',
            'tipo',
            'proveedor',
            'descripcion',
            'activo',
            'comision_porcentaje',
            'comision_fija',
            'moneda',
            'configuracion',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PagoSerializer(serializers.ModelSerializer):
    """Serializer para pagos"""
    metodo_pago_info = MetodoPagoSerializer(source='metodo_pago', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Pago
        fields = [
            'id',
            'numero_orden',
            'usuario',
            'usuario_nombre',
            'metodo_pago',
            'metodo_pago_info',
            'monto',
            'moneda',
            'comision',
            'monto_neto',
            'estado',
            'descripcion',
            'stripe_payment_intent_id',
            'mercadopago_payment_id',
            'external_reference',
            'metadata',
            'cliente_nombre',
            'cliente_email',
            'cliente_telefono',
            'direccion_facturacion',
            'created_at',
            'updated_at',
            'pagado_at'
        ]
        read_only_fields = [
            'id',
            'numero_orden',
            'comision',
            'monto_neto',
            'estado',
            'created_at',
            'updated_at',
            'pagado_at'
        ]


class PagoCreateSerializer(serializers.Serializer):
    """Serializer para crear un nuevo pago"""
    metodo_pago_id = serializers.UUIDField(required=True)
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    moneda = serializers.ChoiceField(choices=['BOB', 'USD', 'EUR'], default='BOB')
    descripcion = serializers.CharField(required=True)
    cliente_nombre = serializers.CharField(required=True)
    cliente_email = serializers.EmailField(required=True)
    cliente_telefono = serializers.CharField(required=False, allow_blank=True)
    direccion_facturacion = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)
    
    def validate_monto(self, value):
        """Validar que el monto sea positivo"""
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value


class TransaccionSerializer(serializers.ModelSerializer):
    """Serializer para transacciones"""
    pago_numero_orden = serializers.CharField(source='pago.numero_orden', read_only=True)
    
    class Meta:
        model = Transaccion
        fields = [
            'id',
            'pago',
            'pago_numero_orden',
            'tipo',
            'estado',
            'monto',
            'moneda',
            'metodo_pago',
            'proveedor_id',
            'request_data',
            'response_data',
            'error_message',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReembolsoSerializer(serializers.ModelSerializer):
    """Serializer para reembolsos"""
    pago_numero_orden = serializers.CharField(source='pago.numero_orden', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Reembolso
        fields = [
            'id',
            'pago',
            'pago_numero_orden',
            'usuario',
            'usuario_nombre',
            'monto',
            'razon',
            'estado',
            'external_id',
            'metadata',
            'procesado_at',
            'created_at'
        ]
        read_only_fields = ['id', 'estado', 'procesado_at', 'created_at']


class ReembolsoCreateSerializer(serializers.Serializer):
    """Serializer para crear un reembolso"""
    pago_id = serializers.UUIDField(required=True)
    monto = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        help_text='Dejar vacío para reembolso total'
    )
    razon = serializers.CharField(required=True)
    
    def validate_monto(self, value):
        """Validar que el monto sea positivo"""
        if value and value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value


class WebhookLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de webhooks"""
    
    class Meta:
        model = WebhookLog
        fields = [
            'id',
            'proveedor',
            'evento',
            'payload',
            'procesado',
            'error_message',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
