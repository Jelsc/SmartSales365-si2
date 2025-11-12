"""
Modelos para el sistema de notificaciones push
Almacena tokens FCM y registro de notificaciones enviadas
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class DeviceToken(models.Model):
    """
    Almacena los tokens FCM de los dispositivos de usuarios
    Un usuario puede tener múltiples dispositivos
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='device_tokens',
        verbose_name='Usuario'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Token FCM'
    )
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('android', 'Android'),
            ('ios', 'iOS'),
            ('web', 'Web'),
        ],
        default='android',
        verbose_name='Tipo de dispositivo'
    )
    device_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Nombre del dispositivo'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Desactivar si el token ya no es válido'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    class Meta:
        db_table = 'device_tokens'
        verbose_name = 'Token de Dispositivo'
        verbose_name_plural = 'Tokens de Dispositivos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f'{self.user.email} - {self.device_type} ({self.token[:20]}...)'


class Notification(models.Model):
    """
    Registro de notificaciones enviadas
    Útil para auditoría y reenvío
    """
    TIPO_CHOICES = [
        ('info', 'Información'),
        ('promo', 'Promoción'),
        ('pedido', 'Pedido'),
        ('mensaje', 'Mensaje'),
        ('alerta', 'Alerta'),
        ('sistema', 'Sistema'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('enviada', 'Enviada'),
        ('fallida', 'Fallida'),
        ('leida', 'Leída'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Usuario destinatario',
        help_text='Dejar en blanco para notificaciones a topics'
    )
    topic = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Topic',
        help_text='Topic de Firebase para notificaciones masivas'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='info',
        verbose_name='Tipo'
    )
    titulo = models.CharField(
        max_length=100,
        verbose_name='Título'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje'
    )
    data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos adicionales',
        help_text='Datos personalizados en formato JSON'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    message_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='ID de mensaje FCM',
        help_text='ID retornado por Firebase al enviar'
    )
    error_message = models.TextField(
        null=True,
        blank=True,
        verbose_name='Mensaje de error'
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de envío'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de lectura'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'estado']),
            models.Index(fields=['tipo', 'estado']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        recipient = self.topic if self.topic else (self.user.email if self.user else 'Sin destinatario')
        return f'{self.titulo} - {recipient} ({self.estado})'

    def mark_as_sent(self, message_id):
        """Marca la notificación como enviada"""
        self.estado = 'enviada'
        self.message_id = message_id
        self.sent_at = timezone.now()
        self.save(update_fields=['estado', 'message_id', 'sent_at'])

    def mark_as_failed(self, error):
        """Marca la notificación como fallida"""
        self.estado = 'fallida'
        self.error_message = str(error)
        self.save(update_fields=['estado', 'error_message'])

    def mark_as_read(self):
        """Marca la notificación como leída"""
        self.estado = 'leida'
        self.read_at = timezone.now()
        self.save(update_fields=['estado', 'read_at'])
