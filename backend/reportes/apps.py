from django.apps import AppConfig


class ReportesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reportes'
    verbose_name = 'Reportes Dinámicos'

    def ready(self):
        """Inicialización al cargar la app"""
        pass
