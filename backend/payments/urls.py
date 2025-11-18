"""
URLs para el sistema de pagos
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .webhooks import stripe_webhook

router = DefaultRouter()
router.register(r'metodos-pago', views.MetodoPagoViewSet, basename='metodo-pago')
router.register(r'pagos', views.PagoViewSet, basename='pago')
router.register(r'reembolsos', views.ReembolsoViewSet, basename='reembolso')
router.register(r'transacciones', views.TransaccionViewSet, basename='transaccion')

urlpatterns = [
    path('', include(router.urls)),
    # Webhooks
    path('webhooks/stripe/', stripe_webhook.stripe_webhook_handler, name='stripe-webhook'),
]
