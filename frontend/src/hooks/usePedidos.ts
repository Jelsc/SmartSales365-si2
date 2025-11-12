import { useState, useEffect, useCallback } from 'react';
import { ventasService } from '@/services/ventasService';
import type {
  Pedido,
  PedidoDetalle,
  PedidosResponse,
  PedidoFilters,
} from '@/types/pedido';
import { EstadoPedido } from '@/types/pedido';
import { toast } from 'sonner';

export function usePedidos(initialFilters?: PedidoFilters) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
  const [filters, setFilters] = useState<PedidoFilters>(initialFilters || {});

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PedidosResponse = await ventasService.getAllPedidos(filters);
      setPedidos(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar pedidos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const updateFilters = (newFilters: Partial<PedidoFilters>) => {
    setFilters((prev) => {
      // Si newFilters está vacío, resetear a valores iniciales
      if (Object.keys(newFilters).length === 0) {
        return { page: 1 };
      }
      return { ...prev, ...newFilters, page: 1 };
    });
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const refresh = () => {
    fetchPedidos();
  };

  return {
    pedidos,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    refresh,
  };
}

export function usePedidoDetalle(id: number | null) {
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPedido = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await ventasService.getPedidoById(id);
      setPedido(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar detalle del pedido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  return { pedido, loading, error, refresh: fetchPedido };
}

export function useActualizarEstado() {
  const [loading, setLoading] = useState(false);

  const actualizarEstado = async (
    id: number,
    estado: EstadoPedido,
    notas?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const data = notas ? { estado, notas } : { estado };
      await ventasService.actualizarEstado(id, data);
      toast.success(`Estado actualizado a: ${estado}`);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar estado';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { actualizarEstado, loading };
}
