"""
URLS.PY - RUTAS SIMPLIFICADAS

RESPONSABILIDADES:
- Rutas de autenticación unificada
- Rutas de registro diferenciado
- Rutas de gestión de usuarios
- Rutas de gestión de roles
- Rutas de perfil y configuración

DIFERENCIAS CON SISTEMA ANTERIOR:
- URLs más limpias y organizadas
- Menos duplicación de rutas
- Mejor nomenclatura
- Estructura más lógica
"""

from django.urls import path, include
from . import auth, registration, views

urlpatterns = [
    # ========================================
    # AUTENTICACIÓN UNIFICADA
    # ========================================
    path('auth/login/', auth.UniversalLoginView.as_view(), name='universal_login'),
    path('auth/logout/', auth.universal_logout, name='universal_logout'),
    path('auth/user-info/', auth.user_info, name='user_info'),
    path('auth/dashboard-data/', auth.dashboard_data, name='dashboard_data'),
    
    # ========================================
    # REGISTRO DIFERENCIADO
    # ========================================
    path('register/', registration.ClienteRegisterView.as_view(), name='cliente_register'),
    path('admin/create/', registration.AdminCreateView.as_view(), name='admin_create'),
    path('google/', registration.google_auth, name='google_auth'),
    path('verify/', registration.verify_code, name='verify_code'),
    path('resend-code/', registration.resend_verification_code, name='resend_verification_code'),
    
    # ========================================
    # GESTIÓN DE USUARIOS
    # ========================================
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('users/<int:user_id>/permissions/', views.user_permissions, name='user_permissions'),
    path('users/search/', views.user_search, name='user_search'),
    path('users/stats/', views.user_stats, name='user_stats'),
    
    # ========================================
    # GESTIÓN DE ROLES
    # ========================================
    path('roles/<int:pk>/', views.RolDetailView.as_view(), name='role_detail'),
    
    # ========================================
    # GESTIÓN DE PERMISOS
    # ========================================
    path('permissions/', views.get_all_permissions, name='get_all_permissions'),
    path('permissions/groups/', views.get_permissions_by_group, name='get_permissions_by_group'),
    
    # ========================================
    # PERFIL Y CONFIGURACIÓN
    # ========================================
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # ========================================
    # RUTAS ADICIONALES
    # ========================================
    path('users/', views.UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='user_list'),
    path('users/<int:pk>/', views.UserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='user_detail'),
    path('roles/', views.RolViewSet.as_view(), name='role_list'),
    
    # ========================================
    # RUTAS COMPATIBILIDAD (para frontend)
    # ========================================
    path('admin/users/', views.UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin_user_list'),
    path('admin/users/<int:pk>/', views.UserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin_user_detail'),
    path('admin/roles/', views.RolViewSet.as_view(), name='admin_role_list'),
    path('admin/users/personal_disponible/', views.get_personal_disponible, name='personal_disponible'),
    path('admin/users/conductores_disponibles/', views.get_conductores_disponibles, name='conductores_disponibles'),
]