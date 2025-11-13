"""
URLs para el módulo de notificaciones
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceTokenViewSet, NotificationViewSet

app_name = 'notifications'

router = DefaultRouter()
router.register(r'tokens', DeviceTokenViewSet, basename='device-token')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
