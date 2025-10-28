"""
CONSTANTS.PY - CONSTANTES SIMPLIFICADAS

RESPONSABILIDADES:
- Permisos esenciales del sistema (reducidos de 67 a 20)
- Grupos de permisos predefinidos
- Constantes del sistema
- Configuraciones por defecto

DIFERENCIAS CON SISTEMA ANTERIOR:
- Permisos reducidos y más enfocados
- Mejor organización por funcionalidad
- Menos complejidad
- Mejor rendimiento
"""

# ========================================
# PERMISOS ESENCIALES (20 permisos)
# ========================================

# PERMISOS DE AUTENTICACIÓN
AUTH_PERMISSIONS = [
    "ver_perfil",
    "editar_perfil",
    "cambiar_contraseña",
]

# PERMISOS DE GESTIÓN DE USUARIOS
USER_MANAGEMENT_PERMISSIONS = [
    "gestionar_usuarios",
    "ver_usuarios",
    "crear_usuarios",
    "editar_usuarios",
    "eliminar_usuarios",
    "activar_desactivar_usuarios",
]

# PERMISOS DE GESTIÓN DE ROLES
ROLE_MANAGEMENT_PERMISSIONS = [
    "gestionar_roles",
    "ver_roles",
    "crear_roles",
    "editar_roles",
    "eliminar_roles",
]

# PERMISOS DE GESTIÓN DE CONDUCTORES
DRIVER_MANAGEMENT_PERMISSIONS = [
    "gestionar_conductores",
    "ver_conductores",
    "crear_conductores",
    "editar_conductores",
    "eliminar_conductores",
]

# PERMISOS DE GESTIÓN DE PERSONAL
STAFF_MANAGEMENT_PERMISSIONS = [
    "gestionar_personal",
    "ver_personal",
    "crear_personal",
    "editar_personal",
    "eliminar_personal",
]

# PERMISOS DE REPORTES
REPORT_PERMISSIONS = [
    "ver_reportes_basicos",
    "ver_reportes_avanzados",
    "exportar_reportes",
]

# PERMISOS DE DASHBOARD
DASHBOARD_PERMISSIONS = [
    "ver_dashboard_admin",
    "ver_estadisticas",
]

# PERMISOS DE CLIENTE
CLIENT_PERMISSIONS = [
    "solicitar_viaje",
    "ver_historial_viajes",
    "cancelar_viaje",
    "calificar_viaje",
]

# PERMISOS DE BITÁCORA
AUDIT_PERMISSIONS = [
    "ver_bitacora",
    "exportar_bitacora",
]

# TODOS LOS PERMISOS
ALL_PERMISSIONS = (
    AUTH_PERMISSIONS +
    USER_MANAGEMENT_PERMISSIONS +
    ROLE_MANAGEMENT_PERMISSIONS +
    DRIVER_MANAGEMENT_PERMISSIONS +
    STAFF_MANAGEMENT_PERMISSIONS +
    REPORT_PERMISSIONS +
    DASHBOARD_PERMISSIONS +
    CLIENT_PERMISSIONS +
    AUDIT_PERMISSIONS
)

# ========================================
# GRUPOS DE PERMISOS PREDEFINIDOS
# ========================================

PERMISSION_GROUPS = {
    "AUTENTICACION": AUTH_PERMISSIONS,
    "GESTION_USUARIOS": USER_MANAGEMENT_PERMISSIONS,
    "GESTION_ROLES": ROLE_MANAGEMENT_PERMISSIONS,
    "GESTION_CONDUCTORES": DRIVER_MANAGEMENT_PERMISSIONS,
    "GESTION_PERSONAL": STAFF_MANAGEMENT_PERMISSIONS,
    "REPORTES": REPORT_PERMISSIONS,
    "DASHBOARD": DASHBOARD_PERMISSIONS,
    "CLIENTE": CLIENT_PERMISSIONS,
    "AUDITORIA": AUDIT_PERMISSIONS,
}

# ========================================
# ROLES PREDEFINIDOS
# ========================================

ROLES_CONFIG = {
    "Administrador": {
        "descripcion": "Acceso completo al sistema",
        "es_administrativo": True,
        "permisos": ALL_PERMISSIONS,
        "is_staff": True,
        "is_superuser": False,
    },
    "Supervisor": {
        "descripcion": "Supervisión y gestión operativa",
        "es_administrativo": True,
        "permisos": (
            AUTH_PERMISSIONS +
            USER_MANAGEMENT_PERMISSIONS +
            DRIVER_MANAGEMENT_PERMISSIONS +
            STAFF_MANAGEMENT_PERMISSIONS +
            REPORT_PERMISSIONS +
            DASHBOARD_PERMISSIONS +
            AUDIT_PERMISSIONS
        ),
        "is_staff": True,
        "is_superuser": False,
    },
    "Conductor": {
        "descripcion": "Gestión de viajes y vehículos",
        "es_administrativo": True,
        "permisos": (
            AUTH_PERMISSIONS +
            ["ver_conductores", "editar_conductores"] +
            ["ver_reportes_basicos", "ver_dashboard_admin"]
        ),
        "is_staff": True,
        "is_superuser": False,
    },
    "Cliente": {
        "descripcion": "Cliente regular del sistema",
        "es_administrativo": False,
        "permisos": (
            AUTH_PERMISSIONS +
            CLIENT_PERMISSIONS
        ),
        "is_staff": False,
        "is_superuser": False,
    },
    "Operador": {
        "descripcion": "Asignación y gestión de viajes",
        "es_administrativo": True,
        "permisos": (
            AUTH_PERMISSIONS +
            ["ver_conductores", "ver_personal"] +
            ["ver_reportes_basicos", "ver_dashboard_admin"]
        ),
        "is_staff": True,
        "is_superuser": False,
    },
}

# ========================================
# CONFIGURACIONES DEL SISTEMA
# ========================================

# CONFIGURACIÓN DE VERIFICACIÓN
VERIFICATION_CONFIG = {
    "CODIGO_LENGTH": 6,
    "CODIGO_EXPIRY_MINUTES": 10,
    "MAX_ATTEMPTS": 3,
    "RESEND_COOLDOWN_MINUTES": 1,
}

# CONFIGURACIÓN DE GOOGLE OAUTH
GOOGLE_OAUTH_CONFIG = {
    "CLIENT_ID": "your-google-client-id",
    "CLIENT_SECRET": "your-google-client-secret",
    "REDIRECT_URI": "http://localhost:3000/auth/google/callback",
}

# CONFIGURACIÓN DE JWT
JWT_CONFIG = {
    "ACCESS_TOKEN_LIFETIME_MINUTES": 60,
    "REFRESH_TOKEN_LIFETIME_DAYS": 7,
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# CONFIGURACIÓN DE PAGINACIÓN
PAGINATION_CONFIG = {
    "PAGE_SIZE": 20,
    "MAX_PAGE_SIZE": 100,
}

# CONFIGURACIÓN DE BÚSQUEDA
SEARCH_CONFIG = {
    "MIN_QUERY_LENGTH": 2,
    "MAX_RESULTS": 50,
    "SEARCH_FIELDS": ["username", "first_name", "last_name", "email"],
}

# ========================================
# MENSAJES DEL SISTEMA
# ========================================

MESSAGES = {
    "USER_CREATED": "Usuario creado exitosamente",
    "USER_UPDATED": "Usuario actualizado exitosamente",
    "USER_DELETED": "Usuario eliminado exitosamente",
    "USER_ACTIVATED": "Usuario activado exitosamente",
    "USER_DEACTIVATED": "Usuario desactivado exitosamente",
    "PASSWORD_CHANGED": "Contraseña cambiada exitosamente",
    "PROFILE_UPDATED": "Perfil actualizado exitosamente",
    "ROLE_CREATED": "Rol creado exitosamente",
    "ROLE_UPDATED": "Rol actualizado exitosamente",
    "ROLE_DELETED": "Rol eliminado exitosamente",
    "VERIFICATION_SENT": "Código de verificación enviado",
    "VERIFICATION_SUCCESS": "Código verificado exitosamente",
    "LOGIN_SUCCESS": "Inicio de sesión exitoso",
    "LOGOUT_SUCCESS": "Cierre de sesión exitoso",
    "PERMISSION_DENIED": "No tienes permisos para esta acción",
    "USER_NOT_FOUND": "Usuario no encontrado",
    "ROLE_NOT_FOUND": "Rol no encontrado",
    "INVALID_CREDENTIALS": "Credenciales inválidas",
    "USER_INACTIVE": "Usuario inactivo",
    "TOKEN_INVALID": "Token inválido",
    "TOKEN_EXPIRED": "Token expirado",
}

# ========================================
# CÓDIGOS DE ERROR
# ========================================

ERROR_CODES = {
    "USER_NOT_FOUND": "USER_001",
    "ROLE_NOT_FOUND": "ROLE_001",
    "PERMISSION_DENIED": "PERM_001",
    "INVALID_CREDENTIALS": "AUTH_001",
    "USER_INACTIVE": "AUTH_002",
    "TOKEN_INVALID": "AUTH_003",
    "TOKEN_EXPIRED": "AUTH_004",
    "VALIDATION_ERROR": "VAL_001",
    "DUPLICATE_EMAIL": "VAL_002",
    "DUPLICATE_USERNAME": "VAL_003",
    "DUPLICATE_CI": "VAL_004",
    "INVALID_ROLE": "VAL_005",
    "VERIFICATION_FAILED": "VER_001",
    "VERIFICATION_EXPIRED": "VER_002",
    "MAX_ATTEMPTS_EXCEEDED": "VER_003",
}