from django.db import models
from django.conf import settings
from django.utils import timezone
from productos.models import Producto
import uuid


class Pedido(models.Model):
    """
    Pedido/Orden de compra
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('PROCESANDO', 'Procesando'),
        ('ENVIADO', 'Enviado'),
        ('ENTREGADO', 'Entregado'),
        ('CANCELADO', 'Cancelado'),
        ('REEMBOLSADO', 'Reembolsado'),
    ]

    numero_pedido = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name='Número de pedido'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pedidos',
        verbose_name='Cliente'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    
    # Montos
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    descuento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Descuento'
    )
    impuestos = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Impuestos'
    )
    costo_envio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Costo de envío'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Total'
    )
    
    # Notas
    notas_cliente = models.TextField(
        blank=True,
        verbose_name='Notas del cliente'
    )
    notas_internas = models.TextField(
        blank=True,
        verbose_name='Notas internas'
    )
    
    # Fechas
    creado = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    actualizado = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    pagado_en = models.DateTimeField(null=True, blank=True, verbose_name='Pagado el')
    enviado_en = models.DateTimeField(null=True, blank=True, verbose_name='Enviado el')
    entregado_en = models.DateTimeField(null=True, blank=True, verbose_name='Entregado el')

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-creado']
        indexes = [
            models.Index(fields=['numero_pedido']),
            models.Index(fields=['usuario', '-creado']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.numero_pedido} - {self.usuario.email}"

    def save(self, *args, **kwargs):
        if not self.numero_pedido:
            # Generar número de pedido único
            fecha = timezone.now().strftime('%Y%m%d')
            uid = str(uuid.uuid4())[:8].upper()
            self.numero_pedido = f"ORD-{fecha}-{uid}"
        super().save(*args, **kwargs)

    def actualizar_estado(self, nuevo_estado):
        """Actualizar estado del pedido con fechas automáticas"""
        self.estado = nuevo_estado
        if nuevo_estado == 'PAGADO' and not self.pagado_en:
            self.pagado_en = timezone.now()
        elif nuevo_estado == 'ENVIADO' and not self.enviado_en:
            self.enviado_en = timezone.now()
        elif nuevo_estado == 'ENTREGADO' and not self.entregado_en:
            self.entregado_en = timezone.now()
        self.save()


class ItemPedido(models.Model):
    """
    Item individual en un pedido
    """
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='items_pedido',
        verbose_name='Producto'
    )
    
    # Información guardada en el momento de la compra
    nombre_producto = models.CharField(
        max_length=255,
        verbose_name='Nombre del producto'
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='SKU'
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario'
    )
    cantidad = models.PositiveIntegerField(
        verbose_name='Cantidad'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    
    # Variante info (guardado como JSON si es necesario)
    variante_info = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Información de variante'
    )

    class Meta:
        verbose_name = 'Item de Pedido'
        verbose_name_plural = 'Items de Pedido'
        ordering = ['id']

    def __str__(self):
        return f"{self.cantidad}x {self.nombre_producto}"

    def save(self, *args, **kwargs):
        """Calcular subtotal automáticamente"""
        if not self.subtotal:
            self.subtotal = self.cantidad * self.precio_unitario
        if not self.nombre_producto:
            self.nombre_producto = self.producto.nombre
        if not self.sku:
            self.sku = self.producto.sku
        super().save(*args, **kwargs)


class DireccionEnvio(models.Model):
    """
    Dirección de envío del pedido
    """
    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.CASCADE,
        related_name='direccion_envio',
        verbose_name='Pedido'
    )
    nombre_completo = models.CharField(
        max_length=255,
        verbose_name='Nombre completo'
    )
    telefono = models.CharField(
        max_length=20,
        verbose_name='Teléfono'
    )
    email = models.EmailField(
        verbose_name='Email'
    )
    direccion = models.CharField(
        max_length=255,
        verbose_name='Dirección'
    )
    referencia = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Referencia'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=100,
        verbose_name='Departamento'
    )
    codigo_postal = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Código postal'
    )

    class Meta:
        verbose_name = 'Dirección de Envío'
        verbose_name_plural = 'Direcciones de Envío'

    def __str__(self):
        return f"{self.nombre_completo} - {self.ciudad}, {self.departamento}"
