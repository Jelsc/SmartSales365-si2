"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Endpoints principales del sistema
urlpatterns = [
    # Panel de administración de Django
    path("admin/", admin.site.urls),
    
    # ENDPOINTS DE API (todos bajo /api/)
    
    # Sistema de usuarios unificado
    path("api/", include("users.urls")),
    
    # Conductores: gestión de conductores
    path("api/conductores/", include("conductores.urls")),
    
    # Personal: gestión de personal de empresa
    path("api/personal/", include("personal.urls")),
    
    # Productos: catálogo de productos e inventario
    path("api/", include("productos.urls")),
    
    # Carrito: gestión del carrito de compras
    path("api/carrito/", include("carrito.urls")),
    
    # Ventas: gestión de pedidos y órdenes
    path("api/ventas/pedidos/", include("ventas.urls")),
    
    # Pagos: procesamiento de pagos con Stripe
    path("api/pagos/", include("pagos.urls")),
    
    # Analytics: dashboard inteligente con ML
    path("api/analytics/", include("analytics.urls")),

    # Notificaciones push
    path("api/notifications/", include("notifications.urls")),
    
    # Reportes: generación dinámica de reportes
    path("api/reportes/", include("reportes.urls")),
    
    # Notificaciones: push notifications con Firebase
    path("api/notifications/", include("notifications.urls")),
    
    path("api/bitacora/", include("bitacora.urls")),

    # Auth social: endpoints para login social (navegador)
    path("accounts/", include("allauth.urls")),
    
    
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
