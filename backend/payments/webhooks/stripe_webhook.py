"""
Webhook handler para Stripe
"""
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
import logging

from ..models import Pago, Transaccion, WebhookLog
from ..services import StripeService

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook_handler(request):
    """
    Manejar webhooks de Stripe
    
    Eventos importantes:
    - payment_intent.succeeded: Pago completado exitosamente
    - payment_intent.payment_failed: Pago fallido
    - charge.refunded: Reembolso procesado
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    # Verificar firma del webhook
    result = StripeService.verify_webhook_signature(payload, sig_header)
    
    if not result['success']:
        logger.error(f"Webhook signature verification failed: {result.get('error')}")
        return HttpResponse(status=400)
    
    event = result['event']
    
    # Registrar webhook
    webhook_log = WebhookLog.objects.create(
        proveedor='stripe',
        evento=event['type'],
        payload=event
    )
    
    try:
        # Procesar según tipo de evento
        if event['type'] == 'payment_intent.succeeded':
            _handle_payment_succeeded(event)
        elif event['type'] == 'payment_intent.payment_failed':
            _handle_payment_failed(event)
        elif event['type'] == 'charge.refunded':
            _handle_charge_refunded(event)
        else:
            logger.info(f"Evento no manejado: {event['type']}")
        
        # Marcar webhook como procesado
        webhook_log.procesado = True
        webhook_log.save()
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        webhook_log.error_message = str(e)
        webhook_log.save()
        return HttpResponse(status=500)


def _handle_payment_succeeded(event):
    """Manejar pago exitoso"""
    payment_intent = event['data']['object']
    payment_intent_id = payment_intent['id']
    
    try:
        # Buscar pago por Payment Intent ID
        pago = Pago.objects.get(stripe_payment_intent_id=payment_intent_id)
        
        # Marcar como completado
        pago.marcar_como_completado(external_id=payment_intent_id)
        
        # Registrar transacción
        Transaccion.objects.create(
            pago=pago,
            tipo='confirmacion',
            estado='completado',
            monto=pago.monto,
            moneda=pago.moneda,
            metodo_pago=pago.metodo_pago.nombre,
            proveedor_id=payment_intent_id,
            response_data={
                'payment_intent': payment_intent,
                'webhook_event': event['type']
            }
        )
        
        logger.info(f"Pago {pago.numero_orden} completado exitosamente")
        
        # TODO: Enviar notificación push al usuario
        # from notifications.utils import notificar_usuario
        # notificar_usuario(
        #     usuario=pago.usuario,
        #     titulo='Pago completado',
        #     mensaje=f'Tu pago de {pago.monto} {pago.moneda} ha sido procesado exitosamente',
        #     tipo='pago_completado',
        #     datos={'pago_id': str(pago.id), 'numero_orden': pago.numero_orden}
        # )
        
    except Pago.DoesNotExist:
        logger.error(f"Pago no encontrado para Payment Intent: {payment_intent_id}")
        raise


def _handle_payment_failed(event):
    """Manejar pago fallido"""
    payment_intent = event['data']['object']
    payment_intent_id = payment_intent['id']
    
    try:
        pago = Pago.objects.get(stripe_payment_intent_id=payment_intent_id)
        
        # Obtener razón del fallo
        error_message = payment_intent.get('last_payment_error', {}).get('message', 'Error desconocido')
        
        # Marcar como fallido
        pago.marcar_como_fallido(razon=error_message)
        
        # Registrar transacción
        Transaccion.objects.create(
            pago=pago,
            tipo='pago',
            estado='fallido',
            monto=pago.monto,
            moneda=pago.moneda,
            metodo_pago=pago.metodo_pago.nombre,
            proveedor_id=payment_intent_id,
            error_message=error_message,
            response_data={
                'payment_intent': payment_intent,
                'webhook_event': event['type']
            }
        )
        
        logger.warning(f"Pago {pago.numero_orden} falló: {error_message}")
        
        # TODO: Enviar notificación push al usuario
        # from notifications.utils import notificar_usuario
        # notificar_usuario(
        #     usuario=pago.usuario,
        #     titulo='Pago fallido',
        #     mensaje=f'Tu pago no pudo ser procesado: {error_message}',
        #     tipo='pago_fallido',
        #     datos={'pago_id': str(pago.id), 'numero_orden': pago.numero_orden}
        # )
        
    except Pago.DoesNotExist:
        logger.error(f"Pago no encontrado para Payment Intent: {payment_intent_id}")
        raise


def _handle_charge_refunded(event):
    """Manejar reembolso procesado"""
    charge = event['data']['object']
    payment_intent_id = charge.get('payment_intent')
    
    if not payment_intent_id:
        logger.warning("Charge refunded sin Payment Intent ID")
        return
    
    try:
        pago = Pago.objects.get(stripe_payment_intent_id=payment_intent_id)
        
        # Actualizar estado del pago
        pago.estado = 'reembolsado'
        pago.save()
        
        # Registrar transacción
        Transaccion.objects.create(
            pago=pago,
            tipo='reembolso',
            estado='completado',
            monto=charge['amount_refunded'] / 100,  # Convertir de centavos
            moneda=charge['currency'].upper(),
            metodo_pago=pago.metodo_pago.nombre,
            proveedor_id=charge['id'],
            response_data={
                'charge': charge,
                'webhook_event': event['type']
            }
        )
        
        logger.info(f"Reembolso procesado para pago {pago.numero_orden}")
        
        # TODO: Enviar notificación push al usuario
        # from notifications.utils import notificar_usuario
        # notificar_usuario(
        #     usuario=pago.usuario,
        #     titulo='Reembolso procesado',
        #     mensaje=f'Tu reembolso de {charge["amount_refunded"]/100} {charge["currency"].upper()} ha sido procesado',
        #     tipo='reembolso_completado',
        #     datos={'pago_id': str(pago.id), 'numero_orden': pago.numero_orden}
        # )
        
    except Pago.DoesNotExist:
        logger.error(f"Pago no encontrado para Payment Intent: {payment_intent_id}")
        raise
