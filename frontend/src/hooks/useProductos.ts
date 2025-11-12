import { useState, useCallback } from 'react';
import { productosService } from '@/services';
import type { Producto, ProductoFormData, ProductoFilters } from '@/types';
import { toast } from 'react-hot-toast';

interface PaginatedData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Producto[];
}

export function useProductos() {
  const [data, setData] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Producto | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = useCallback(async (filters?: ProductoFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productosService.getAll(filters);
      setData(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar productos';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: ProductoFormData) => {
    setLoading(true);
    setError(null);
    try {
      await productosService.create(itemData);
      toast.success('Producto creado exitosamente');
      await loadData(); // Recargar la lista después de crear
      closeStoreModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear producto';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const updateItem = useCallback(async (id: number, itemData: Partial<ProductoFormData>) => {
    setLoading(true);
    setError(null);
    try {
      await productosService.update(id, itemData);
      toast.success('Producto actualizado exitosamente');
      await loadData(); // Recargar la lista después de actualizar
      closeStoreModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar producto';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await productosService.delete(id);
      toast.success('Producto eliminado exitosamente');
      await loadData(); // Recargar la lista después de eliminar
      closeDeleteModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar producto';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const openStoreModal = useCallback((item?: Producto) => {
    setSelectedItem(item || null);
    setIsStoreModalOpen(true);
  }, []);

  const closeStoreModal = useCallback(() => {
    setIsStoreModalOpen(false);
    setSelectedItem(null);
  }, []);

  const openDeleteModal = useCallback((item: Producto) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
  };
}
