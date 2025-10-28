from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()


class Personal(models.Model):
    """Modelo para personal de la empresa - Refactorizado según especificaciones"""

    # Datos personales básicos (obligatorios)
    nombre = models.CharField(max_length=100, verbose_name="Nombre")

    apellido = models.CharField(max_length=100, verbose_name="Apellido")

    fecha_nacimiento = models.DateField(verbose_name="Fecha de Nacimiento")

    telefono = models.CharField(max_length=20, verbose_name="Teléfono")

    email = models.EmailField(unique=True, verbose_name="Email")

    ci = models.CharField(
        max_length=20, unique=True, verbose_name="Cédula de Identidad"
    )

    # Información específica del personal
    codigo_empleado = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[A-Z0-9]+$",
                message="El código de empleado debe contener solo letras mayúsculas y números",
            )
        ],
        verbose_name="Código de Empleado",
    )
    
    # Información laboral
    fecha_ingreso = models.DateField(
        verbose_name="Fecha de Ingreso"
    )
    
    # Estado del empleado (simplificado a boolean)
    estado = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )
    
    # Información de emergencia (opcional)
    telefono_emergencia = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="Teléfono de Emergencia"
    )

    contacto_emergencia = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Contacto de Emergencia"
    )
    
    # Relación con el usuario eliminada - se maneja desde users.models.CustomUser
    
    # Campos de control automáticos
    fecha_creacion = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True, verbose_name="Fecha de Actualización"
    )

    class Meta:
        verbose_name = "Personal"
        verbose_name_plural = "Personal"
        ordering = ["-fecha_creacion"]
        indexes = [
            models.Index(fields=['ci']),
            models.Index(fields=['email']),
            models.Index(fields=['codigo_empleado']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['email'], name='unique_personal_email'),
            models.UniqueConstraint(fields=['ci'], name='unique_personal_ci'),
            models.UniqueConstraint(fields=['codigo_empleado'], name='unique_personal_codigo_empleado'),
        ]

    def __str__(self):
        return f"{self.get_full_name()} - {self.codigo_empleado}"

    def get_full_name(self):
        """Retorna el nombre completo del empleado"""
        return f"{self.nombre} {self.apellido}".strip()

    @property
    def nombre_completo(self):
        """Retorna el nombre completo del empleado"""
        return self.get_full_name()

    @property
    def anos_antiguedad(self):
        """Calcula los años de antigüedad"""
        from datetime import date

        hoy = date.today()
        anos = hoy.year - self.fecha_ingreso.year

        # Ajustar si aún no ha cumplido el año
        if hoy.month < self.fecha_ingreso.month or (
            hoy.month == self.fecha_ingreso.month and hoy.day < self.fecha_ingreso.day
        ):
            anos -= 1

        return max(0, anos)

    def cambiar_estado(self, nuevo_estado):
        """Cambia el estado del empleado"""
        if isinstance(nuevo_estado, bool):
            self.estado = nuevo_estado
            self.save(update_fields=["estado", "fecha_actualizacion"])
            return True
        return False

    def puede_acceder_sistema(self):
        """Verifica si el empleado puede acceder al sistema"""
        # Ahora se verifica desde el modelo CustomUser que tiene la relación
        return self.estado
