"""
Modelos para el sistema de pagos
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid


class MetodoPago(models.Model):
    """Métodos de pago disponibles en el sistema"""
    
    TIPO_CHOICES = [
        ('tarjeta', 'Tarjeta de Crédito/Débito'),
        ('transferencia', 'Transferencia Bancaria'),
        ('qr', 'Código QR'),
        ('efectivo', 'Efectivo'),
        ('wallet', 'Billetera Digital'),
    ]
    
    PROVEEDOR_CHOICES = [
        ('stripe', 'Stripe'),
        ('mercadopago', 'MercadoPago'),
        ('paypal', 'PayPal'),
        ('manual', 'Manual'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, verbose_name='Nombre del método')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    proveedor = models.CharField(max_length=20, choices=PROVEEDOR_CHOICES)
    
    # Configuración
    activo = models.BooleanField(default=True, verbose_name='¿Está activo?')
    comision_porcentaje = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        verbose_name='Comisión (%)',
        help_text='Comisión del proveedor en porcentaje'
    )
    comision_fija = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Comisión fija',
        help_text='Comisión fija por transacción'
    )
    
    # Configuración adicional (JSON para flexibilidad)
    configuracion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración adicional',
        help_text='Configuración específica del proveedor'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Método de Pago'
        verbose_name_plural = 'Métodos de Pago'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_proveedor_display()})"
    
    def calcular_comision(self, monto):
        """Calcular comisión total para un monto"""
        comision_porcentaje = monto * (self.comision_porcentaje / 100)
        return comision_porcentaje + self.comision_fija


class Pago(models.Model):
    """Registro de pagos realizados"""
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('completado', 'Completado'),
        ('fallido', 'Fallido'),
        ('cancelado', 'Cancelado'),
        ('reembolsado', 'Reembolsado'),
        ('reembolso_parcial', 'Reembolso Parcial'),
    ]
    
    MONEDA_CHOICES = [
        ('BOB', 'Bolivianos'),
        ('USD', 'Dólares'),
        ('EUR', 'Euros'),
    ]
    
    # Identificadores
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_orden = models.CharField(
        max_length=50, 
        unique=True, 
        editable=False,
        verbose_name='Número de orden',
        help_text='Número único de orden generado automáticamente'
    )
    
    # Relaciones
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Usuario'
    )
    metodo_pago = models.ForeignKey(
        MetodoPago,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Método de pago'
    )
    
    # Información del pago
    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto'
    )
    moneda = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default='BOB',
        verbose_name='Moneda'
    )
    comision = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Comisión'
    )
    monto_neto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto neto',
        help_text='Monto - comisión'
    )
    
    # Estado y tracking
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    descripcion = models.TextField(verbose_name='Descripción del pago')
    
    # IDs externos de pasarelas
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Stripe Payment Intent ID'
    )
    mercadopago_payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='MercadoPago Payment ID'
    )
    external_reference = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Referencia externa'
    )
    
    # Metadata adicional
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Información adicional en formato JSON'
    )
    
    # Información del cliente (snapshot al momento del pago)
    cliente_nombre = models.CharField(max_length=200, verbose_name='Nombre del cliente')
    cliente_email = models.EmailField(verbose_name='Email del cliente')
    cliente_telefono = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    
    # Dirección de facturación (opcional)
    direccion_facturacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Dirección de facturación'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    pagado_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de pago')
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['estado']),
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['numero_orden']),
        ]
    
    def __str__(self):
        return f"Pago {self.numero_orden} - {self.get_estado_display()}"
    
    def save(self, *args, **kwargs):
        """Generar número de orden y calcular comisiones automáticamente"""
        if not self.numero_orden:
            # Generar número de orden único
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_part = str(uuid.uuid4().hex[:6]).upper()
            self.numero_orden = f"ORD-{timestamp}-{random_part}"
        
        # Calcular comisión y monto neto
        if self.metodo_pago:
            self.comision = self.metodo_pago.calcular_comision(self.monto)
            self.monto_neto = self.monto - self.comision
        else:
            self.monto_neto = self.monto
        
        super().save(*args, **kwargs)
    
    def marcar_como_completado(self, external_id=None):
        """Marcar pago como completado"""
        self.estado = 'completado'
        self.pagado_at = timezone.now()
        
        if external_id:
            if self.metodo_pago.proveedor == 'stripe':
                self.stripe_payment_intent_id = external_id
            elif self.metodo_pago.proveedor == 'mercadopago':
                self.mercadopago_payment_id = external_id
        
        self.save()
    
    def marcar_como_fallido(self, razon=''):
        """Marcar pago como fallido"""
        self.estado = 'fallido'
        if razon:
            if not self.metadata:
                self.metadata = {}
            self.metadata['razon_fallo'] = razon
        self.save()
    
    def cancelar(self, razon=''):
        """Cancelar pago"""
        if self.estado in ['completado', 'reembolsado']:
            raise ValueError('No se puede cancelar un pago completado o reembolsado')
        
        self.estado = 'cancelado'
        if razon:
            if not self.metadata:
                self.metadata = {}
            self.metadata['razon_cancelacion'] = razon
        self.save()


class Transaccion(models.Model):
    """Log detallado de todas las transacciones"""
    
    TIPO_CHOICES = [
        ('pago', 'Pago'),
        ('reembolso', 'Reembolso'),
        ('cargo', 'Cargo'),
        ('transferencia', 'Transferencia'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pago = models.ForeignKey(
        Pago,
        on_delete=models.CASCADE,
        related_name='transacciones',
        verbose_name='Pago'
    )
    
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, default='BOB')
    
    # IDs externos
    external_id = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='ID externo'
    )
    
    # Detalles
    descripcion = models.TextField(blank=True)
    exitosa = models.BooleanField(default=True)
    error_mensaje = models.TextField(blank=True, verbose_name='Mensaje de error')
    
    # Request/Response de la API (para debugging)
    request_data = models.JSONField(default=dict, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Transacción'
        verbose_name_plural = 'Transacciones'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.monto} {self.moneda}"


class Reembolso(models.Model):
    """Registro de reembolsos"""
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('completado', 'Completado'),
        ('fallido', 'Fallido'),
        ('cancelado', 'Cancelado'),
    ]
    
    MOTIVO_CHOICES = [
        ('solicitud_cliente', 'Solicitud del Cliente'),
        ('producto_defectuoso', 'Producto Defectuoso'),
        ('error_sistema', 'Error del Sistema'),
        ('duplicado', 'Pago Duplicado'),
        ('otro', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pago = models.ForeignKey(
        Pago,
        on_delete=models.CASCADE,
        related_name='reembolsos',
        verbose_name='Pago'
    )
    
    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto a reembolsar'
    )
    motivo = models.CharField(max_length=30, choices=MOTIVO_CHOICES)
    descripcion = models.TextField(verbose_name='Descripción del motivo')
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    
    # IDs externos
    stripe_refund_id = models.CharField(max_length=255, blank=True, null=True)
    mercadopago_refund_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Usuario que solicitó el reembolso
    solicitado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reembolsos_solicitados',
        verbose_name='Solicitado por'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    procesado_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Reembolso'
        verbose_name_plural = 'Reembolsos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reembolso {self.monto} para {self.pago.numero_orden}"
    
    def procesar(self):
        """Marcar reembolso como procesado"""
        self.estado = 'completado'
        self.procesado_at = timezone.now()
        self.save()
        
        # Actualizar estado del pago
        total_reembolsado = self.pago.reembolsos.filter(
            estado='completado'
        ).aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal('0')
        
        if total_reembolsado >= self.pago.monto:
            self.pago.estado = 'reembolsado'
        else:
            self.pago.estado = 'reembolso_parcial'
        
        self.pago.save()


class WebhookLog(models.Model):
    """Log de webhooks recibidos de las pasarelas de pago"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proveedor = models.CharField(max_length=50, verbose_name='Proveedor')
    evento_tipo = models.CharField(max_length=100, verbose_name='Tipo de evento')
    
    # Datos del webhook
    payload = models.JSONField(verbose_name='Payload completo')
    headers = models.JSONField(default=dict, verbose_name='Headers HTTP')
    
    # Procesamiento
    procesado = models.BooleanField(default=False)
    procesado_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, verbose_name='Error al procesar')
    
    # Pago relacionado (si se pudo identificar)
    pago = models.ForeignKey(
        Pago,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_logs'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Webhook Log'
        verbose_name_plural = 'Webhook Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-created_at']),
            models.Index(fields=['procesado']),
        ]
    
    def __str__(self):
        return f"{self.proveedor} - {self.evento_tipo}"
    
    def marcar_como_procesado(self):
        """Marcar webhook como procesado"""
        self.procesado = True
        self.procesado_at = timezone.now()
        self.save()
