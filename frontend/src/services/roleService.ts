import { apiRequest, type ApiResponse } from './authService';

// Tipos específicos para gestión de roles
export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
  permisos: string[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface RoleFilters {
  search?: string;
  es_administrativo?: boolean;
  ordering?: string;
}

export interface Permission {
  codename: string;
  name: string;
  content_type: string;
}

export interface RoleStats {
  total_roles: number;
  roles_administrativos: number;
  roles_no_administrativos: number;
  permisos_mas_usados: string[];
}

// Servicios de gestión de roles
export const roleService = {
  // Obtener lista de roles
  async getRoles(filters: RoleFilters = {}): Promise<ApiResponse<{
    results: Role[];
    count: number;
    next?: string;
    previous?: string;
  }>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.es_administrativo !== undefined) params.append('es_administrativo', filters.es_administrativo.toString());
    if (filters.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/roles/?${queryString}` : '/api/roles/';
    
    return apiRequest(endpoint);
  },

  // Obtener rol por ID
  async getRoleById(roleId: number): Promise<ApiResponse<Role>> {
    return apiRequest(`/api/roles/${roleId}/`);
  },

  // Crear rol
  async createRole(roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    return apiRequest('/api/roles/', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  // Actualizar rol
  async updateRole(roleId: number, roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    return apiRequest(`/api/roles/${roleId}/`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  // Actualizar rol parcialmente
  async patchRole(roleId: number, roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    return apiRequest(`/api/roles/${roleId}/`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });
  },

  // Eliminar rol
  async deleteRole(roleId: number): Promise<ApiResponse> {
    return apiRequest(`/api/roles/${roleId}/`, {
      method: 'DELETE',
    });
  },

  // Obtener estadísticas de roles
  async getRoleStats(): Promise<ApiResponse<RoleStats>> {
    return apiRequest('/api/roles/stats/');
  },

  // Buscar roles
  async searchRoles(query: string): Promise<ApiResponse<Role[]>> {
    return apiRequest(`/api/roles/search/?q=${encodeURIComponent(query)}`);
  },
};

// Servicios de gestión de permisos
export const permissionService = {
  // Obtener todos los permisos disponibles
  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return apiRequest('/api/permissions/');
  },

  // Obtener permisos por grupo
  async getPermissionsByGroup(): Promise<ApiResponse<Record<string, Permission[]>>> {
    return apiRequest('/api/permissions/groups/');
  },

  // Obtener permisos de un rol específico
  async getRolePermissions(roleId: number): Promise<ApiResponse<string[]>> {
    return apiRequest(`/api/roles/${roleId}/permissions/`);
  },

  // Asignar permisos a un rol
  async assignPermissionsToRole(roleId: number, permissions: string[]): Promise<ApiResponse<Role>> {
    return apiRequest(`/api/roles/${roleId}/permissions/`, {
      method: 'POST',
      body: JSON.stringify({ permisos: permissions }),
    });
  },

  // Verificar si un rol tiene un permiso específico
  async checkRolePermission(roleId: number, permission: string): Promise<ApiResponse<boolean>> {
    return apiRequest(`/api/roles/${roleId}/has-permission/?permiso=${encodeURIComponent(permission)}`);
  },
};

// Servicios de compatibilidad (para mantener funcionalidad existente)
export const rolesService = roleService;
export const permissionsService = permissionService;
