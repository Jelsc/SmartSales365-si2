from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
import json

from .models import MetodoPago, TransaccionPago
from .serializers import (
    MetodoPagoSerializer,
    TransaccionPagoSerializer,
    CrearPaymentIntentSerializer,
    ConfirmarPagoSerializer,
)
from .stripe_service import StripeService
from ventas.models import Pedido


class MetodoPagoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar métodos de pago disponibles
    """
    queryset = MetodoPago.objects.filter(activo=True)
    serializer_class = MetodoPagoSerializer
    permission_classes = [AllowAny]


class PagoViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestionar pagos
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TransaccionPagoSerializer
    
    @action(detail=False, methods=['post'])
    def crear_payment_intent(self, request):
        """
        POST /api/pagos/crear_payment_intent/
        
        Crear un Payment Intent de Stripe para un pedido
        
        Body:
        {
            "pedido_id": 1
        }
        """
        serializer = CrearPaymentIntentSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        pedido_id = serializer.validated_data['pedido_id']
        pedido = get_object_or_404(Pedido, id=pedido_id)
        
        # Validar que el pedido pertenezca al usuario autenticado
        if pedido.usuario != request.user:
            return Response(
                {'error': 'No tienes permiso para acceder a este pedido'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar que el pedido esté en estado PENDIENTE
        if pedido.estado != 'PENDIENTE':
            return Response(
                {'error': f'El pedido no está en estado PENDIENTE (estado actual: {pedido.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el pedido tenga items
        if pedido.items.count() == 0:
            return Response(
                {'error': 'El pedido no tiene items'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear método de pago Stripe
        metodo_pago, _ = MetodoPago.objects.get_or_create(
            tipo='STRIPE',
            defaults={
                'nombre': 'Tarjeta de Crédito/Débito',
                'activo': True,
            }
        )
        
        # Crear Payment Intent en Stripe
        resultado = StripeService.crear_payment_intent(pedido)
        
        if not resultado.get('success'):
            return Response(
                {'error': resultado.get('error', 'Error al crear el pago')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear registro de transacción
        transaccion = TransaccionPago.objects.create(
            pedido=pedido,
            metodo_pago=metodo_pago,
            monto=pedido.total,
            moneda='USD',
            id_externo=resultado['payment_intent_id'],
            estado='PROCESANDO',
            metadata=resultado
        )
        
        return Response({
            'success': True,
            'transaccion_id': transaccion.id,
            'client_secret': resultado['client_secret'],
            'payment_intent_id': resultado['payment_intent_id'],
            'amount': resultado['amount'],
            'currency': resultado['currency'],
            'publishable_key': settings.STRIPE_PUBLIC_KEY,
        })
    
    @action(detail=False, methods=['post'])
    def confirmar_pago(self, request):
        """
        POST /api/pagos/confirmar_pago/
        
        Confirmar que un pago fue exitoso
        
        Body:
        {
            "payment_intent_id": "pi_xxxxx"
        }
        """
        serializer = ConfirmarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment_intent_id = serializer.validated_data['payment_intent_id']
        
        # Buscar la transacción
        try:
            transaccion = TransaccionPago.objects.get(
                id_externo=payment_intent_id
            )
        except TransaccionPago.DoesNotExist:
            return Response(
                {'error': 'Transacción no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar el estado en Stripe
        resultado = StripeService.confirmar_pago(payment_intent_id)
        
        if not resultado.get('success'):
            return Response(
                {'error': resultado.get('error', 'Error al verificar el pago')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar la transacción según el estado
        if resultado['status'] == 'succeeded':
            transaccion.marcar_como_exitoso()
            mensaje = 'Pago confirmado exitosamente'
            
            # Vaciar el carrito del usuario después de confirmar el pago exitoso
            try:
                from carrito.models import Carrito
                carrito = Carrito.objects.get(usuario=request.user)
                carrito.limpiar()
            except Carrito.DoesNotExist:
                pass  # El carrito ya no existe o ya está vacío
                
        elif resultado['status'] in ['processing', 'requires_action']:
            transaccion.estado = 'PROCESANDO'
            transaccion.save()
            mensaje = 'Pago en proceso'
        else:
            transaccion.marcar_como_fallido(f"Estado: {resultado['status']}")
            mensaje = 'El pago no pudo ser procesado'
        
        # Serializar la transacción actualizada
        transaccion_serializer = TransaccionPagoSerializer(transaccion)
        
        return Response({
            'success': resultado['status'] == 'succeeded',
            'message': mensaje,
            'status': resultado['status'],
            'transaccion': transaccion_serializer.data,
        })
    
    @action(detail=False, methods=['get'])
    def mis_transacciones(self, request):
        """
        GET /api/pagos/mis_transacciones/
        
        Listar las transacciones del usuario
        """
        transacciones = TransaccionPago.objects.filter(
            pedido__usuario=request.user
        ).select_related('metodo_pago', 'pedido').order_by('-creado')
        
        serializer = TransaccionPagoSerializer(transacciones, many=True)
        return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    POST /api/pagos/webhook/stripe/
    
    Webhook para recibir eventos de Stripe
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    # Verificar la firma del webhook
    event = StripeService.verificar_webhook_signature(payload, sig_header)
    
    if not event:
        return Response(
            {'error': 'Firma inválida'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Manejar el evento
    event_type = event['type']
    
    if event_type == 'payment_intent.succeeded':
        # Pago exitoso
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        try:
            transaccion = TransaccionPago.objects.get(
                id_externo=payment_intent_id
            )
            transaccion.marcar_como_exitoso()
        except TransaccionPago.DoesNotExist:
            pass
    
    elif event_type == 'payment_intent.payment_failed':
        # Pago fallido
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        error_message = payment_intent.get('last_payment_error', {}).get('message', 'Error desconocido')
        
        try:
            transaccion = TransaccionPago.objects.get(
                id_externo=payment_intent_id
            )
            transaccion.marcar_como_fallido(error_message)
        except TransaccionPago.DoesNotExist:
            pass
    
    elif event_type == 'charge.refunded':
        # Reembolso
        charge = event['data']['object']
        payment_intent_id = charge.get('payment_intent')
        
        if payment_intent_id:
            try:
                transaccion = TransaccionPago.objects.get(
                    id_externo=payment_intent_id
                )
                transaccion.reembolsar()
            except TransaccionPago.DoesNotExist:
                pass
    
    return Response({'status': 'success'})
