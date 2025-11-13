import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShippingForm } from './components/shipping-form';
import { CheckoutForm } from './components/checkout-form';
import { OrderSummary } from './components/order-summary';

import { CheckCircle2, Package, CreditCard, MapPin } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export interface ShippingData {
  nombre_completo: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
  notas?: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { carrito, loading } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

  const handleShippingSubmit = (data: ShippingData) => {
    setShippingData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    console.log('[CHECKOUT PAGE] ✅ Pago exitoso, cambiando a confirmación');
    setCurrentStep('confirmation');
  };

  // Si estamos en confirmación, no validar el carrito vacío
  const isConfirmationStep = currentStep === 'confirmation';

  if (loading && !carrito) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo mostrar "carrito vacío" si NO estamos en confirmación
  if (!isConfirmationStep && (!carrito || carrito.items.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <Package className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-8">
            Agrega productos a tu carrito antes de proceder al checkout
          </p>
          <Button onClick={() => navigate('/productos')} className="bg-blue-600 hover:bg-blue-700">
            Ver Productos
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'shipping', name: 'Envío', icon: MapPin },
    { id: 'payment', name: 'Pago', icon: CreditCard },
    { id: 'confirmation', name: 'Confirmación', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Indicador de pasos */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-24 h-1 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${!isConfirmationStep ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
          {/* Formulario de checkout */}
          <div className={!isConfirmationStep ? 'lg:col-span-2' : ''}>
            {currentStep === 'shipping' && (
              <ShippingForm onSubmit={handleShippingSubmit} />
            )}
            
            {currentStep === 'payment' && shippingData && (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  shippingData={shippingData}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setCurrentStep('shipping')}
                />
              </Elements>
            )}

            {currentStep === 'confirmation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                    ¡Pedido Confirmado!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Tu pedido ha sido procesado exitosamente. Recibirás un email de confirmación
                    con los detalles de tu compra.
                  </p>
                  <div className="flex gap-4">
                    <Button onClick={() => navigate('/mis-pedidos')} className="flex-1">
                      Ver Mis Pedidos
                    </Button>
                    <Button onClick={() => navigate('/productos')} variant="outline" className="flex-1">
                      Seguir Comprando
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen del pedido - Solo mostrar si no estamos en confirmación */}
          {!isConfirmationStep && carrito && (
            <div className="lg:col-span-1">
              <OrderSummary carrito={carrito} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
