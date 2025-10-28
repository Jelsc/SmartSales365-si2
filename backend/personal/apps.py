from django.apps import AppConfig


class PersonalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'personal'
    verbose_name = 'Personal de Empresa'
    
    def ready(self):
        """Se ejecuta cuando la aplicación está lista"""
        try:
            import personal.signals  # Importar señales si las hay
        except ImportError:
            # No hay archivo de señales, no es un error
            pass
