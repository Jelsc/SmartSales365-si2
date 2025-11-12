from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.core.files.base import ContentFile

from .serializers import GenerarReporteSerializer, ReporteGeneradoSerializer
from .models import ReporteGenerado
from .services import ParserService, QueryBuilder, GeneradorArchivos


class GenerarReporteView(APIView):
    """
    API endpoint para generar reportes dinámicos mediante comandos de voz/texto.
    
    POST /api/reportes/generar/
    Body: {
        "prompt": "Quiero un reporte de ventas del mes de septiembre, agrupado por producto, en PDF",
        "modo": "voz"  // o "texto"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Genera un reporte basado en el prompt del usuario"""
        serializer = GenerarReporteSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Datos inválidos', 'detalles': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = serializer.validated_data['prompt']
        modo = serializer.validated_data.get('modo', 'texto')
        
        try:
            # FASE 1: Parsear el prompt
            parser = ParserService()
            parametros = parser.parsear(prompt)
            
            # FASE 2: Construir query
            query_builder = QueryBuilder()
            tipo = parametros['tipo']
            
            if tipo == 'ventas':
                datos = query_builder.construir_query_ventas(parametros)
            elif tipo == 'productos':
                datos = query_builder.construir_query_productos(parametros)
            elif tipo == 'clientes':
                datos = query_builder.construir_query_clientes(parametros)
            elif tipo == 'ingresos':
                datos_dict = query_builder.construir_query_ingresos(parametros)
                datos = [datos_dict]  # Convertir a lista
            else:
                return Response(
                    {'error': f'Tipo de reporte no soportado: {tipo}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # FASE 3: Generar archivo
            formato = parametros['formato']
            generador = GeneradorArchivos()
            
            # Determinar columnas
            columnas = generador.determinar_columnas(
                tipo,
                parametros['agrupacion']
            )
            
            # Crear título y subtítulo
            titulo = f"Reporte de {tipo.capitalize()}"
            periodo_desc = parametros['periodo'].get('descripcion', 'Período no especificado')
            agrupacion_texto = parametros['agrupacion']
            if agrupacion_texto != 'ninguno':
                subtitulo = f"{periodo_desc} - Agrupado por {agrupacion_texto}"
            else:
                subtitulo = periodo_desc
            
            # Generar archivo según formato
            if formato == 'pdf':
                archivo_buffer = generador.generar_pdf(datos, titulo, subtitulo, columnas)
                content_type = 'application/pdf'
                extension = 'pdf'
            elif formato == 'excel':
                archivo_buffer = generador.generar_excel(datos, titulo, subtitulo, columnas)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                extension = 'xlsx'
            elif formato == 'json':
                # Para JSON, devolver directamente
                reporte = ReporteGenerado.objects.create(
                    usuario=request.user,
                    prompt_original=prompt,
                    tipo=tipo,
                    periodo_inicio=parametros['periodo'].get('inicio'),
                    periodo_fin=parametros['periodo'].get('fin'),
                    agrupacion=parametros['agrupacion'],
                    formato='json',
                    datos_json=datos
                )
                
                return Response({
                    'mensaje': 'Reporte generado exitosamente',
                    'reporte_id': reporte.id,
                    'datos': datos,
                    'parametros': {
                        'tipo': tipo,
                        'periodo': periodo_desc,
                        'agrupacion': parametros['agrupacion'],
                        'formato': 'json'
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': f'Formato no soportado: {formato}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Guardar archivo en el modelo
            nombre_archivo = f"reporte_{tipo}_{request.user.id}_{parametros['periodo'].get('inicio', 'sin_fecha')}.{extension}"
            
            reporte = ReporteGenerado.objects.create(
                usuario=request.user,
                prompt_original=prompt,
                tipo=tipo,
                periodo_inicio=parametros['periodo'].get('inicio'),
                periodo_fin=parametros['periodo'].get('fin'),
                agrupacion=parametros['agrupacion'],
                formato=formato,
                datos_json=datos
            )
            
            # Guardar archivo
            reporte.archivo.save(
                nombre_archivo,
                ContentFile(archivo_buffer.getvalue())
            )
            
            # Devolver archivo como respuesta
            archivo_buffer.seek(0)
            response = FileResponse(
                archivo_buffer,
                content_type=content_type,
                as_attachment=True,
                filename=nombre_archivo
            )
            
            # Agregar header con ID del reporte
            response['X-Reporte-ID'] = str(reporte.id)
            
            return response
            
        except Exception as e:
            return Response(
                {
                    'error': 'Error al generar reporte',
                    'detalle': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HistorialReportesView(APIView):
    """
    API endpoint para ver historial de reportes generados.
    
    GET /api/reportes/historial/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve el historial de reportes del usuario"""
        reportes = ReporteGenerado.objects.filter(
            usuario=request.user
        ).order_by('-created_at')[:50]  # Últimos 50 reportes
        
        serializer = ReporteGeneradoSerializer(reportes, many=True)
        
        return Response({
            'reportes': serializer.data,
            'total': reportes.count()
        }, status=status.HTTP_200_OK)
