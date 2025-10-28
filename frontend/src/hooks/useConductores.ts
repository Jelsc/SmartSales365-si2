import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { conductoresApi } from '@/services/conductoresService';
import type { 
  Conductor, 
  ConductorFormData, 
  ConductorFilters, 
  PaginatedResponse,
  ConductorOption 
} from '@/types';

interface UseConductoresState {
  data: PaginatedResponse<Conductor> | null;
  loading: boolean;
  error: string | null;
  selectedItem: Conductor | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  filters: ConductorFilters;
  availableConductores: ConductorOption[];
  licenciasVencidas: Conductor[];
  licenciasPorVencer: Conductor[];
}

interface UseConductoresActions {
  // Data operations
  loadData: (filters?: ConductorFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: ConductorFormData) => Promise<boolean>;
  updateItem: (id: number, data: ConductorFormData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: Conductor) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Conductor) => void;
  closeDeleteModal: () => void;
  setFilters: (filters: ConductorFilters) => void;
  clearError: () => void;
  
  // Utility functions
  loadAvailableConductores: () => Promise<void>;
  loadLicenciasVencidas: () => Promise<void>;
  loadLicenciasPorVencer: () => Promise<void>;
}

export function useConductores(): UseConductoresState & UseConductoresActions {
  const [state, setState] = useState<UseConductoresState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    filters: {},
    availableConductores: [],
    licenciasVencidas: [],
    licenciasPorVencer: [],
  });

  const loadData = useCallback(async (filters?: ConductorFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await conductoresApi.list(filters);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          data: response.data!, 
          loading: false,
          filters: filters || prev.filters 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar los conductores');
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
      const response = await conductoresApi.get(id);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          selectedItem: response.data!, 
          loading: false 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el conductor');
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

  const createItem = useCallback(async (data: ConductorFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await conductoresApi.create(data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Conductor creado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al crear el conductor');
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

  const updateItem = useCallback(async (id: number, data: ConductorFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await conductoresApi.update(id, data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Conductor actualizado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al actualizar el conductor');
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
      const response = await conductoresApi.remove(id);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isDeleteModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Conductor eliminado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al eliminar el conductor');
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

  const openStoreModal = useCallback((item?: Conductor) => {
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

  const openDeleteModal = useCallback((item: Conductor) => {
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

  const setFilters = useCallback((filters: ConductorFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const loadAvailableConductores = useCallback(async () => {
    try {
      const response = await conductoresApi.getAvailable();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          availableConductores: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar conductores disponibles:', error);
    }
  }, []);

  const loadLicenciasVencidas = useCallback(async () => {
    try {
      const response = await conductoresApi.getLicenciasVencidas();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          licenciasVencidas: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar licencias vencidas:', error);
    }
  }, []);

  const loadLicenciasPorVencer = useCallback(async () => {
    try {
      const response = await conductoresApi.getLicenciasPorVencer();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          licenciasPorVencer: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar licencias por vencer:', error);
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
    loadAvailableConductores,
    loadLicenciasVencidas,
    loadLicenciasPorVencer,
  };
}
