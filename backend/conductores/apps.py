from django.apps import AppConfig


class ConductoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'conductores'
    verbose_name = 'Conductores'
    
    def ready(self):
        """Se ejecuta cuando la aplicación está lista"""
        try:
            import conductores.signals  # Importar señales si las hay
        except ImportError:
            # No hay archivo de señales, no es un error
            pass
