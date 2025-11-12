from django.db import models
from django.conf import settings
from ventas.models import Pedido


class MetodoPago(models.Model):
    """
    Métodos de pago disponibles en el sistema
    """
    TIPO_CHOICES = [
        ('STRIPE', 'Tarjeta de Crédito/Débito (Stripe)'),
        ('PAYPAL', 'PayPal'),
        ('QR', 'QR Bolivia'),
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia Bancaria'),
    ]
    
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre del método"
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name="Tipo de pago"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )
    
    # Configuración específica (JSON)
    configuracion = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuración específica del método de pago"
    )
    
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Método de Pago"
        verbose_name_plural = "Métodos de Pago"
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


class TransaccionPago(models.Model):
    """
    Registro de todas las transacciones de pago
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('EXITOSO', 'Exitoso'),
        ('FALLIDO', 'Fallido'),
        ('CANCELADO', 'Cancelado'),
        ('REEMBOLSADO', 'Reembolsado'),
    ]
    
    # Relaciones
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.PROTECT,
        related_name='transacciones',
        verbose_name="Pedido"
    )
    metodo_pago = models.ForeignKey(
        MetodoPago,
        on_delete=models.PROTECT,
        related_name='transacciones',
        verbose_name="Método de pago"
    )
    
    # Información de la transacción
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado"
    )
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Monto"
    )
    moneda = models.CharField(
        max_length=3,
        default='BOB',
        verbose_name="Moneda"
    )
    
    # IDs externos (Stripe, PayPal, etc.)
    id_externo = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID de transacción externa",
        help_text="Payment Intent ID, Transaction ID, etc."
    )
    
    # Metadata de la transacción
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Información adicional de la transacción (respuesta del gateway, etc.)"
    )
    
    # Información del error (si aplica)
    mensaje_error = models.TextField(
        blank=True,
        null=True,
        verbose_name="Mensaje de error"
    )
    
    # Timestamps
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    procesado_en = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Fecha de procesamiento"
    )
    
    class Meta:
        verbose_name = "Transacción de Pago"
        verbose_name_plural = "Transacciones de Pago"
        ordering = ['-creado']
        indexes = [
            models.Index(fields=['pedido', '-creado']),
            models.Index(fields=['estado']),
            models.Index(fields=['id_externo']),
        ]
    
    def __str__(self):
        return f"Transacción {self.id} - {self.pedido.numero_pedido} - {self.get_estado_display()}"
    
    def marcar_como_exitoso(self):
        """Marcar la transacción como exitosa y actualizar el pedido"""
        from django.utils import timezone
        self.estado = 'EXITOSO'
        self.procesado_en = timezone.now()
        self.save()
        
        # Actualizar estado del pedido a PAGADO
        self.pedido.actualizar_estado('PAGADO')
    
    def marcar_como_fallido(self, mensaje_error=None):
        """Marcar la transacción como fallida"""
        self.estado = 'FALLIDO'
        if mensaje_error:
            self.mensaje_error = mensaje_error
        self.save()
    
    def reembolsar(self):
        """Marcar la transacción como reembolsada"""
        from django.utils import timezone
        self.estado = 'REEMBOLSADO'
        self.save()
        
        # Actualizar estado del pedido a REEMBOLSADO
        self.pedido.actualizar_estado('REEMBOLSADO')
