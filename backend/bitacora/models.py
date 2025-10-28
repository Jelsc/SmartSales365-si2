from django.db import models
from django.conf import settings
from django.utils.timezone import now

class Bitacora(models.Model):
    MODULOS = [
        ('USUARIOS', 'Usuarios'),
        ('ADMINISTRACION', 'Administracion'),
        ('TRANSPORTE', 'Transporte'),
        ('RESERVAS', 'Reservas'),
        ('PAGOS', 'Pagos'),
        ('GENERAL', 'General'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    accion = models.CharField(max_length=100)  # LOGIN, LOGOUT, CREACION_USUARIO, etc.
    descripcion = models.TextField(blank=True)
    fecha_hora = models.DateTimeField(default=now)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    modulo = models.CharField(max_length=50, choices=MODULOS, default='GENERAL')

def __str__(self):
    usuario = getattr(self.usuario, "username", "Sistema")
    return f"{self.fecha_hora} | {usuario} | {self.accion} | {self.modulo}"