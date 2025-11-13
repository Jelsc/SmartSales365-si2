import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePedidoDetalle, useActualizarEstado } from '@/hooks/usePedidos';
import {
  EstadoPedido,
  ESTADO_COLORS,
  ESTADO_LABELS,
} from '@/types/pedido';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Package,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';

interface PedidoDetailProps {
  pedidoId: number;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export default function PedidoDetail({
  pedidoId,
  open,
  onClose,
  onStatusUpdated,
}: PedidoDetailProps) {
  const { pedido, loading, refresh } = usePedidoDetalle(pedidoId);
  const { actualizarEstado, loading: updating } = useActualizarEstado();
  const [selectedEstado, setSelectedEstado] = React.useState<EstadoPedido | ''>('');

  React.useEffect(() => {
    if (pedido) {
      setSelectedEstado(pedido.estado);
    }
  }, [pedido]);

  const handleUpdateEstado = async () => {
    if (!selectedEstado || selectedEstado === pedido?.estado) return;

    const success = await actualizarEstado(pedidoId, selectedEstado);
    if (success) {
      refresh();
      onStatusUpdated();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Bs. ${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando pedido...</DialogTitle>
            <DialogDescription>Por favor espera mientras cargamos los detalles del pedido</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Pedido {pedido.numero_pedido}</span>
            <Badge variant="outline" className={ESTADO_COLORS[pedido.estado]}>
              {ESTADO_LABELS[pedido.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalles completos del pedido y opciones de gestión
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">          {/* Información del cliente */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p>
                <span className="font-medium">Nombre:</span>{' '}
                {pedido.usuario_nombre || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                {pedido.usuario_email || 'N/A'}
              </p>
            </div>
          </div>

          {/* Dirección de envío */}
          {pedido.direccion_envio && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección de Envío
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>
                  <span className="font-medium">Destinatario:</span>{' '}
                  {pedido.direccion_envio.nombre_completo}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{' '}
                  {pedido.direccion_envio.telefono}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{' '}
                  {pedido.direccion_envio.direccion}
                </p>
                <p>
                  <span className="font-medium">Ciudad:</span>{' '}
                  {pedido.direccion_envio.ciudad},{' '}
                  {pedido.direccion_envio.departamento}
                </p>
                {pedido.direccion_envio.referencias && (
                  <p>
                    <span className="font-medium">Referencias:</span>{' '}
                    {pedido.direccion_envio.referencias}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Productos */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos ({pedido.items?.length || 0})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">
                      Producto
                    </th>
                    <th className="text-center p-3 text-sm font-medium">
                      Cantidad
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      Precio Unit.
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pedido.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {item.producto_nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </p>
                          {item.variante && (
                            <p className="text-sm text-gray-500">
                              Variante: {item.variante}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">{item.cantidad}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.precio_unitario)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de pago */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Resumen de Pago
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(pedido.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span className="font-medium">
                  {formatCurrency(pedido.costo_envio)}
                </span>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span className="font-medium">
                    -{formatCurrency(pedido.descuento)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(pedido.total)}</span>
              </div>
              {pedido.metodo_pago && (
                <p className="text-sm text-gray-600">
                  Método de pago: {pedido.metodo_pago}
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historial del Pedido
            </h3>
            <div className="space-y-2">
              {pedido.creado && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Creado:</span>
                  <span>{formatDate(pedido.creado)}</span>
                </div>
              )}
              {pedido.pagado_en && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pagado:</span>
                  <span>{formatDate(pedido.pagado_en)}</span>
                </div>
              )}
              {pedido.confirmado_en && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Confirmado:</span>
                  <span>{formatDate(pedido.confirmado_en)}</span>
                </div>
              )}
              {pedido.preparando_en && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Preparando:</span>
                  <span>{formatDate(pedido.preparando_en)}</span>
                </div>
              )}
              {pedido.enviado_en && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Enviado:</span>
                  <span>{formatDate(pedido.enviado_en)}</span>
                </div>
              )}
              {pedido.entregado_en && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Entregado:</span>
                  <span>{formatDate(pedido.entregado_en)}</span>
                </div>
              )}
              {pedido.cancelado_en && (
                <div className="flex justify-between text-sm text-red-600">
                  <span className="font-medium">Cancelado:</span>
                  <span>{formatDate(pedido.cancelado_en)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actualizar estado */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Actualizar Estado</h3>
            <div className="flex gap-3">
              <Select
                value={selectedEstado}
                onValueChange={(value) => setSelectedEstado(value as EstadoPedido)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateEstado}
                disabled={
                  updating ||
                  !selectedEstado ||
                  selectedEstado === pedido.estado
                }
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar'
                )}
              </Button>
            </div>
          </div>

          {/* Notas */}
          {pedido.notas_cliente && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">Notas del Cliente:</p>
              <p className="text-sm text-gray-700">{pedido.notas_cliente}</p>
            </div>
          )}
          
          {pedido.notas_internas && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">Notas Internas:</p>
              <p className="text-sm text-gray-700">{pedido.notas_internas}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
