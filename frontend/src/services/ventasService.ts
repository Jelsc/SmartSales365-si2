import { apiRequest } from './authService';
import type {
  Pedido,
  PedidoDetalle,
  PedidosResponse,
  PedidoFilters,
  ActualizarEstadoRequest,
} from '@/types/pedido';
import { EstadoPedido } from '@/types/pedido';

const BASE_URL = '/api/ventas/pedidos';

export const ventasService = {
  /**
   * Obtener todos los pedidos con filtros y paginación (Admin)
   */
  async getAllPedidos(filters?: PedidoFilters): Promise<PedidosResponse> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
    if (filters?.usuario) params.append('usuario', filters.usuario.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `${BASE_URL}/?${queryString}` : `${BASE_URL}/`;
    
    const response = await apiRequest<PedidosResponse>(endpoint);
    return response.data!;
  },

  /**
   * Obtener detalle completo de un pedido
   */
  async getPedidoById(id: number): Promise<PedidoDetalle> {
    const response = await apiRequest<PedidoDetalle>(`${BASE_URL}/${id}/detalle/`);
    return response.data!;
  },

  /**
   * Actualizar estado de un pedido (Admin)
   */
  async actualizarEstado(
    id: number,
    data: ActualizarEstadoRequest
  ): Promise<Pedido> {
    const response = await apiRequest<Pedido>(
      `${BASE_URL}/${id}/actualizar_estado/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  },

  /**
   * Obtener timeline/tracking de un pedido
   */
  async trackPedido(id: number): Promise<{ timeline: any[] }> {
    const response = await apiRequest<{ timeline: any[] }>(`${BASE_URL}/${id}/rastrear/`);
    return response.data!;
  },

  /**
   * Obtener estadísticas de pedidos (útil para dashboard)
   */
  async getEstadisticas(): Promise<{
    total: number;
    por_estado: Record<EstadoPedido, number>;
    ventas_totales: string;
    promedio_pedido: string;
  }> {
    // Este endpoint puede implementarse después
    // Por ahora retornamos datos mock
    return {
      total: 0,
      por_estado: {
        [EstadoPedido.PENDIENTE]: 0,
        [EstadoPedido.PAGADO]: 0,
        [EstadoPedido.CONFIRMADO]: 0,
        [EstadoPedido.PREPARANDO]: 0,
        [EstadoPedido.ENVIADO]: 0,
        [EstadoPedido.ENTREGADO]: 0,
        [EstadoPedido.CANCELADO]: 0,
      },
      ventas_totales: '0.00',
      promedio_pedido: '0.00',
    };
  },

  /**
   * Exportar pedidos a CSV (futuro)
   */
  async exportarPedidos(filters?: PedidoFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

    // Para blob, necesitamos usar fetch directamente
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}${BASE_URL}/exportar/?${params.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    return await response.blob();
  },
};

export default ventasService;
