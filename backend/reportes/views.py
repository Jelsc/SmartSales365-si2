from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .prompt_parser import interpretar_prompt, detectar_multiples_reportes
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
        - Si formato es 'pantalla': JSON con los datos (puede ser múltiple)
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
        
        # DEBUG: Log para ver qué estamos recibiendo
        print(f"\n{'='*60}")
        print(f"🔍 PROMPT RECIBIDO: {prompt}")
        print(f"📄 FORMATO FORZADO: {formato_forzado}")
        
        # 1. Detectar si hay múltiples reportes en el prompt
        prompts_separados = detectar_multiples_reportes(prompt)
        print(f"📊 PROMPTS SEPARADOS: {len(prompts_separados)} reportes detectados")
        for i, p in enumerate(prompts_separados, 1):
            print(f"   Reporte {i}: {p}")
        
        # 2. Generar todos los reportes solicitados
        reportes_generados = []
        for sub_prompt in prompts_separados:
            # Interpretar cada sub-prompt
            parametros = interpretar_prompt(sub_prompt)
            
            # Forzar formato si se proporcionó
            if formato_forzado:
                parametros['formato'] = formato_forzado
            
            # Generar datos del reporte
            generator = ReporteGenerator()
            datos_reporte = generator.generar_datos(parametros)
            reportes_generados.append(datos_reporte)
        
        # 3. Determinar formato final
        if formato_forzado:
            formato = formato_forzado
        else:
            # Usar el formato del primer reporte
            formato = reportes_generados[0]['parametros'].get('formato', 'pantalla')
        
        # 4. Si es pantalla y hay múltiples reportes
        if formato == 'pantalla':
            if len(reportes_generados) > 1:
                return Response({
                    'success': True,
                    'reportes': reportes_generados,
                    'cantidad_reportes': len(reportes_generados)
                })
            else:
                # Un solo reporte
                return Response({
                    'success': True,
                    'parametros_interpretados': reportes_generados[0]['parametros'],
                    'reporte': reportes_generados[0]
                })
        
        # 5. Si es PDF o Excel (uno o múltiples reportes)
        if formato == 'pdf':
            from datetime import datetime
            # Generar PDF con múltiples reportes
            print(f"📄 GENERANDO PDF con {len(reportes_generados)} reporte(s)")
            exporter = PDFExporter()
            if len(reportes_generados) > 1:
                print(f"   ✅ Usando generar_multiple() para {len(reportes_generados)} reportes")
                buffer = exporter.generar_multiple(reportes_generados)
                filename = f"reportes_combinados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            else:
                print(f"   ⚠️ Usando generar() para 1 reporte")
                buffer = exporter.generar(reportes_generados[0])
                titulo = reportes_generados[0].get('titulo', 'reporte').replace(' ', '_')
                filename = f"{titulo}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            print(f"📥 Archivo generado: {filename}")
            print(f"{'='*60}\n")
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        elif formato == 'excel':
            from datetime import datetime
            # Generar Excel con múltiples reportes
            exporter = ExcelExporter()
            if len(reportes_generados) > 1:
                buffer = exporter.generar_multiple(reportes_generados)
                filename = f"reportes_combinados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            else:
                buffer = exporter.generar(reportes_generados[0])
                titulo = reportes_generados[0].get('titulo', 'reporte').replace(' ', '_')
                filename = f"{titulo}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
    
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
