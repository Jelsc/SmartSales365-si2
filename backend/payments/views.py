"""
Vistas para el sistema de pagos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal
import logging

from .models import MetodoPago, Pago, Transaccion, Reembolso, WebhookLog
from .serializers import (
    MetodoPagoSerializer,
    PagoSerializer,
    PagoCreateSerializer,
    TransaccionSerializer,
    ReembolsoSerializer,
    ReembolsoCreateSerializer,
    WebhookLogSerializer
)
from .services import StripeService

logger = logging.getLogger(__name__)


class MetodoPagoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para métodos de pago
    Solo lectura - se configuran desde el admin
    """
    queryset = MetodoPago.objects.filter(activo=True)
    serializer_class = MetodoPagoSerializer
    permission_classes = [IsAuthenticated]


class PagoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de pagos"""
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar pagos por usuario (usuarios normales solo ven sus pagos)"""
        if self.request.user.is_staff:
            return Pago.objects.all()
        return Pago.objects.filter(usuario=self.request.user)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def checkout(self, request):
        """
        Crear un nuevo pago y procesarlo con Stripe
        
        POST /api/payments/pagos/checkout/
        {
            "metodo_pago_id": "uuid",
            "monto": 100.00,
            "moneda": "BOB",
            "descripcion": "Compra de productos",
            "cliente_nombre": "Juan Pérez",
            "cliente_email": "juan@example.com",
            "cliente_telefono": "+591 12345678",
            "metadata": {}
        }
        """
        serializer = PagoCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        
        try:
            # Obtener método de pago
            metodo_pago = MetodoPago.objects.get(
                id=data['metodo_pago_id'],
                activo=True
            )
            
            # Crear registro de pago
            pago = Pago.objects.create(
                usuario=request.user,
                metodo_pago=metodo_pago,
                monto=data['monto'],
                moneda=data.get('moneda', 'BOB'),
                descripcion=data['descripcion'],
                cliente_nombre=data['cliente_nombre'],
                cliente_email=data['cliente_email'],
                cliente_telefono=data.get('cliente_telefono', ''),
                direccion_facturacion=data.get('direccion_facturacion', {}),
                metadata=data.get('metadata', {})
            )
            
            # Procesar según proveedor
            if metodo_pago.proveedor == 'stripe':
                result = self._procesar_stripe(pago, data)
            else:
                return Response(
                    {'error': f'Proveedor {metodo_pago.proveedor} no soportado aún'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if result['success']:
                # Registrar transacción
                Transaccion.objects.create(
                    pago=pago,
                    tipo='pago',
                    estado='pendiente',
                    monto=pago.monto,
                    moneda=pago.moneda,
                    metodo_pago=metodo_pago.nombre,
                    proveedor_id=result.get('payment_intent_id'),
                    response_data=result
                )
                
                return Response({
                    'success': True,
                    'pago_id': str(pago.id),
                    'numero_orden': pago.numero_orden,
                    'client_secret': result.get('client_secret'),
                    'payment_intent_id': result.get('payment_intent_id')
                }, status=status.HTTP_201_CREATED)
            else:
                # Marcar pago como fallido
                pago.marcar_como_fallido(razon=result.get('error', 'Error desconocido'))
                
                return Response(
                    {'error': result.get('error', 'Error al procesar pago')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except MetodoPago.DoesNotExist:
            return Response(
                {'error': 'Método de pago no encontrado o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error en checkout: {str(e)}")
            return Response(
                {'error': 'Error interno al procesar pago'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _procesar_stripe(self, pago: Pago, data: dict) -> dict:
        """Procesar pago con Stripe"""
        metadata = {
            'pago_id': str(pago.id),
            'numero_orden': pago.numero_orden,
            'usuario_id': str(pago.usuario.id),
            **(data.get('metadata', {}))
        }
        
        # Convertir moneda a formato Stripe
        moneda_stripe = pago.moneda.lower()
        
        result = StripeService.create_payment_intent(
            monto=pago.monto,
            moneda=moneda_stripe,
            descripcion=pago.descripcion,
            metadata=metadata
        )
        
        if result['success']:
            # Guardar Payment Intent ID
            pago.stripe_payment_intent_id = result['payment_intent_id']
            pago.save()
        
        return result
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancelar un pago pendiente
        
        POST /api/payments/pagos/{id}/cancelar/
        {
            "razon": "Cliente solicitó cancelación"
        }
        """
        pago = self.get_object()
        
        if pago.estado not in ['pendiente', 'procesando']:
            return Response(
                {'error': 'Solo se pueden cancelar pagos pendientes o en procesamiento'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        razon = request.data.get('razon', 'Cancelado por usuario')
        
        try:
            # Cancelar en la pasarela si tiene ID externo
            if pago.stripe_payment_intent_id:
                result = StripeService.cancel_payment_intent(
                    pago.stripe_payment_intent_id
                )
                if not result['success']:
                    return Response(
                        {'error': result.get('error')},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Cancelar en base de datos
            pago.cancelar(razon=razon)
            
            # Registrar transacción
            Transaccion.objects.create(
                pago=pago,
                tipo='cancelacion',
                estado='completado',
                monto=pago.monto,
                moneda=pago.moneda,
                metodo_pago=pago.metodo_pago.nombre,
                response_data={'razon': razon}
            )
            
            return Response({
                'success': True,
                'message': 'Pago cancelado exitosamente'
            })
            
        except Exception as e:
            logger.error(f"Error al cancelar pago: {str(e)}")
            return Response(
                {'error': 'Error al cancelar pago'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReembolsoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de reembolsos"""
    queryset = Reembolso.objects.all()
    serializer_class = ReembolsoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar reembolsos por usuario"""
        if self.request.user.is_staff:
            return Reembolso.objects.all()
        return Reembolso.objects.filter(usuario=self.request.user)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def solicitar(self, request):
        """
        Solicitar un reembolso
        
        POST /api/payments/reembolsos/solicitar/
        {
            "pago_id": "uuid",
            "monto": 50.00,  // Opcional, si se omite es reembolso total
            "razon": "Producto defectuoso"
        }
        """
        serializer = ReembolsoCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        
        try:
            # Obtener pago
            pago = Pago.objects.get(id=data['pago_id'])
            
            # Validar que el pago esté completado
            if pago.estado != 'completado':
                return Response(
                    {'error': 'Solo se pueden reembolsar pagos completados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que el usuario sea el dueño o admin
            if pago.usuario != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'No tienes permiso para reembolsar este pago'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Monto de reembolso (total si no se especifica)
            monto_reembolso = data.get('monto', pago.monto)
            
            # Validar monto
            if monto_reembolso > pago.monto:
                return Response(
                    {'error': 'El monto de reembolso no puede ser mayor al monto del pago'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear registro de reembolso
            reembolso = Reembolso.objects.create(
                pago=pago,
                usuario=request.user,
                monto=monto_reembolso,
                razon=data['razon']
            )
            
            # Procesar reembolso según proveedor
            if pago.metodo_pago.proveedor == 'stripe':
                result = StripeService.create_refund(
                    payment_intent_id=pago.stripe_payment_intent_id,
                    monto=monto_reembolso if monto_reembolso < pago.monto else None
                )
                
                if result['success']:
                    reembolso.estado = 'completado'
                    reembolso.external_id = result['refund_id']
                    reembolso.procesar()
                    
                    # Actualizar estado del pago
                    pago.estado = 'reembolsado'
                    pago.save()
                    
                    return Response({
                        'success': True,
                        'reembolso_id': str(reembolso.id),
                        'message': 'Reembolso procesado exitosamente'
                    }, status=status.HTTP_201_CREATED)
                else:
                    reembolso.estado = 'rechazado'
                    reembolso.metadata = {'error': result.get('error')}
                    reembolso.save()
                    
                    return Response(
                        {'error': result.get('error', 'Error al procesar reembolso')},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': f'Proveedor {pago.metodo_pago.proveedor} no soportado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Pago.DoesNotExist:
            return Response(
                {'error': 'Pago no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error al procesar reembolso: {str(e)}")
            return Response(
                {'error': 'Error interno al procesar reembolso'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TransaccionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver transacciones (solo lectura)"""
    queryset = Transaccion.objects.all()
    serializer_class = TransaccionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar transacciones por usuario"""
        if self.request.user.is_staff:
            return Transaccion.objects.all()
        return Transaccion.objects.filter(pago__usuario=self.request.user)
