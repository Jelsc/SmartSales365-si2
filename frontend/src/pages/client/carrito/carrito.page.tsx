import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CarritoPage = () => {
  const navigate = useNavigate();
  const { carrito, loading, actualizarCantidad, eliminarItem, vaciarCarrito } = useCart();
  const [itemToDelete, setItemToDelete] = React.useState<number | null>(null);
  const [showClearDialog, setShowClearDialog] = React.useState(false);

  const handleUpdateQuantity = (itemId: number, currentQty: number, increment: boolean) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty >= 1) {
      actualizarCantidad(itemId, newQty);
    }
  };

  const handleDeleteItem = () => {
    if (itemToDelete) {
      eliminarItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleClearCart = () => {
    vaciarCarrito();
    setShowClearDialog(false);
  };

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'Bs. 0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Bs. 0.00';
    return `Bs. ${numPrice.toFixed(2)}`;
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/placeholder-product.png';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}${imagePath}`;
  };

  if (loading && !carrito) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!carrito || !carrito.items || carrito.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-8">
            Agrega productos a tu carrito para comenzar a comprar
          </p>
          <Button onClick={() => navigate('/productos')} className="bg-blue-600 hover:bg-blue-700">
            Ver Productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Seguir comprando
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
              <p className="text-gray-600 mt-1">
                {carrito.total_items} {carrito.total_items === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            {carrito.items.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar Carrito
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {carrito.items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  {/* Imagen del producto */}
                  <div className="flex-shrink-0">
                    <img
                      src={getImageUrl(item.producto_detalle.imagen)}
                      alt={item.producto_detalle.nombre}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Detalles del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {item.producto_detalle.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {item.producto_detalle.descripcion}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.producto_detalle.precio_oferta ? (
                        <>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(item.producto_detalle.precio_oferta)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.producto_detalle.precio)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(item.precio_unitario)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock disponible: {item.producto_detalle.stock}
                    </p>
                  </div>

                  {/* Controles de cantidad y precio */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemToDelete(item.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, item.cantidad, false)}
                        disabled={item.cantidad <= 1 || loading}
                        className="w-8 h-8"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{item.cantidad}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, item.cantidad, true)}
                        disabled={item.cantidad >= item.producto_detalle.stock || loading}
                        className="w-8 h-8"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del Pedido</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({carrito.total_items} items)</span>
                  <span>{formatPrice(carrito.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className="text-green-600">Gratis</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(carrito.total)}</span>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                disabled={loading}
              >
                Proceder al Pago
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                El envío y los impuestos se calcularán en el checkout
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de confirmación para eliminar item */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este producto del carrito?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para vaciar carrito */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar carrito?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar todos los productos del carrito? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700"
            >
              Vaciar Carrito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CarritoPage;
