from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ReporteGenerado(models.Model):
    """
    Modelo para almacenar historial de reportes generados.
    Permite auditoría y reutilización de reportes previos.
    """
    TIPO_CHOICES = [
        ('ventas', 'Ventas'),
        ('productos', 'Productos'),
        ('clientes', 'Clientes'),
        ('ingresos', 'Ingresos'),
    ]

    FORMATO_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
    ]

    AGRUPACION_CHOICES = [
        ('producto', 'Por Producto'),
        ('cliente', 'Por Cliente'),
        ('categoria', 'Por Categoría'),
        ('fecha', 'Por Fecha'),
        ('ninguno', 'Sin Agrupación'),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reportes',
        verbose_name='Usuario'
    )
    prompt_original = models.TextField(
        verbose_name='Prompt Original',
        help_text='Comando de voz o texto ingresado por el usuario'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de Reporte'
    )
    periodo_inicio = models.DateField(
        verbose_name='Fecha Inicio',
        null=True,
        blank=True
    )
    periodo_fin = models.DateField(
        verbose_name='Fecha Fin',
        null=True,
        blank=True
    )
    agrupacion = models.CharField(
        max_length=20,
        choices=AGRUPACION_CHOICES,
        default='ninguno',
        verbose_name='Agrupación'
    )
    formato = models.CharField(
        max_length=10,
        choices=FORMATO_CHOICES,
        verbose_name='Formato'
    )
    archivo = models.FileField(
        upload_to='reportes/%Y/%m/',
        verbose_name='Archivo Generado',
        null=True,
        blank=True
    )
    datos_json = models.JSONField(
        verbose_name='Datos del Reporte',
        help_text='Datos en formato JSON para reutilización',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Generación'
    )

    class Meta:
        verbose_name = 'Reporte Generado'
        verbose_name_plural = 'Reportes Generados'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['tipo', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.usuario.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
