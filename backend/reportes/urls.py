from django.urls import path
from .views import GenerarReporteView, HistorialReportesView

app_name = 'reportes'

urlpatterns = [
    path('generar/', GenerarReporteView.as_view(), name='generar_reporte'),
    path('historial/', HistorialReportesView.as_view(), name='historial_reportes'),
]
