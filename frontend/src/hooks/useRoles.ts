import { useState, useCallback } from 'react';
import { roleService, permissionService } from '@/services/roleService';
import type { Role, RoleFormData } from '@/types';

interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: string;
}

interface UseRolesReturn {
  roles: { results: Role[]; count: number } | null;
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  selectedRole: Role | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  loadRoles: (filters?: any) => Promise<void>;
  loadPermissions: () => Promise<void>;
  createRole: (data: RoleFormData) => Promise<boolean>;
  updateRole: (id: number, data: RoleFormData) => Promise<boolean>;
  deleteRole: (id: number) => Promise<boolean>;
  openStoreModal: (role?: Role | null) => void;
  closeStoreModal: () => void;
  openDeleteModal: (role: Role) => void;
  closeDeleteModal: () => void;
  clearError: () => void;
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<{ results: Role[]; count: number } | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadRoles = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.getRoles(filters);
      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        setError(response.error || 'Error al cargar roles');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionService.getPermissionsByGroup();
      if (response.success && response.data) {
        // Aplanar los permisos de todos los grupos
        const allPermissions: Permission[] = [];
        Object.values(response.data).forEach((groupPermissions: any) => {
          allPermissions.push(...groupPermissions);
        });
        setPermissions(allPermissions);
      } else {
        setError(response.error || 'Error al cargar permisos');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (data: RoleFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.createRole(data);
      if (response.success) {
        await loadRoles(); // Recargar la lista
        return true;
      } else {
        setError(response.error || 'Error al crear rol');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear rol');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRoles]);

  const updateRole = useCallback(async (id: number, data: RoleFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.updateRole(id, data);
      if (response.success) {
        await loadRoles(); // Recargar la lista
        return true;
      } else {
        setError(response.error || 'Error al actualizar rol');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar rol');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRoles]);

  const deleteRole = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.deleteRole(id);
      if (response.success) {
        await loadRoles(); // Recargar la lista
        return true;
      } else {
        setError(response.error || 'Error al eliminar rol');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar rol');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRoles]);

  const openStoreModal = useCallback((role?: Role | null) => {
    setSelectedRole(role || null);
    setIsStoreModalOpen(true);
  }, []);

  const closeStoreModal = useCallback(() => {
    setIsStoreModalOpen(false);
    setSelectedRole(null);
  }, []);

  const openDeleteModal = useCallback((role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    roles,
    permissions,
    loading,
    error,
    selectedRole,
    isStoreModalOpen,
    isDeleteModalOpen,
    loadRoles,
    loadPermissions,
    createRole,
    updateRole,
    deleteRole,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
  };
}