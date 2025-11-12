from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from decimal import Decimal


class Categoria(models.Model):
    """Categorías de productos para organizar el catálogo"""
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    descripcion = models.TextField(blank=True)
    imagen = models.ImageField(upload_to='categorias/', blank=True, null=True)
    activa = models.BooleanField(default=True)
    orden = models.IntegerField(default=0, help_text="Orden de visualización")
    
    # Auditoría
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['orden', 'nombre']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """Producto principal del catálogo"""
    # Información básica
    nombre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    descripcion = models.TextField()
    descripcion_corta = models.CharField(
        max_length=300, 
        blank=True,
        help_text="Descripción breve para las tarjetas de producto"
    )
    
    # Imagen principal
    imagen = models.ImageField(
        upload_to='productos/',
        blank=True,
        null=True,
        help_text="Imagen principal del producto"
    )
    
    # Categorización
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='productos'
    )
    
    # Precios
    precio = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Ofertas y descuentos
    en_oferta = models.BooleanField(default=False)
    precio_oferta = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    descuento_porcentaje = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Porcentaje de descuento (0-100)"
    )
    fecha_inicio_oferta = models.DateTimeField(null=True, blank=True)
    fecha_fin_oferta = models.DateTimeField(null=True, blank=True)
    
    # Inventario
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    stock_minimo = models.IntegerField(
        default=5,
        help_text="Alerta cuando el stock sea menor o igual a este valor"
    )
    
    # Garantía
    meses_garantia = models.IntegerField(
        default=12,
        validators=[MinValueValidator(0)],
        help_text="Meses de garantía del producto"
    )
    descripcion_garantia = models.TextField(
        default="Garantía del fabricante",
        help_text="Descripción detallada de la garantía"
    )
    
    # Características adicionales
    sku = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True,
        help_text="Código único del producto (Stock Keeping Unit)"
    )
    codigo_barras = models.CharField(max_length=50, blank=True)
    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    peso = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Peso en kilogramos"
    )
    
    # Estado y visibilidad
    activo = models.BooleanField(default=True, help_text="Producto visible en la tienda")
    destacado = models.BooleanField(default=False, help_text="Mostrar en sección destacados")
    
    # Estadísticas
    vistas = models.IntegerField(default=0, help_text="Número de visitas al producto")
    ventas = models.IntegerField(default=0, help_text="Cantidad de unidades vendidas")
    
    # Auditoría
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['-creado']
        indexes = [
            models.Index(fields=['categoria', 'activo']),
            models.Index(fields=['slug']),
            models.Index(fields=['sku']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        
        # Generar SKU automáticamente si no existe
        if not self.sku:
            ultimo_id = Producto.objects.all().order_by('id').last()
            nuevo_id = 1 if not ultimo_id else ultimo_id.id + 1
            self.sku = f"PROD-{nuevo_id:06d}"
        
        super().save(*args, **kwargs)
    
    def get_precio_final(self):
        """Retorna el precio final considerando ofertas"""
        if self.en_oferta and self.precio_oferta:
            return self.precio_oferta
        return self.precio
    
    def get_descuento_monto(self):
        """Calcula el monto de descuento"""
        if self.en_oferta and self.precio_oferta:
            return self.precio - self.precio_oferta
        return Decimal('0.00')
    
    def tiene_stock(self):
        """Verifica si hay stock disponible"""
        return self.stock > 0
    
    def stock_bajo(self):
        """Verifica si el stock está bajo"""
        return self.stock <= self.stock_minimo
    
    def __str__(self):
        return self.nombre


class ProductoImagen(models.Model):
    """Galería de imágenes para cada producto"""
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE, 
        related_name='imagenes'
    )
    imagen = models.ImageField(upload_to='productos/')
    es_principal = models.BooleanField(
        default=False,
        help_text="Imagen principal del producto"
    )
    orden = models.IntegerField(default=0, help_text="Orden de visualización")
    alt_text = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Texto alternativo para accesibilidad"
    )
    
    creado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Imagen del Producto"
        verbose_name_plural = "Imágenes de Productos"
        ordering = ['orden', '-es_principal']
    
    def save(self, *args, **kwargs):
        # Si es principal, desmarcar otras imágenes principales
        if self.es_principal:
            ProductoImagen.objects.filter(
                producto=self.producto, 
                es_principal=True
            ).exclude(id=self.id).update(es_principal=False)
        
        # Si es la primera imagen, marcarla como principal
        if not self.pk and not ProductoImagen.objects.filter(producto=self.producto).exists():
            self.es_principal = True
        
        if not self.alt_text:
            self.alt_text = f"Imagen de {self.producto.nombre}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Imagen de {self.producto.nombre} - {self.orden}"


class ProductoVariante(models.Model):
    """Variantes de productos (tallas, colores, etc.)"""
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE, 
        related_name='variantes'
    )
    nombre = models.CharField(
        max_length=100,
        help_text="Ej: 'Rojo - M', 'Azul - L', '128GB'"
    )
    sku = models.CharField(max_length=50, unique=True)
    precio_adicional = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Precio adicional sobre el precio base"
    )
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    activa = models.BooleanField(default=True)
    
    # Atributos específicos (JSON flexible)
    color = models.CharField(max_length=50, blank=True)
    talla = models.CharField(max_length=20, blank=True)
    material = models.CharField(max_length=50, blank=True)
    
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Variante del Producto"
        verbose_name_plural = "Variantes de Productos"
        ordering = ['nombre']
        unique_together = [['producto', 'nombre']]
    
    def get_precio_total(self):
        """Precio total de la variante"""
        return self.producto.get_precio_final() + self.precio_adicional
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.nombre}"
