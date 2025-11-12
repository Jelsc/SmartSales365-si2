import { useState, useCallback } from 'react';
import { categoriasService } from '@/services';
import type { Categoria } from '@/types';
import { toast } from 'react-hot-toast';

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
  activa: boolean;
  orden: number;
  imagen?: File | null;
}

export function useCategorias() {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Categoria | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoriasService.getAll();
      setData(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar categorías';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: CategoriaFormData) => {
    setLoading(true);
    setError(null);
    try {
      await categoriasService.create(itemData);
      toast.success('Categoría creada exitosamente');
      await loadData(); // Recargar la lista
      closeStoreModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear categoría';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const updateItem = useCallback(async (id: number, itemData: Partial<CategoriaFormData>) => {
    setLoading(true);
    setError(null);
    try {
      await categoriasService.update(id, itemData);
      toast.success('Categoría actualizada exitosamente');
      await loadData(); // Recargar la lista
      closeStoreModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar categoría';
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
      await categoriasService.delete(id);
      toast.success('Categoría eliminada exitosamente');
      await loadData(); // Recargar la lista
      closeDeleteModal();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar categoría';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const openStoreModal = useCallback((item?: Categoria) => {
    setSelectedItem(item || null);
    setIsStoreModalOpen(true);
  }, []);

  const closeStoreModal = useCallback(() => {
    setSelectedItem(null);
    setIsStoreModalOpen(false);
  }, []);

  const openDeleteModal = useCallback((item: Categoria) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
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
  };
}
