import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Eye } from 'lucide-react';
import { apiRequest } from '@/services/authService';
import type { Pedido, PedidosResponse, ESTADO_COLORS, ESTADO_LABELS } from '@/types/pedido';

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

const MisPedidosPage = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        setLoading(true);
        const response = await apiRequest<PedidosResponse>('/api/ventas/pedidos/mis_pedidos/');
        setPedidos(response.data!.results);
      } catch (err: any) {
        console.error('Error al cargar pedidos:', err);
        setError(err.message || 'Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No tienes pedidos aún</h2>
            <p className="text-gray-600 mb-8">
              Realiza tu primera compra y podrás ver tus pedidos aquí
            </p>
            <Button onClick={() => navigate('/productos')} className="bg-blue-600 hover:bg-blue-700">
              Ver Productos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Información del pedido */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{pedido.numero_pedido}
                        </h3>
                        <Badge className={ESTADO_COLORS_MAP[pedido.estado]}>
                          {ESTADO_LABELS_MAP[pedido.estado]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Realizado el {formatDate(pedido.creado)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {pedido.items?.length || 0} producto(s)
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        Total: {formatPrice(pedido.total)}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => navigate(`/mis-pedidos/${pedido.id}`)}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {pedido.estado === 'ENVIADO' && (
                        <Button
                          onClick={() => navigate(`/mis-pedidos/${pedido.id}/rastrear`)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Rastrear Envío
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Dirección de envío resumida */}
                  {pedido.direccion_envio && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Envío a:</span>{' '}
                        {pedido.direccion_envio.direccion}, {pedido.direccion_envio.ciudad}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MisPedidosPage;
