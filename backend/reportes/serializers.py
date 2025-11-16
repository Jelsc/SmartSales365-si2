from rest_framework import serializers
from .models import ReporteGenerado


class GenerarReporteSerializer(serializers.Serializer):
    """Serializer para la solicitud de generación de reporte"""
    prompt = serializers.CharField(
        required=True,
        max_length=500,
        help_text='Comando en español para generar el reporte'
    )
    modo = serializers.ChoiceField(
        choices=[('voz', 'Voz'), ('texto', 'Texto')],
        default='texto',
        help_text='Modo de ingreso del prompt'
    )


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    """Serializer para el historial de reportes"""
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    formato_display = serializers.CharField(
        source='get_formato_display',
        read_only=True
    )
    agrupacion_display = serializers.CharField(
        source='get_agrupacion_display',
        read_only=True
    )
    
    class Meta:
        model = ReporteGenerado
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'prompt_original',
            'tipo',
            'tipo_display',
            'periodo_inicio',
            'periodo_fin',
            'agrupacion',
            'agrupacion_display',
            'formato',
            'formato_display',
            'archivo',
            'datos_json',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'usuario']
