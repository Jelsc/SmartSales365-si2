"""
Serializers para el sistema de notificaciones
"""
from rest_framework import serializers
from .models import DeviceToken, Notification


class DeviceTokenSerializer(serializers.ModelSerializer):
    """Serializer para registro de tokens FCM"""
    
    class Meta:
        model = DeviceToken
        fields = ['id', 'token', 'device_type', 'device_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        """
        Crea o actualiza un token de dispositivo
        Si el token ya existe, lo actualiza para el usuario actual
        """
        token = validated_data['token']
        user = self.context['request'].user
        
        # Buscar si el token ya existe
        device_token, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user': user,
                'device_type': validated_data.get('device_type', 'android'),
                'device_name': validated_data.get('device_name', ''),
                'is_active': True,
            }
        )
        
        return device_token


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_email', 'topic', 'tipo', 'titulo', 
            'mensaje', 'data', 'estado', 'message_id', 'error_message',
            'sent_at', 'read_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'estado', 'message_id', 'error_message', 
            'sent_at', 'read_at', 'created_at'
        ]


class SendNotificationSerializer(serializers.Serializer):
    """Serializer para enviar notificaciones"""
    
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='IDs de usuarios destinatarios'
    )
    topic = serializers.CharField(
        required=False,
        max_length=100,
        help_text='Topic para notificación masiva'
    )
    tipo = serializers.ChoiceField(
        choices=Notification.TIPO_CHOICES,
        default='info'
    )
    titulo = serializers.CharField(max_length=100)
    mensaje = serializers.CharField()
    data = serializers.JSONField(required=False, default=dict)

    def validate(self, attrs):
        """Validar que se especifique user_ids O topic"""
        if not attrs.get('user_ids') and not attrs.get('topic'):
            raise serializers.ValidationError(
                'Debe especificar user_ids o topic'
            )
        if attrs.get('user_ids') and attrs.get('topic'):
            raise serializers.ValidationError(
                'No puede especificar user_ids y topic al mismo tiempo'
            )
        return attrs
