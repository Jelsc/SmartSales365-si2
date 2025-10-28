import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { personalApi } from '@/services/personalService';
import type { 
  Personal, 
  PersonalFormData, 
  PersonalFilters, 
  PaginatedResponse,
  PersonalOption 
} from '@/types';

interface UsePersonalState {
  data: PaginatedResponse<Personal> | null;
  loading: boolean;
  error: string | null;
  selectedItem: Personal | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  filters: PersonalFilters;
  availablePersonal: PersonalOption[];
}

interface UsePersonalActions {
  // Data operations
  loadData: (filters?: PersonalFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: PersonalFormData) => Promise<boolean>;
  updateItem: (id: number, data: PersonalFormData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: Personal) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Personal) => void;
  closeDeleteModal: () => void;
  setFilters: (filters: PersonalFilters) => void;
  clearError: () => void;
  
  // Utility functions
  loadAvailablePersonal: () => Promise<void>;
}

export function usePersonal(): UsePersonalState & UsePersonalActions {
  const [state, setState] = useState<UsePersonalState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    filters: {},
    availablePersonal: [],
  });

  const loadData = useCallback(async (filters?: PersonalFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await personalApi.list(filters);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          data: response.data!, 
          loading: false,
          filters: filters || prev.filters 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el personal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
    }
  }, []);

  const loadItem = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await personalApi.get(id);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          selectedItem: response.data!, 
          loading: false 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el personal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
    }
  }, []);

  const createItem = useCallback(async (data: PersonalFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await personalApi.create(data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Personal creado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al crear el personal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const updateItem = useCallback(async (id: number, data: PersonalFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await personalApi.update(id, data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Personal actualizado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al actualizar el personal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await personalApi.remove(id);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isDeleteModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Personal eliminado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al eliminar el personal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const openStoreModal = useCallback((item?: Personal) => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: true, 
      selectedItem: item || null 
    }));
  }, []);

  const closeStoreModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: false, 
      selectedItem: null 
    }));
  }, []);

  const openDeleteModal = useCallback((item: Personal) => {
    setState(prev => ({ 
      ...prev, 
      isDeleteModalOpen: true, 
      selectedItem: item 
    }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isDeleteModalOpen: false, 
      selectedItem: null 
    }));
  }, []);

  const setFilters = useCallback((filters: PersonalFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const loadAvailablePersonal = useCallback(async () => {
    try {
      const response = await personalApi.getAvailable();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          availablePersonal: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar personal disponible:', error);
    }
  }, []);

  return {
    ...state,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    setFilters,
    clearError,
    loadAvailablePersonal,
  };
}
