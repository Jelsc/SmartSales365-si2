// Tipos para el módulo de Ventas/Pedidos

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  CONFIRMADO = 'CONFIRMADO',
  PREPARANDO = 'PREPARANDO',
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export interface ItemPedido {
  id: number;
  producto_id: number;
  producto_nombre: string;
  producto_imagen?: string;
  sku: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  variante?: string;
}

export interface DireccionEnvio {
  id: number;
  nombre_completo: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigo_postal?: string;
  referencias?: string;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  usuario: number;
  usuario_email?: string;
  usuario_nombre?: string;
  estado: EstadoPedido;
  subtotal: number;
  costo_envio: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago?: string;
  transaccion_id?: number;
  notas_cliente?: string;
  notas_internas?: string;
  creado: string;
  actualizado: string;
  pagado_en?: string;
  confirmado_en?: string;
  preparando_en?: string;
  enviado_en?: string;
  entregado_en?: string;
  cancelado_en?: string;
  items?: ItemPedido[];
  direccion_envio?: DireccionEnvio;
}

export interface PedidoDetalle extends Pedido {
  items: ItemPedido[];
  direccion_envio: DireccionEnvio;
  timeline: TimelineItem[];
}

export interface TimelineItem {
  estado: EstadoPedido;
  fecha: string;
  completado: boolean;
}

export interface PedidoFilters {
  estado?: EstadoPedido | undefined;
  fecha_inicio?: string | undefined;
  fecha_fin?: string | undefined;
  usuario?: number | undefined;
  search?: string | undefined;
  page?: number | undefined;
  page_size?: number | undefined;
}

export interface PedidosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pedido[];
}

export interface ActualizarEstadoRequest {
  estado: EstadoPedido;
  notas?: string;
}

// Mapeo de estados a colores para badges
export const ESTADO_COLORS: Record<EstadoPedido, string> = {
  [EstadoPedido.PENDIENTE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [EstadoPedido.PAGADO]: 'bg-green-100 text-green-800 border-green-300',
  [EstadoPedido.CONFIRMADO]: 'bg-blue-100 text-blue-800 border-blue-300',
  [EstadoPedido.PREPARANDO]: 'bg-purple-100 text-purple-800 border-purple-300',
  [EstadoPedido.ENVIADO]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  [EstadoPedido.ENTREGADO]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  [EstadoPedido.CANCELADO]: 'bg-red-100 text-red-800 border-red-300',
};

// Etiquetas en español para estados
export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  [EstadoPedido.PENDIENTE]: 'Pendiente',
  [EstadoPedido.PAGADO]: 'Pagado',
  [EstadoPedido.CONFIRMADO]: 'Confirmado',
  [EstadoPedido.PREPARANDO]: 'Preparando',
  [EstadoPedido.ENVIADO]: 'Enviado',
  [EstadoPedido.ENTREGADO]: 'Entregado',
  [EstadoPedido.CANCELADO]: 'Cancelado',
};
