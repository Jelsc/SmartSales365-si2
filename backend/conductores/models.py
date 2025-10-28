from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()


class Conductor(models.Model):
    """Modelo para conductores del sistema de transporte"""
    
    ESTADOS_CHOICES = [
        ('disponible', 'Disponible'),
        ('ocupado', 'Ocupado'),
        ('descanso', 'En Descanso'),
        ('inactivo', 'Inactivo'),
    ]
    
    TIPOS_LICENCIA_CHOICES = [
        ('A', 'Tipo A - Motocicletas'),
        ('B', 'Tipo B - Vehículos particulares'),
        ('C', 'Tipo C - Vehículos de carga liviana'),
        ('D', 'Tipo D - Vehículos de carga pesada'),
        ('E', 'Tipo E - Vehículos de transporte público'),
    ]
    
    # Datos personales básicos (obligatorios)
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre",
        default=""
    )
    
    apellido = models.CharField(
        max_length=100,
        verbose_name="Apellido",
        default=""
    )
    
    fecha_nacimiento = models.DateField(
        verbose_name="Fecha de Nacimiento",
        null=True,
        blank=True
    )
    
    telefono = models.CharField(
        max_length=20,
        verbose_name="Teléfono",
        default=""
    )
    
    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        default=""
    )
    
    ci = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Cédula de Identidad",
        default=""
    )
    
    # Relación con el usuario eliminada - se maneja desde users.models.CustomUser
    
    # Información específica del conductor
    nro_licencia = models.CharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(
            regex=r'^[A-Z0-9]+$',
            message='El número de licencia debe contener solo letras mayúsculas y números'
        )],
        verbose_name="Número de Licencia"
    )
    
    tipo_licencia = models.CharField(
        max_length=1,
        choices=TIPOS_LICENCIA_CHOICES,
        verbose_name="Tipo de Licencia"
    )
    
    fecha_venc_licencia = models.DateField(
        verbose_name="Fecha de Vencimiento de Licencia"
    )
    
    # Estado operacional del conductor
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_CHOICES,
        default='disponible',
        verbose_name="Estado"
    )
    
    # Información adicional
    experiencia_anios = models.PositiveIntegerField(
        default=0,
        verbose_name="Años de Experiencia"
    )
    
    telefono_emergencia = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Teléfono de Emergencia"
    )
    
    contacto_emergencia = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Contacto de Emergencia"
    )
    
    # Campos de control
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización"
    )
    
    # Campos para seguimiento
    ultima_ubicacion_lat = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name="Última Ubicación - Latitud"
    )
    
    ultima_ubicacion_lng = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name="Última Ubicación - Longitud"
    )
    
    ultima_actualizacion_ubicacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Última Actualización de Ubicación"
    )
    
    class Meta:
        verbose_name = "Conductor"
        verbose_name_plural = "Conductores"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['nro_licencia']),
            models.Index(fields=['fecha_venc_licencia']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} - {self.nro_licencia}"
    
    def get_full_name(self):
        """Retorna el nombre completo del conductor"""
        return f"{self.nombre} {self.apellido}".strip()
    
    @property
    def nombre_completo(self):
        """Retorna el nombre completo del conductor"""
        return self.get_full_name()
    
    @property
    def estado_usuario(self):
        """Estado del usuario (activo/inactivo) - ahora se accede desde users.models.CustomUser"""
        # Esta propiedad ahora se maneja desde el modelo CustomUser
        return 'sin_usuario'  # Por defecto, ya que la relación se maneja desde users
    
    @property
    def licencia_vencida(self):
        """Verifica si la licencia está vencida"""
        from django.utils import timezone
        return self.fecha_venc_licencia < timezone.now().date()
    
    @property
    def dias_para_vencer_licencia(self):
        """Calcula los días restantes para el vencimiento de la licencia"""
        from django.utils import timezone
        from datetime import timedelta
        
        hoy = timezone.now().date()
        dias_restantes = (self.fecha_venc_licencia - hoy).days
        return dias_restantes
    
    def cambiar_estado(self, nuevo_estado):
        """Cambia el estado operacional del conductor"""
        if nuevo_estado in [choice[0] for choice in self.ESTADOS_CHOICES]:
            self.estado = nuevo_estado
            self.save(update_fields=['estado', 'fecha_actualizacion'])
            return True
        return False
    
    def actualizar_ubicacion(self, latitud, longitud):
        """Actualiza la ubicación del conductor"""
        from django.utils import timezone
        
        self.ultima_ubicacion_lat = latitud
        self.ultima_ubicacion_lng = longitud
        self.ultima_actualizacion_ubicacion = timezone.now()
        self.save(update_fields=[
            'ultima_ubicacion_lat', 
            'ultima_ubicacion_lng', 
            'ultima_actualizacion_ubicacion',
            'fecha_actualizacion'
        ])
    
    def puede_conducir(self):
        """Verifica si el conductor puede conducir (activo, licencia válida, etc.)"""
        # Ahora se verifica desde el modelo CustomUser que tiene la relación
        return (
            not self.licencia_vencida and 
            self.estado in ['disponible', 'ocupado']
        )
