from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Categoria(models.Model):
    """Categorías de productos"""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """Modelo de productos para el sistema"""
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    imagen = models.URLField(blank=True, null=True, help_text="URL de la imagen del producto")
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos'
    )
    activo = models.BooleanField(default=True)
    destacado = models.BooleanField(default=False, help_text="Mostrar en sección destacados")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-destacado', '-created_at']
        indexes = [
            models.Index(fields=['activo', 'stock']),
            models.Index(fields=['categoria', 'activo']),
        ]

    def __str__(self):
        return f"{self.nombre} - Bs. {self.precio}"

    @property
    def disponible(self):
        """Verifica si el producto está disponible para venta"""
        return self.activo and self.stock > 0

    def reducir_stock(self, cantidad):
        """Reduce el stock del producto"""
        if self.stock >= cantidad:
            self.stock -= cantidad
            self.save()
            return True
        return False

    def incrementar_stock(self, cantidad):
        """Incrementa el stock del producto"""
        self.stock += cantidad
        self.save()

