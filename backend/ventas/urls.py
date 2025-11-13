from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoViewSet

app_name = 'ventas'

router = DefaultRouter()
router.register(r'', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', include(router.urls)),
]
