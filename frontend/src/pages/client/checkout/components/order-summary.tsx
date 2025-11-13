import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Carrito } from '@/services/carritoService';

interface OrderSummaryProps {
  carrito: Carrito;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ carrito }) => {
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `Bs. ${numPrice.toFixed(2)}`;
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/placeholder-product.png';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}${imagePath}`;
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {carrito.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={getImageUrl(item.producto_detalle.imagen)}
                alt={item.producto_detalle.nombre}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.producto_detalle.nombre}
                </p>
                <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totales */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({carrito.total_items} items)</span>
            <span>{formatPrice(carrito.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Envío</span>
            <span className="text-green-600">Gratis</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Impuestos</span>
            <span>Incluidos</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span className="text-blue-600">{formatPrice(carrito.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
