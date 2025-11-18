from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
import json
import logging
from bitacora.utils import registrar_bitacora

logger = logging.getLogger(__name__)

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
        logger.info(f"[PAGO] Solicitud crear_payment_intent de usuario: {request.user.username}")
        logger.info(f"[PAGO] Request data: {request.data}")
        
        serializer = CrearPaymentIntentSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            logger.error(f"[PAGO] Validación fallida: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        pedido_id = serializer.validated_data['pedido_id']
        logger.info(f"[PAGO] Buscando pedido ID: {pedido_id}")
        
        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            logger.error(f"[PAGO] Pedido {pedido_id} no encontrado")
            return Response(
                {'error': 'Pedido no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        logger.info(f"[PAGO] Pedido encontrado: {pedido.numero_pedido}, usuario: {pedido.usuario.username}, estado: {pedido.estado}")
        
        # Validar que el pedido pertenezca al usuario autenticado
        if pedido.usuario != request.user:
            logger.error(f"[PAGO] Usuario {request.user.username} no es dueño del pedido {pedido_id}")
            return Response(
                {'error': 'No tienes permiso para acceder a este pedido'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar que el pedido esté en estado PENDIENTE
        if pedido.estado != 'PENDIENTE':
            logger.error(f"[PAGO] Pedido {pedido_id} no está PENDIENTE (estado: {pedido.estado})")
            return Response(
                {'error': f'El pedido no está en estado PENDIENTE (estado actual: {pedido.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el pedido tenga items
        items_count = pedido.items.count()
        logger.info(f"[PAGO] Pedido tiene {items_count} items")
        if items_count == 0:
            logger.error(f"[PAGO] Pedido {pedido_id} no tiene items")
            return Response(
                {'error': 'El pedido no tiene items'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear método de pago Stripe
        logger.info(f"[PAGO] Obteniendo/creando método de pago Stripe")
        metodo_pago, _ = MetodoPago.objects.get_or_create(
            tipo='STRIPE',
            defaults={
                'nombre': 'Tarjeta de Crédito/Débito',
                'activo': True,
            }
        )
        
        # Crear Payment Intent en Stripe
        logger.info(f"[PAGO] Llamando a StripeService.crear_payment_intent para pedido {pedido_id}")
        resultado = StripeService.crear_payment_intent(pedido)
        logger.info(f"[PAGO] Resultado de Stripe: {resultado.get('success')}")
        
        if not resultado.get('success'):
            logger.error(f"[PAGO] Error de Stripe: {resultado.get('error')}")
            return Response(
                {'error': resultado.get('error', 'Error al crear el pago')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear registro de transacción
        logger.info(f"[PAGO] Creando TransaccionPago para pedido {pedido_id}")
        transaccion = TransaccionPago.objects.create(
            pedido=pedido,
            metodo_pago=metodo_pago,
            monto=pedido.total,
            moneda='USD',
            id_externo=resultado['payment_intent_id'],
            estado='PROCESANDO',
            metadata=resultado
        )
        
        logger.info(f"[PAGO] ✅ Payment intent creado exitosamente - Transacción ID: {transaccion.id}")
        
        # Registrar en bitácora
        registrar_bitacora(
            request=request,
            accion='CREAR',
            descripcion=f"Payment Intent creado para pedido {pedido.numero_pedido} - Monto: ${pedido.total}",
            modulo='PAGOS'
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
        
        logger.info(f"[PAGO] Confirmando pago - Payment Intent: {payment_intent_id}")
        
        # MODO DESARROLLO: Permitir simulación de pago
        is_simulated = payment_intent_id.startswith('simulated_')
        
        if is_simulated:
            logger.warning(f"[PAGO] ⚠️ Pago SIMULADO detectado: {payment_intent_id}")
            # Extraer el pedido_id del payment_intent_id simulado
            try:
                pedido_id = int(payment_intent_id.replace('simulated_', ''))
                pedido = Pedido.objects.get(id=pedido_id)
                
                # Buscar o crear transacción para este pedido
                transaccion = TransaccionPago.objects.filter(pedido=pedido).first()
                
                if not transaccion:
                    # Crear transacción simulada
                    metodo_pago, _ = MetodoPago.objects.get_or_create(
                        tipo='STRIPE',
                        defaults={'nombre': 'Tarjeta de Crédito/Débito', 'activo': True}
                    )
                    transaccion = TransaccionPago.objects.create(
                        pedido=pedido,
                        metodo_pago=metodo_pago,
                        monto=pedido.total,
                        moneda='USD',
                        id_externo=payment_intent_id,
                        estado='PROCESANDO',
                    )
                
                # Marcar como exitoso (simulado)
                transaccion.marcar_como_exitoso()
                logger.info(f"[PAGO] ✅ Pago simulado exitoso para pedido {pedido_id}")
                
                # Registrar en bitácora
                registrar_bitacora(
                    request=request,
                    accion='CONFIRMAR PAGO',
                    descripcion=f"Pago SIMULADO confirmado - Pedido {pedido.numero_pedido} - Monto: ${transaccion.monto}",
                    modulo='PAGOS'
                )
                
                # Vaciar el carrito
                try:
                    from carrito.models import Carrito
                    carrito = Carrito.objects.get(usuario=request.user)
                    carrito.limpiar()
                    logger.info(f"[PAGO] Carrito vaciado para usuario {request.user.username}")
                except Carrito.DoesNotExist:
                    pass
                
                transaccion_serializer = TransaccionPagoSerializer(transaccion)
                
                return Response({
                    'success': True,
                    'message': '🧪 Pago SIMULADO confirmado exitosamente (modo desarrollo)',
                    'status': 'succeeded',
                    'transaccion': transaccion_serializer.data,
                })
            except Exception as e:
                logger.error(f"[PAGO] Error en pago simulado: {str(e)}")
                return Response(
                    {'error': f'Error en pago simulado: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
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
            
            # Registrar en bitácora
            registrar_bitacora(
                request=request,
                accion='CONFIRMAR PAGO',
                descripcion=f"Pago confirmado - Pedido {transaccion.pedido.numero_pedido} - Monto: ${transaccion.monto}",
                modulo='PAGOS'
            )
            
            # Enviar notificación de pago exitoso
            try:
                from notifications.utils import notificar_pago_exitoso
                notificar_pago_exitoso(transaccion)
            except Exception as e:
                print(f'⚠️ Error enviando notificación de pago exitoso: {e}')
            
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
            error_msg = f"Estado: {resultado['status']}"
            transaccion.marcar_como_fallido(error_msg)
            
            # Enviar notificación de pago fallido
            try:
                from notifications.utils import notificar_pago_fallido
                notificar_pago_fallido(transaccion, error_msg)
            except Exception as e:
                print(f'⚠️ Error enviando notificación de pago fallido: {e}')
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
            
            # Enviar notificación de pago exitoso (desde webhook)
            try:
                from notifications.utils import notificar_pago_exitoso
                notificar_pago_exitoso(transaccion)
            except Exception as e:
                print(f'⚠️ Error enviando notificación de pago exitoso (webhook): {e}')
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
            
            # Enviar notificación de pago fallido (desde webhook)
            try:
                from notifications.utils import notificar_pago_fallido
                notificar_pago_fallido(transaccion, error_message)
            except Exception as e:
                print(f'⚠️ Error enviando notificación de pago fallido (webhook): {e}')
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
