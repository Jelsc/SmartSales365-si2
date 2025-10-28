from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConductorViewSet

router = DefaultRouter()
router.register(r'', ConductorViewSet, basename='conductores')

urlpatterns = [
    path('', include(router.urls)),
]