import stripe
from django.conf import settings
from decimal import Decimal

# Configurar Stripe con la clave secreta
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """
    Servicio para manejar pagos con Stripe
    """
    
    @staticmethod
    def crear_payment_intent(pedido, metadata=None):
        """
        Crear un Payment Intent en Stripe
        
        Args:
            pedido: Instancia del modelo Pedido
            metadata: Diccionario con metadata adicional
            
        Returns:
            dict: Respuesta de Stripe con el Payment Intent
        """
        try:
            # Convertir el monto a centavos (Stripe trabaja en centavos)
            # Si la moneda es BOB, convertir a la menor unidad
            monto_centavos = int(pedido.total * 100)
            
            # Preparar metadata
            intent_metadata = {
                'pedido_id': str(pedido.id),
                'numero_pedido': pedido.numero_pedido,
                'usuario_id': str(pedido.usuario.id),
                'usuario_email': pedido.usuario.email,
            }
            
            if metadata:
                intent_metadata.update(metadata)
            
            # Crear el Payment Intent
            payment_intent = stripe.PaymentIntent.create(
                amount=monto_centavos,
                currency='usd',  # Stripe recomienda USD para Bolivia
                metadata=intent_metadata,
                description=f'Pedido {pedido.numero_pedido}',
                receipt_email=pedido.usuario.email,
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency,
                'status': payment_intent.status,
            }
            
        except stripe.error.CardError as e:
            # Error de la tarjeta
            return {
                'success': False,
                'error': str(e.user_message),
                'error_code': e.code,
            }
        except stripe.error.StripeError as e:
            # Error general de Stripe
            return {
                'success': False,
                'error': str(e),
            }
        except Exception as e:
            # Error inesperado
            return {
                'success': False,
                'error': f'Error inesperado: {str(e)}',
            }
    
    @staticmethod
    def confirmar_pago(payment_intent_id):
        """
        Confirmar el estado de un Payment Intent
        
        Args:
            payment_intent_id: ID del Payment Intent en Stripe
            
        Returns:
            dict: Estado del pago
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'success': True,
                'status': payment_intent.status,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency,
                'payment_method': payment_intent.payment_method,
                'metadata': payment_intent.metadata,
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def crear_reembolso(payment_intent_id, monto=None, razon=None):
        """
        Crear un reembolso para un pago
        
        Args:
            payment_intent_id: ID del Payment Intent
            monto: Monto a reembolsar en centavos (None = reembolso completo)
            razon: Razón del reembolso
            
        Returns:
            dict: Resultado del reembolso
        """
        try:
            refund_params = {
                'payment_intent': payment_intent_id,
            }
            
            if monto:
                refund_params['amount'] = monto
            
            if razon:
                refund_params['reason'] = razon
            
            refund = stripe.Refund.create(**refund_params)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund.amount,
                'status': refund.status,
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def verificar_webhook_signature(payload, sig_header):
        """
        Verificar la firma del webhook de Stripe
        
        Args:
            payload: Cuerpo de la solicitud
            sig_header: Header de firma de Stripe
            
        Returns:
            Event de Stripe o None si la verificación falla
        """
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        
        if not webhook_secret:
            # En desarrollo, permitir webhooks sin verificación
            return stripe.Event.construct_from(
                payload, stripe.api_key
            )
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError:
            # Payload inválido
            return None
        except stripe.error.SignatureVerificationError:
            # Firma inválida
            return None
    
    @staticmethod
    def obtener_metodos_pago(customer_id):
        """
        Obtener los métodos de pago guardados de un cliente
        
        Args:
            customer_id: ID del cliente en Stripe
            
        Returns:
            list: Lista de métodos de pago
        """
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type='card'
            )
            
            return {
                'success': True,
                'payment_methods': [
                    {
                        'id': pm.id,
                        'brand': pm.card.brand,
                        'last4': pm.card.last4,
                        'exp_month': pm.card.exp_month,
                        'exp_year': pm.card.exp_year,
                    }
                    for pm in payment_methods.data
                ]
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
            }
