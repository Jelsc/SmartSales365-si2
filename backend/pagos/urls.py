from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetodoPagoViewSet, PagoViewSet, stripe_webhook

app_name = 'pagos'

router = DefaultRouter()
router.register(r'metodos', MetodoPagoViewSet, basename='metodo-pago')
router.register(r'', PagoViewSet, basename='pago')

urlpatterns = [
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
    path('', include(router.urls)),
]
