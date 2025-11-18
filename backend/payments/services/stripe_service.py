"""
Servicio para integración con Stripe
"""
import stripe
from django.conf import settings
from decimal import Decimal
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Configurar API key de Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Servicio para procesar pagos con Stripe"""
    
    @staticmethod
    def create_payment_intent(
        monto: Decimal,
        moneda: str = 'usd',
        descripcion: str = '',
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Crear un Payment Intent en Stripe
        
        Args:
            monto: Monto a cobrar
            moneda: Código de moneda (usd, bob, eur, etc.)
            descripcion: Descripción del pago
            metadata: Metadata adicional
            
        Returns:
            Dict con la información del Payment Intent
        """
        try:
            # Stripe requiere el monto en centavos/centésimos
            monto_centavos = int(monto * 100)
            
            # Crear Payment Intent
            payment_intent = stripe.PaymentIntent.create(
                amount=monto_centavos,
                currency=moneda.lower(),
                description=descripcion,
                metadata=metadata or {},
                automatic_payment_methods={
                    'enabled': True,
                }
            )
            
            logger.info(f"Payment Intent creado: {payment_intent.id}")
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'status': payment_intent.status,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Error al crear Payment Intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def confirm_payment(payment_intent_id: str) -> Dict:
        """
        Confirmar un pago y obtener su estado
        
        Args:
            payment_intent_id: ID del Payment Intent
            
        Returns:
            Dict con la información del pago
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'success': True,
                'id': payment_intent.id,
                'status': payment_intent.status,
                'amount': payment_intent.amount / 100,  # Convertir de centavos
                'currency': payment_intent.currency,
                'payment_method': payment_intent.payment_method,
                'metadata': payment_intent.metadata
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Error al confirmar pago: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_refund(
        payment_intent_id: str,
        monto: Optional[Decimal] = None,
        razon: str = 'requested_by_customer'
    ) -> Dict:
        """
        Crear un reembolso
        
        Args:
            payment_intent_id: ID del Payment Intent a reembolsar
            monto: Monto a reembolsar (None para reembolso total)
            razon: Razón del reembolso
            
        Returns:
            Dict con la información del reembolso
        """
        try:
            refund_params = {
                'payment_intent': payment_intent_id,
                'reason': razon
            }
            
            # Si se especifica monto, agregarlo (en centavos)
            if monto:
                refund_params['amount'] = int(monto * 100)
            
            refund = stripe.Refund.create(**refund_params)
            
            logger.info(f"Reembolso creado: {refund.id}")
            
            return {
                'success': True,
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100,
                'currency': refund.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Error al crear reembolso: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def cancel_payment_intent(payment_intent_id: str) -> Dict:
        """
        Cancelar un Payment Intent
        
        Args:
            payment_intent_id: ID del Payment Intent
            
        Returns:
            Dict con el resultado
        """
        try:
            payment_intent = stripe.PaymentIntent.cancel(payment_intent_id)
            
            logger.info(f"Payment Intent cancelado: {payment_intent_id}")
            
            return {
                'success': True,
                'id': payment_intent.id,
                'status': payment_intent.status
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Error al cancelar Payment Intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_payment_methods(customer_id: Optional[str] = None) -> Dict:
        """
        Obtener métodos de pago guardados
        
        Args:
            customer_id: ID del cliente en Stripe
            
        Returns:
            Dict con los métodos de pago
        """
        try:
            if customer_id:
                payment_methods = stripe.PaymentMethod.list(
                    customer=customer_id,
                    type='card'
                )
                
                return {
                    'success': True,
                    'payment_methods': payment_methods.data
                }
            else:
                return {
                    'success': False,
                    'error': 'Se requiere customer_id'
                }
                
        except stripe.error.StripeError as e:
            logger.error(f"Error al obtener métodos de pago: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str) -> Dict:
        """
        Verificar la firma de un webhook de Stripe
        
        Args:
            payload: Cuerpo del request (bytes)
            sig_header: Header 'Stripe-Signature'
            
        Returns:
            Dict con el evento verificado o error
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET
            )
            
            return {
                'success': True,
                'event': event
            }
            
        except ValueError as e:
            logger.error(f"Payload inválido: {str(e)}")
            return {
                'success': False,
                'error': 'Payload inválido'
            }
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Firma inválida: {str(e)}")
            return {
                'success': False,
                'error': 'Firma inválida'
            }
