"""
PERMISSIONS.PY - SISTEMA DE PERMISOS SIMPLIFICADO

RESPONSABILIDADES:
- Permisos básicos para el sistema
- Verificación de acceso administrativo
- Permisos granulares simplificados
- Decoradores de permisos

DIFERENCIAS CON SISTEMA ANTERIOR:
- Permisos reducidos de 67 a 20 esenciales
- Lógica más simple
- Menos decoradores
- Mejor rendimiento
"""

from rest_framework import permissions


class IsAdminPortalUser(permissions.BasePermission):
    """
    Permiso que verifica que el usuario tenga acceso al panel administrativo
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.es_administrativo and request.user.is_staff


class CanManageUsers(permissions.BasePermission):
    """
    Permiso para gestionar usuarios
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.tiene_permiso("gestionar_usuarios")


class CanManageRoles(permissions.BasePermission):
    """
    Permiso para gestionar roles
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.tiene_permiso("gestionar_roles")


class CanManageConductores(permissions.BasePermission):
    """
    Permiso para gestionar conductores
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.tiene_permiso("gestionar_conductores")


class CanManagePersonal(permissions.BasePermission):
    """
    Permiso para gestionar personal
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.tiene_permiso("gestionar_personal")


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso que permite acceso solo al propietario del objeto o a administradores
    """
    def has_object_permission(self, request, view, obj):
        # Administradores pueden acceder a todo
        if request.user.is_staff and request.user.es_administrativo:
            return True
        
        # El propietario puede acceder a su propio objeto
        if hasattr(obj, "user") and obj.user == request.user:
            return True
        
        # Si el objeto es un usuario, verificar si es el mismo usuario
        if hasattr(obj, "id") and obj.id == request.user.id:
            return True
        
        return False


class HasPermission(permissions.BasePermission):
    """
    Permiso que verifica un permiso específico
    """
    def __init__(self, permission_name):
        self.permission_name = permission_name

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.tiene_permiso(self.permission_name)


class HasAnyPermission(permissions.BasePermission):
    """
    Permiso que verifica si el usuario tiene al menos uno de los permisos especificados
    """
    def __init__(self, permission_names):
        self.permission_names = (
            permission_names
            if isinstance(permission_names, list)
            else [permission_names]
        )

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return any(request.user.tiene_permiso(perm) for perm in self.permission_names)


class HasAllPermissions(permissions.BasePermission):
    """
    Permiso que verifica si el usuario tiene todos los permisos especificados
    """
    def __init__(self, permission_names):
        self.permission_names = (
            permission_names
            if isinstance(permission_names, list)
            else [permission_names]
        )

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return all(request.user.tiene_permiso(perm) for perm in self.permission_names)


# Decoradores simplificados
def requiere_permiso(permiso):
    """
    Decorador que verifica si el usuario tiene un permiso específico
    """
    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("Debes iniciar sesión")
            
            if not request.user.tiene_permiso(permiso):
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("No tienes permiso para esta acción")
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def requiere_permisos(permisos):
    """
    Decorador que verifica si el usuario tiene varios permisos
    """
    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("Debes iniciar sesión")
            
            if not request.user.tiene_permisos(permisos):
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("No tienes los permisos necesarios")
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def requiere_rol_administrativo(view_func):
    """
    Decorador que verifica si el usuario tiene un rol administrativo
    """
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Debes iniciar sesión")
        
        if not request.user.es_administrativo:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Necesitas un rol administrativo")
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view