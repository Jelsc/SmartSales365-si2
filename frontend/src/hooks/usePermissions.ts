import { useState, useCallback } from 'react';
import { permissionsService } from '@/services/roleService';

// Función para determinar la categoría basada en el código del permiso
const getCategoriaFromCodename = (codename: string): string => {
  if (codename.includes('usuario') || codename.includes('rol')) return 'Gestión de Usuarios';
  if (codename.includes('vehiculo') || codename.includes('conductor') || codename.includes('ruta')) return 'Operaciones';
  if (codename.includes('reporte') || codename.includes('estadistica')) return 'Reportes';
  if (codename.includes('monitorear') || codename.includes('seguimiento')) return 'Monitoreo';
  if (codename.includes('configuracion') || codename.includes('gestionar')) return 'Administración';
  if (codename.includes('auth') || codename.includes('login') || codename.includes('logout')) return 'Autenticación';
  return 'Configuración';
};

interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: string;
  categoria: string;
}

interface UsePermissionsReturn {
  permisos: { results: Permission[]; count: number } | null;
  loading: boolean;
  error: string | null;
  loadPermisos: (filters?: any) => Promise<void>;
  getPaginatedPermisos: (page: number, itemsPerPage: number, search?: string, categoria?: string) => { results: Permission[]; count: number };
  clearError: () => void;
}

export function usePermissions(): UsePermissionsReturn {
  const [permisos, setPermisos] = useState<{ results: Permission[]; count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermisos = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsService.getAllPermissions();
      if (response.success && response.data) {
        // Transformar los datos para que coincidan con la estructura esperada
        const transformedData = Array.isArray(response.data) 
          ? response.data.map((permission, index) => ({
              id: index + 1,
              name: permission.name,
              codename: permission.codename,
              content_type: permission.content_type || 'configuración',
              categoria: getCategoriaFromCodename(permission.codename)
            }))
          : [];
        
        setPermisos({
          results: transformedData,
          count: transformedData.length
        });
      } else {
        setError(response.error || 'Error al cargar permisos');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaginatedPermisos = useCallback((page: number, itemsPerPage: number, search?: string, categoria?: string) => {
    if (!permisos?.results) {
      return { results: [], count: 0 };
    }

    let filteredPermisos = [...permisos.results];

    // Aplicar filtro de búsqueda
    if (search) {
      filteredPermisos = filteredPermisos.filter(permission =>
        permission.name.toLowerCase().includes(search.toLowerCase()) ||
        permission.codename.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Aplicar filtro de categoría
    if (categoria && categoria !== 'all') {
      filteredPermisos = filteredPermisos.filter(permission =>
        permission.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }

    // Calcular paginación
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filteredPermisos.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      count: filteredPermisos.length
    };
  }, [permisos]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    permisos,
    loading,
    error,
    loadPermisos,
    getPaginatedPermisos,
    clearError,
  };
}