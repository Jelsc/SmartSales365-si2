from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
import logging

from .models import (
    Empresa, PeriodoFinanciero, BalanceGeneral,
    EstadoResultados, FlujoEfectivo, ConfiguracionAlerta
)
from .serializers import (
    EmpresaSerializer, PeriodoFinancieroSerializer,
    BalanceGeneralSerializer, EstadoResultadosSerializer,
    FlujoEfectivoSerializer, ConfiguracionAlertaSerializer,
    CargarArchivoSerializer, EscenarioWhatIfSerializer
)
from .services import (
    CalculadoraRatios, AnalizadorPatrimonial,
    CalculadoraEscenarios, EvaluadorAlertas
)
from .file_processor import ProcesadorEstadosFinancieros
from .integracion_ventas import GeneradorEstadosDesdeVentas

logger = logging.getLogger(__name__)


class EmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar empresas"""
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsAuthenticated]


class PeriodoFinancieroViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar periodos financieros"""
    queryset = PeriodoFinanciero.objects.all()
    serializer_class = PeriodoFinancieroSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset.order_by('-año', '-mes', '-trimestre', '-version')

    @action(detail=False, methods=['post'])
    def generar_desde_ventas(self, request):
        """
        Genera un periodo financiero automáticamente desde las ventas
        POST /api/afp/periodos/generar_desde_ventas/
        
        Body:
        {
            "empresa_id": 1,
            "tipo_periodo": "MES",
            "año": 2024,
            "mes": 12
        }
        """
        empresa_id = request.data.get('empresa_id')
        tipo_periodo = request.data.get('tipo_periodo')
        año = request.data.get('año')
        mes = request.data.get('mes')
        trimestre = request.data.get('trimestre')
        
        if not empresa_id or not tipo_periodo or not año:
            return Response(
                {'error': 'Faltan campos requeridos: empresa_id, tipo_periodo, año'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            empresa = get_object_or_404(Empresa, id=empresa_id)
            
            periodo = GeneradorEstadosDesdeVentas.generar_periodo_completo_desde_ventas(
                empresa=empresa,
                tipo_periodo=tipo_periodo,
                año=año,
                mes=mes,
                trimestre=trimestre
            )
            
            periodo.creado_por = request.user
            periodo.save()
            
            serializer = PeriodoFinancieroSerializer(periodo)
            return Response({
                'mensaje': 'Periodo financiero generado exitosamente desde ventas',
                'periodo': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error generando periodo desde ventas: {str(e)}")
            return Response(
                {'error': f'Error al generar periodo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def balance(self, request, pk=None):
        """Obtener balance general del periodo"""
        periodo = self.get_object()
        try:
            balance = periodo.balance_general
            serializer = BalanceGeneralSerializer(balance)
            return Response(serializer.data)
        except BalanceGeneral.DoesNotExist:
            return Response(
                {'error': 'No existe balance general para este periodo'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def estado_resultados(self, request, pk=None):
        """Obtener estado de resultados del periodo"""
        periodo = self.get_object()
        try:
            estado = periodo.estado_resultados
            serializer = EstadoResultadosSerializer(estado)
            return Response(serializer.data)
        except EstadoResultados.DoesNotExist:
            return Response(
                {'error': 'No existe estado de resultados para este periodo'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def flujo_efectivo(self, request, pk=None):
        """Obtener flujo de efectivo del periodo"""
        periodo = self.get_object()
        try:
            flujo = periodo.flujo_efectivo
            serializer = FlujoEfectivoSerializer(flujo)
            return Response(serializer.data)
        except FlujoEfectivo.DoesNotExist:
            return Response(
                {'error': 'No existe flujo de efectivo para este periodo'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def ratios(self, request, pk=None):
        """Calcular todos los ratios financieros del periodo"""
        periodo = self.get_object()
        
        try:
            balance = periodo.balance_general
            estado = periodo.estado_resultados
        except (BalanceGeneral.DoesNotExist, EstadoResultados.DoesNotExist):
            return Response(
                {'error': 'Faltan estados financieros para calcular ratios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar periodo anterior para comparación
        balance_anterior = None
        try:
            periodo_anterior = PeriodoFinanciero.objects.filter(
                empresa=periodo.empresa,
                año__lt=periodo.año
            ).order_by('-año', '-mes', '-trimestre').first()
            
            if periodo_anterior:
                balance_anterior = periodo_anterior.balance_general
        except:
            pass
        
        ratios = CalculadoraRatios.calcular_todos_los_ratios(balance, estado, balance_anterior)
        
        # Convertir Decimal a float para JSON
        ratios_serializados = {}
        for categoria, valores in ratios.items():
            ratios_serializados[categoria] = {
                k: float(v) for k, v in valores.items()
            }
        
        return Response(ratios_serializados)

    @action(detail=True, methods=['get'])
    def analisis_patrimonial(self, request, pk=None):
        """Análisis patrimonial (vertical y horizontal)"""
        periodo = self.get_object()
        
        try:
            balance = periodo.balance_general
        except BalanceGeneral.DoesNotExist:
            return Response(
                {'error': 'No existe balance general para este periodo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Análisis vertical
        analisis_vertical = AnalizadorPatrimonial.analisis_vertical(balance)
        
        # Análisis horizontal (si hay periodo anterior)
        analisis_horizontal = None
        try:
            periodo_anterior = PeriodoFinanciero.objects.filter(
                empresa=periodo.empresa,
                año__lt=periodo.año
            ).order_by('-año', '-mes', '-trimestre').first()
            
            if periodo_anterior:
                balance_anterior = periodo_anterior.balance_general
                analisis_horizontal = AnalizadorPatrimonial.analisis_horizontal(balance, balance_anterior)
        except:
            pass
        
        # Estructura de capital
        estructura_capital = AnalizadorPatrimonial.estructura_capital(balance)
        
        resultado = {
            'vertical': {
                'activo': {k: float(v) for k, v in analisis_vertical['activo'].items()},
                'pasivo_patrimonio': {k: float(v) for k, v in analisis_vertical['pasivo_patrimonio'].items()},
            },
            'horizontal': None,
            'estructura_capital': {k: float(v) for k, v in estructura_capital.items()},
        }
        
        if analisis_horizontal:
            resultado['horizontal'] = {
                'activo': {k: float(v) for k, v in analisis_horizontal['activo'].items()},
                'pasivo_patrimonio': {k: float(v) for k, v in analisis_horizontal['pasivo_patrimonio'].items()},
            }
        
        return Response(resultado)

    @action(detail=True, methods=['post'])
    def escenario_whatif(self, request, pk=None):
        """Calcular escenario what-if"""
        periodo = self.get_object()
        
        serializer = EscenarioWhatIfSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            balance = periodo.balance_general
            estado = periodo.estado_resultados
        except (BalanceGeneral.DoesNotExist, EstadoResultados.DoesNotExist):
            return Response(
                {'error': 'Faltan estados financieros para calcular escenario'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        datos = serializer.validated_data
        escenario = CalculadoraEscenarios.calcular_escenario(
            balance=balance,
            estado=estado,
            variacion_precio=Decimal(str(datos.get('variacion_precio', 0))),
            variacion_costo=Decimal(str(datos.get('variacion_costo', 0))),
            dias_cobro=datos.get('dias_cobro'),
            dias_pago=datos.get('dias_pago'),
            dias_inventario=datos.get('dias_inventario'),
        )
        
        # Convertir Decimal a float
        resultado = {}
        for key, value in escenario.items():
            if isinstance(value, dict):
                resultado[key] = {k: float(v) if isinstance(v, Decimal) else v for k, v in value.items()}
            elif isinstance(value, Decimal):
                resultado[key] = float(value)
            else:
                resultado[key] = value
        
        return Response(resultado)

    @action(detail=True, methods=['get'])
    def alertas(self, request, pk=None):
        """Evaluar alertas financieras"""
        periodo = self.get_object()
        
        try:
            balance = periodo.balance_general
            estado = periodo.estado_resultados
        except (BalanceGeneral.DoesNotExist, EstadoResultados.DoesNotExist):
            return Response(
                {'error': 'Faltan estados financieros para evaluar alertas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular ratios
        balance_anterior = None
        try:
            periodo_anterior = PeriodoFinanciero.objects.filter(
                empresa=periodo.empresa,
                año__lt=periodo.año
            ).order_by('-año', '-mes', '-trimestre').first()
            
            if periodo_anterior:
                balance_anterior = periodo_anterior.balance_general
        except:
            pass
        
        ratios = CalculadoraRatios.calcular_todos_los_ratios(balance, estado, balance_anterior)
        alertas = EvaluadorAlertas.evaluar_alertas(ratios)
        
        return Response(alertas)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cargar_archivo_estados(request):
    """
    Cargar archivo CSV/Excel con estados financieros
    POST /api/afp/cargar-archivo/
    """
    serializer = CargarArchivoSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    datos = serializer.validated_data
    archivo = request.FILES['archivo']
    
    try:
        # Procesar archivo
        datos_procesados = ProcesadorEstadosFinancieros.procesar_archivo(archivo)
        
        # Obtener o crear empresa
        empresa = get_object_or_404(Empresa, id=datos['empresa_id'])
        
        # Crear periodo
        with transaction.atomic():
            periodo = PeriodoFinanciero.objects.create(
                empresa=empresa,
                tipo_periodo=datos['tipo_periodo'],
                año=datos['año'],
                mes=datos.get('mes'),
                trimestre=datos.get('trimestre'),
                fecha_cierre=datos['fecha_cierre'],
                version=datos.get('version', 1),
                creado_por=request.user
            )
            
            # Crear Balance General
            if 'balance' in datos_procesados and datos_procesados['balance']:
                BalanceGeneral.objects.create(
                    periodo=periodo,
                    **datos_procesados['balance']
                )
            
            # Crear Estado de Resultados
            if 'estado' in datos_procesados and datos_procesados['estado']:
                EstadoResultados.objects.create(
                    periodo=periodo,
                    **datos_procesados['estado']
                )
            
            # Crear Flujo de Efectivo (opcional)
            if 'flujo' in datos_procesados and datos_procesados['flujo']:
                FlujoEfectivo.objects.create(
                    periodo=periodo,
                    **datos_procesados['flujo']
                )
        
        periodo_serializer = PeriodoFinancieroSerializer(periodo)
        return Response({
            'mensaje': 'Estados financieros cargados exitosamente',
            'periodo': periodo_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error cargando archivo: {str(e)}")
        return Response(
            {'error': f'Error al procesar archivo: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def informe_ejecutivo(request, periodo_id):
    """
    Generar informe ejecutivo con insights automáticos
    GET /api/afp/informe-ejecutivo/{periodo_id}/
    """
    periodo = get_object_or_404(PeriodoFinanciero, id=periodo_id)
    
    try:
        balance = periodo.balance_general
        estado = periodo.estado_resultados
    except (BalanceGeneral.DoesNotExist, EstadoResultados.DoesNotExist):
        return Response(
            {'error': 'Faltan estados financieros para generar informe'},
            status=status.HTTP_400_BAD_REQUEST
            )
    
    # Calcular ratios
    balance_anterior = None
    try:
        periodo_anterior = PeriodoFinanciero.objects.filter(
            empresa=periodo.empresa,
            año__lt=periodo.año
        ).order_by('-año', '-mes', '-trimestre').first()
        
        if periodo_anterior:
            balance_anterior = periodo_anterior.balance_general
    except:
        pass
    
    ratios = CalculadoraRatios.calcular_todos_los_ratios(balance, estado, balance_anterior)
    alertas = EvaluadorAlertas.evaluar_alertas(ratios)
    
    # Generar insights automáticos
    insights = []
    
    # Insight 1: Liquidez
    liquidez_corriente = ratios['liquidez']['liquidez_corriente']
    if liquidez_corriente < 1:
        insights.append("⚠️ La liquidez corriente es menor a 1, lo que indica posibles problemas de solvencia a corto plazo.")
    elif liquidez_corriente > 2:
        insights.append("✅ La liquidez corriente es saludable, indicando buena capacidad de pago a corto plazo.")
    else:
        insights.append("ℹ️ La liquidez corriente está en rango aceptable.")
    
    # Insight 2: Rentabilidad
    roa = ratios['rentabilidad']['roa']
    if roa > 0.1:
        insights.append(f"✅ Excelente rentabilidad sobre activos (ROA: {roa:.2%}), la empresa está generando buenos retornos.")
    elif roa > 0:
        insights.append(f"ℹ️ Rentabilidad sobre activos moderada (ROA: {roa:.2%}).")
    else:
        insights.append("⚠️ La empresa presenta pérdidas, se recomienda revisar la estructura de costos.")
    
    # Insight 3: Endeudamiento
    deuda_activo = ratios['endeudamiento']['deuda_activo']
    if deuda_activo > 0.6:
        insights.append("⚠️ Alto nivel de endeudamiento, la empresa depende significativamente de deuda.")
    elif deuda_activo < 0.3:
        insights.append("✅ Bajo nivel de endeudamiento, la empresa tiene una estructura financiera conservadora.")
    else:
        insights.append("ℹ️ Nivel de endeudamiento moderado.")
    
    return Response({
        'periodo': PeriodoFinancieroSerializer(periodo).data,
        'ratios': {
            categoria: {k: float(v) for k, v in valores.items()}
            for categoria, valores in ratios.items()
        },
        'alertas': alertas,
        'insights': insights,
    })


class ConfiguracionAlertaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar configuraciones de alertas"""
    queryset = ConfiguracionAlerta.objects.all()
    serializer_class = ConfiguracionAlertaSerializer
    permission_classes = [IsAuthenticated]
