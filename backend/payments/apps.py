"""
Configuración de la app de Pagos
"""
from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payments'
    verbose_name = 'Sistema de Pagos'
    
    def ready(self):
        """Inicializar configuraciones al cargar la app"""
        pass
