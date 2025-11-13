import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Package, MapPin, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/services/authService';
import type { PedidoDetalle } from '@/types/pedido';

const ESTADO_COLORS_MAP: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  PAGADO: 'bg-green-100 text-green-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  PREPARANDO: 'bg-purple-100 text-purple-800',
  ENVIADO: 'bg-indigo-100 text-indigo-800',
  ENTREGADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const ESTADO_LABELS_MAP: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const PedidoDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPedido = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiRequest<PedidoDetalle>(
          `/api/ventas/pedidos/${id}/detalle/`
        );
        setPedido(response.data!);
      } catch (err: any) {
        console.error('Error al cargar pedido:', err);
        setError(err.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    loadPedido();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Pedido no encontrado'}
          </h2>
          <Button onClick={() => navigate('/mis-pedidos')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mis-pedidos')}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mis Pedidos
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{pedido.numero_pedido}
            </h1>
            <p className="text-gray-600 mt-1">Realizado el {formatDate(pedido.creado)}</p>
          </div>
          <Badge className={`${ESTADO_COLORS_MAP[pedido.estado]} text-base px-4 py-2`}>
            {ESTADO_LABELS_MAP[pedido.estado]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pedido.items?.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={getImageUrl(item.producto_imagen)}
                        alt={item.producto_nombre}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.producto_nombre}</h4>
                        <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                        <p className="text-sm text-gray-600">
                          Precio unitario: {formatPrice(item.precio_unitario)}
                        </p>
                        <p className="font-semibold text-blue-600">
                          Subtotal: {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dirección de envío */}
            {pedido.direccion_envio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Dirección de Envío
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">{pedido.direccion_envio.nombre_completo}</p>
                    <p>{pedido.direccion_envio.direccion}</p>
                    <p>
                      {pedido.direccion_envio.ciudad}, {pedido.direccion_envio.codigo_postal}
                    </p>
                    <p>{pedido.direccion_envio.pais}</p>
                    <p>Tel: {pedido.direccion_envio.telefono}</p>
                    <p>Email: {pedido.direccion_envio.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notas del cliente */}
            {pedido.notas_cliente && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{pedido.notas_cliente}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resumen del pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(pedido.subtotal)}</span>
                </div>
                {pedido.descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(pedido.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{formatPrice(pedido.costo_envio)}</span>
                </div>
                {pedido.impuestos > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Impuestos</span>
                    <span>{formatPrice(pedido.impuestos)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(pedido.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Información de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {pedido.estado === 'PAGADO' || pedido.estado === 'CONFIRMADO' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENVIADO' || pedido.estado === 'ENTREGADO' 
                      ? 'Pagado' 
                      : 'Pendiente'}
                  </Badge>
                </div>
                {pedido.pagado_en && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fecha de pago:</span>
                    <span className="font-medium">{formatDate(pedido.pagado_en)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fechas importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Creado</p>
                  <p className="font-medium">{formatDate(pedido.creado)}</p>
                </div>
                {pedido.enviado_en && (
                  <div>
                    <p className="text-gray-600">Enviado</p>
                    <p className="font-medium">{formatDate(pedido.enviado_en)}</p>
                  </div>
                )}
                {pedido.entregado_en && (
                  <div>
                    <p className="text-gray-600">Entregado</p>
                    <p className="font-medium">{formatDate(pedido.entregado_en)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PedidoDetallePage;
