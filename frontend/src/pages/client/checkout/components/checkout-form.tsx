import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { apiRequest } from '@/services/authService';
import { useCart } from '@/context/CartContext';
import type { ShippingData } from '../checkout.page';

interface CheckoutFormProps {
  shippingData: ShippingData;
  onSuccess: () => void;
  onBack: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  shippingData,
  onSuccess,
  onBack,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refrescarCarrito } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const isInitializedRef = useRef(false);
  const initializationKey = useRef(`payment-init-${Date.now()}`);

  useEffect(() => {
    // Evitar ejecución duplicada usando ref Y sessionStorage
    const sessionKey = initializationKey.current;
    
    if (isInitializedRef.current || sessionStorage.getItem(sessionKey)) {
      console.log('[CHECKOUT] Inicialización ya ejecutada, saltando...');
      return;
    }
    
    isInitializedRef.current = true;
    sessionStorage.setItem(sessionKey, 'true');
    
    console.log('[CHECKOUT] Iniciando proceso de pago...');
    
    // 1. Primero crear el pedido pendiente
    // 2. Luego crear el payment intent para ese pedido
    const initializePayment = async () => {
      try {
        setLoading(true);
        
        console.log('[CHECKOUT] 1. Creando pedido...');
        // Crear pedido en estado PENDIENTE
        const pedidoResponse = await apiRequest<{ id: number }>(
          '/api/ventas/pedidos/',
          {
            method: 'POST',
            body: JSON.stringify({
              direccion: {
                nombre_completo: shippingData.nombre_completo,
                telefono: shippingData.telefono,
                email: shippingData.email,
                direccion: shippingData.direccion,
                referencia: '', // Campo opcional
                ciudad: shippingData.ciudad,
                departamento: shippingData.pais, // Usar país como departamento por ahora
                codigo_postal: shippingData.codigo_postal || '',
              },
              notas_cliente: shippingData.notas || '',
            }),
          }
        );

        const nuevoPedidoId = pedidoResponse.data!.id;
        console.log('[CHECKOUT] ✅ Pedido creado:', nuevoPedidoId);
        setPedidoId(nuevoPedidoId);

        console.log('[CHECKOUT] 2. Creando payment intent...');
        // Crear payment intent para el pedido
        const paymentResponse = await apiRequest<{ client_secret: string }>(
          '/api/pagos/crear_payment_intent/',
          {
            method: 'POST',
            body: JSON.stringify({
              pedido_id: nuevoPedidoId,
            }),
          }
        );

        console.log('[CHECKOUT] ✅ Payment intent creado exitosamente');
        setClientSecret(paymentResponse.data!.client_secret);
      } catch (err: any) {
        console.error('[CHECKOUT] ❌ Error al inicializar pago:', err);
        console.error('[CHECKOUT] Error response:', err.response?.data);
        const errorMessage = err.response?.data?.error 
          || err.response?.data?.pedido_id?.[0]
          || err.message 
          || 'Error al inicializar el pago';
        setError(errorMessage);
        
        // Limpiar sessionStorage si hay error para permitir reintentar
        sessionStorage.removeItem(sessionKey);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
    
    // Cleanup function
    return () => {
      // NO limpiar sessionStorage en cleanup para evitar doble ejecución
      console.log('[CHECKOUT] Componente desmontándose...');
    };
  }, [shippingData]); // Eliminado isInitialized de las dependencias

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[CHECKOUT] Iniciando proceso de pago con tarjeta...');

    if (!stripe || !elements || !clientSecret) {
      console.error('[CHECKOUT] Faltan elementos necesarios:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
      setError('Error: No se ha inicializado el sistema de pagos correctamente');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error('[CHECKOUT] No se encontró CardElement');
      setError('Error: No se encontró el formulario de tarjeta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[CHECKOUT] Confirmando pago con Stripe...');
      // Confirmar el pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingData.nombre_completo,
              email: shippingData.email,
              phone: shippingData.telefono,
              address: {
                line1: shippingData.direccion,
                city: shippingData.ciudad,
                postal_code: shippingData.codigo_postal,
                country: 'BO', // Bolivia
              },
            },
          },
        }
      );

      if (stripeError) {
        console.error('[CHECKOUT] Error de Stripe:', stripeError);
        setError(stripeError.message || 'Error al procesar el pago');
        setLoading(false);
        return;
      }

      console.log('[CHECKOUT] Respuesta de Stripe:', paymentIntent?.status);

      if (paymentIntent.status === 'succeeded') {
        console.log('[CHECKOUT] Pago exitoso, confirmando en backend...');
        // Confirmar el pago en el backend
        const response = await apiRequest('/api/pagos/confirmar_pago/', {
          method: 'POST',
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
          }),
        });

        console.log('[CHECKOUT] ✅ Pago confirmado en backend:', response);

        // Refrescar el carrito (quedará vacío después de confirmar el pago)
        console.log('[CHECKOUT] Refrescando carrito...');
        await refrescarCarrito();
        
        console.log('[CHECKOUT] ✅ Llamando a onSuccess()...');
        onSuccess();
      } else {
        console.warn('[CHECKOUT] Estado del pago no es "succeeded":', paymentIntent.status);
        setError('El pago no se completó correctamente');
      }
    } catch (err: any) {
      console.error('[CHECKOUT] ❌ Error en handleSubmit:', err);
      setError(err.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mostrar loading mientras se inicializa el pago */}
        {loading && !clientSecret && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">Preparando el pago...</p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/cart')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Carrito
              </Button>
            </div>
          </div>
        )}

        {/* Mostrar error si falla la inicialización */}
        {error && !clientSecret && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/cart')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Carrito
              </Button>
              <Button 
                onClick={onBack}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Cambiar Dirección
              </Button>
            </div>
          </div>
        )}

        {/* Mostrar formulario solo cuando esté listo */}
        {clientSecret && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tarjeta de Crédito/Débito
            </label>
            <div className="p-4 border border-gray-300 rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Prueba con: 4242 4242 4242 4242 | MM/YY: cualquier fecha futura | CVC: cualquier 3
              dígitos
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-3">Dirección de Envío:</h4>
            <p className="text-sm text-blue-800">
              {shippingData.nombre_completo}
              <br />
              {shippingData.direccion}
              <br />
              {shippingData.ciudad}, {shippingData.codigo_postal}
              <br />
              {shippingData.pais}
              <br />
              Tel: {shippingData.telefono}
              <br />
              Email: {shippingData.email}
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading || !clientSecret}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Pagar Ahora'
              )}
            </Button>
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  );
};
