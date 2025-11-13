from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .prompt_parser import interpretar_prompt
from .report_generator import ReporteGenerator
from .exporters import PDFExporter, ExcelExporter


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_reporte(request):
    """
    POST /api/reportes/generar/
    
    Body:
    {
        "prompt": "Quiero un reporte de ventas del mes de septiembre, agrupado por producto, en PDF",
        "formato": "pdf"  // opcional, se puede detectar del prompt
    }
    
    Returns:
        - Si formato es 'pantalla': JSON con los datos
        - Si formato es 'pdf' o 'excel': Archivo para descarga
    """
    try:
        prompt = request.data.get('prompt', '')
        formato_forzado = request.data.get('formato')
        
        if not prompt:
            return Response(
                {'error': 'Debe proporcionar un prompt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Interpretar el prompt
        parametros = interpretar_prompt(prompt)
        
        # Forzar formato si se proporcionó
        if formato_forzado:
            parametros['formato'] = formato_forzado
        
        # 2. Generar datos del reporte
        generator = ReporteGenerator()
        datos_reporte = generator.generar_datos(parametros)
        
        # 3. Exportar según el formato
        formato = parametros.get('formato', 'pantalla')
        
        if formato == 'pdf':
            # Generar PDF
            exporter = PDFExporter()
            buffer = exporter.generar(datos_reporte)
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            filename = f"reporte_{parametros['tipo']}_{datos_reporte['titulo'].replace(' ', '_')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        elif formato == 'excel':
            # Generar Excel
            exporter = ExcelExporter()
            buffer = exporter.generar(datos_reporte)
            
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"reporte_{parametros['tipo']}_{datos_reporte['titulo'].replace(' ', '_')}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        else:  # pantalla
            # Retornar JSON con los datos
            return Response({
                'success': True,
                'parametros_interpretados': parametros,
                'reporte': datos_reporte
            })
    
    except Exception as e:
        return Response(
            {
                'error': str(e),
                'tipo': type(e).__name__
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interpretar_comando(request):
    """
    POST /api/reportes/interpretar/
    
    Endpoint auxiliar para solo interpretar el prompt sin generar el reporte.
    Útil para mostrar una vista previa de cómo se interpretó el comando.
    
    Body:
    {
        "prompt": "Quiero un reporte de ventas..."
    }
    
    Returns:
    {
        "parametros": {...},
        "interpretacion": "..."
    }
    """
    try:
        prompt = request.data.get('prompt', '')
        
        if not prompt:
            return Response(
                {'error': 'Debe proporcionar un prompt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parametros = interpretar_prompt(prompt)
        
        # Generar descripción legible de la interpretación
        interpretacion_partes = []
        interpretacion_partes.append(f"Tipo de reporte: {parametros['tipo'].upper()}")
        interpretacion_partes.append(f"Formato de salida: {parametros['formato'].upper()}")
        
        if parametros.get('fecha_inicio') and parametros.get('fecha_fin'):
            interpretacion_partes.append(
                f"Periodo: del {parametros['fecha_inicio'].strftime('%d/%m/%Y')} "
                f"al {parametros['fecha_fin'].strftime('%d/%m/%Y')}"
            )
        
        if parametros.get('agrupacion'):
            interpretacion_partes.append(f"Agrupado por: {', '.join(parametros['agrupacion'])}")
        
        if parametros.get('campos'):
            interpretacion_partes.append(f"Campos solicitados: {', '.join(parametros['campos'])}")
        
        return Response({
            'success': True,
            'parametros': parametros,
            'interpretacion': interpretacion_partes,
            'prompt_original': prompt
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
