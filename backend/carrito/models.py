from django.db import models
from django.conf import settings
from productos.models import Producto, ProductoVariante


class Carrito(models.Model):
    """
    Carrito de compras - puede ser de usuario autenticado o anónimo
    """
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carritos',
        verbose_name='Usuario'
    )
    session_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='ID de Sesión',
        help_text='Para usuarios anónimos'
    )
    creado = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    actualizado = models.DateTimeField(auto_now=True, verbose_name='Última actualización')

    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'
        ordering = ['-actualizado']
        indexes = [
            models.Index(fields=['usuario']),
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        if self.usuario:
            return f"Carrito de {self.usuario.email}"
        return f"Carrito anónimo ({self.session_key[:8]}...)"

    @property
    def total_items(self):
        """Cantidad total de items en el carrito"""
        return self.items.aggregate(total=models.Sum('cantidad'))['total'] or 0

    @property
    def subtotal(self):
        """Subtotal del carrito"""
        total = sum(item.subtotal for item in self.items.all())
        return round(total, 2)

    @property
    def total(self):
        """Total del carrito (puede incluir impuestos en el futuro)"""
        return self.subtotal

    def limpiar(self):
        """Vaciar el carrito"""
        self.items.all().delete()


class ItemCarrito(models.Model):
    """
    Item individual en el carrito de compras
    """
    carrito = models.ForeignKey(
        Carrito,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Carrito'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='items_carrito',
        verbose_name='Producto'
    )
    variante = models.ForeignKey(
        ProductoVariante,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='items_carrito',
        verbose_name='Variante'
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad'
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio al momento de agregar al carrito'
    )
    agregado = models.DateTimeField(auto_now_add=True, verbose_name='Agregado el')

    class Meta:
        verbose_name = 'Item de Carrito'
        verbose_name_plural = 'Items de Carrito'
        ordering = ['agregado']
        unique_together = [['carrito', 'producto', 'variante']]

    def __str__(self):
        if self.variante:
            return f"{self.cantidad}x {self.producto.nombre} ({self.variante.nombre})"
        return f"{self.cantidad}x {self.producto.nombre}"

    @property
    def subtotal(self):
        """Subtotal del item"""
        return round(self.cantidad * self.precio_unitario, 2)

    def save(self, *args, **kwargs):
        """Guardar precio unitario al crear"""
        if not self.precio_unitario:
            if self.variante and self.variante.precio_adicional:
                self.precio_unitario = self.producto.precio + self.variante.precio_adicional
            elif self.producto.en_oferta and self.producto.precio_oferta:
                self.precio_unitario = self.producto.precio_oferta
            else:
                self.precio_unitario = self.producto.precio
        super().save(*args, **kwargs)
