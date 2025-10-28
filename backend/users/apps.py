from django.apps import AppConfig


class UsersConfig(AppConfig):
    """
    Configuración de la aplicación users
    
    Sistema de usuarios refactorizado con:
    - Autenticación unificada
    - Registro diferenciado
    - Permisos simplificados
    - Gestión de roles optimizada
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = 'Sistema de Usuarios'
    
    def ready(self):
        """
        Configuración inicial de la aplicación
        
        Nota: Django maneja automáticamente date_joined y last_login.
        No necesitamos señales personalizadas para esto.
        """
        # Django maneja automáticamente:
        # - date_joined: Se establece al crear el usuario
        # - last_login: Se actualiza automáticamente en cada login
        pass