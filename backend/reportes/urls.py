from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
    path('generar/', views.generar_reporte, name='generar_reporte'),
    path('interpretar/', views.interpretar_comando, name='interpretar_comando'),
]
