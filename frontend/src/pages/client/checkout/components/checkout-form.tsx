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

  useEffect(() => {
    // Evitar ejecución duplicada en desarrollo (React.StrictMode)
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // 1. Primero crear el pedido pendiente
    // 2. Luego crear el payment intent para ese pedido
    const initializePayment = async () => {
      try {
        setLoading(true);
        
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
        setPedidoId(nuevoPedidoId);

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

        setClientSecret(paymentResponse.data!.client_secret);
      } catch (err: any) {
        console.error('Error detallado al inicializar pago:', err);
        const errorMessage = err.response?.data?.error 
          || err.response?.data?.pedido_id?.[0]
          || err.message 
          || 'Error al inicializar el pago';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [shippingData]); // Eliminado isInitialized de las dependencias

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setLoading(true);
    setError('');

    try {
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
        setError(stripeError.message || 'Error al procesar el pago');
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirmar el pago en el backend
        await apiRequest('/api/pagos/confirmar_pago/', {
          method: 'POST',
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
          }),
        });

        // Refrescar el carrito (quedará vacío después de confirmar el pago)
        await refrescarCarrito();
        
        onSuccess();
      }
    } catch (err: any) {
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
