from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notificaciones Push'

    def ready(self):
        """Inicializa Firebase cuando la app está lista"""
        from .firebase_config import initialize_firebase
        initialize_firebase()
