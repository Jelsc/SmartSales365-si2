from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'empresas', views.EmpresaViewSet, basename='empresa')
router.register(r'periodos', views.PeriodoFinancieroViewSet, basename='periodo')
router.register(r'alertas-config', views.ConfiguracionAlertaViewSet, basename='alerta-config')

urlpatterns = [
    path('', include(router.urls)),
    path('cargar-archivo/', views.cargar_archivo_estados, name='cargar_archivo'),
    path('informe-ejecutivo/<int:periodo_id>/', views.informe_ejecutivo, name='informe_ejecutivo'),
]

