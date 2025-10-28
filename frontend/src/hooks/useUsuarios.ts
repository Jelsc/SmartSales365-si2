import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usuariosApi } from '@/services/usuariosService';
import type { 
  User, 
  UserFormData, 
  UserFilters, 
  PaginatedResponse,
  Role 
} from '@/types';

interface UseUsuariosState {
  data: PaginatedResponse<User> | null;
  loading: boolean;
  error: string | null;
  selectedItem: User | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  filters: UserFilters;
  roles: Role[];
  personalDisponible: Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>;
  conductoresDisponibles: Array<{
    id: number;
    nombre: string; // Cambiado de personal__nombre
    apellido: string; // Cambiado de personal__apellido
    email: string; // Cambiado de personal__email
    ci: string; // Cambiado de personal__ci
    telefono: string; // Cambiado de personal__telefono
    nro_licencia: string;
  }>;
}

interface UseUsuariosActions {
  // Data operations
  loadData: (filters?: UserFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: UserFormData) => Promise<boolean>;
  updateItem: (id: number, data: UserFormData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  toggleStatus: (id: number, is_active: boolean) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: User) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: User) => void;
  closeDeleteModal: () => void;
  setFilters: (filters: UserFilters) => void;
  clearError: () => void;
  
  // Utility functions
  loadRoles: () => Promise<void>;
  loadPersonalDisponible: () => Promise<void>;
  loadConductoresDisponibles: () => Promise<void>;
}

export function useUsuarios(): UseUsuariosState & UseUsuariosActions {
  const [state, setState] = useState<UseUsuariosState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    filters: {},
    roles: [],
    personalDisponible: [],
    conductoresDisponibles: [],
  });

  const loadData = useCallback(async (filters?: UserFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await usuariosApi.list(filters);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          data: response.data!, 
          loading: false,
          filters: filters || prev.filters 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar los usuarios');
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
      const response = await usuariosApi.get(id);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          selectedItem: response.data!, 
          loading: false 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el usuario');
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

  const createItem = useCallback(async (data: UserFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await usuariosApi.create(data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Usuario creado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al crear el usuario');
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

  const updateItem = useCallback(async (id: number, data: UserFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await usuariosApi.update(id, data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Usuario actualizado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al actualizar el usuario');
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
      const response = await usuariosApi.remove(id);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isDeleteModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Usuario eliminado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al eliminar el usuario');
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

  const toggleStatus = useCallback(async (id: number, is_active: boolean): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await usuariosApi.toggleStatus(id, is_active);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false 
        }));
        toast.success(`Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`);
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al cambiar el estado del usuario');
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

  const openStoreModal = useCallback((item?: User) => {
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

  const openDeleteModal = useCallback((item: User) => {
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

  const setFilters = useCallback((filters: UserFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const response = await usuariosApi.getRoles();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          roles: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  }, []);

  const loadPersonalDisponible = useCallback(async () => {
    try {
      const response = await usuariosApi.getPersonalDisponible();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          personalDisponible: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar personal disponible:', error);
    }
  }, []);

  const loadConductoresDisponibles = useCallback(async () => {
    try {
      const response = await usuariosApi.getConductoresDisponibles();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          conductoresDisponibles: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar conductores disponibles:', error);
    }
  }, []);

  return {
    ...state,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    setFilters,
    clearError,
    loadRoles,
    loadPersonalDisponible,
    loadConductoresDisponibles,
  };
}
