from django.urls import path
from . import views
from .views import GenerarReporteView, HistorialReportesView

app_name = 'reportes'

urlpatterns = [
    path('generar/', views.generar_reporte, name='generar_reporte'),
    path('interpretar/', views.interpretar_comando, name='interpretar_comando'),
    path('historial/', HistorialReportesView.as_view(), name='historial_reportes'),
]
