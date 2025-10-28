import { apiRequest, type ApiResponse, type User } from './authService';

// Tipos específicos para gestión de usuarios
export interface UserFilters {
  search?: string;
  rol?: number;
  is_active?: boolean;
  es_administrativo?: boolean;
  ordering?: string;
}

export interface UserStats {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  usuarios_por_rol: Record<string, number>;
}

export interface UserPermissions {
  permisos: string[];
  permisos_disponibles: string[];
}

// Servicios de gestión de usuarios
export const userService = {
  // Obtener lista de usuarios
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<{
    results: User[];
    count: number;
    next?: string;
    previous?: string;
  }>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.rol) params.append('rol', filters.rol.toString());
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.es_administrativo !== undefined) params.append('es_administrativo', filters.es_administrativo.toString());
    if (filters.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/users/?${queryString}` : '/api/users/';
    
    return apiRequest(endpoint);
  },

  // Obtener usuario por ID
  async getUserById(userId: number): Promise<ApiResponse<User>> {
    return apiRequest(`/api/users/${userId}/`);
  },

  // Crear usuario
  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest('/api/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Actualizar usuario
  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest(`/api/users/${userId}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Actualizar usuario parcialmente
  async patchUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest(`/api/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Eliminar usuario
  async deleteUser(userId: number): Promise<ApiResponse> {
    return apiRequest(`/api/users/${userId}/`, {
      method: 'DELETE',
    });
  },

  // Cambiar estado de usuario (activar/desactivar)
  async toggleUserStatus(userId: number): Promise<ApiResponse<User>> {
    return apiRequest(`/api/users/${userId}/toggle-status/`, {
      method: 'POST',
    });
  },

  // Obtener permisos de usuario
  async getUserPermissions(userId: number): Promise<ApiResponse<UserPermissions>> {
    return apiRequest(`/api/users/${userId}/permissions/`);
  },

  // Buscar usuarios
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiRequest(`/api/users/search/?q=${encodeURIComponent(query)}`);
  },

  // Obtener estadísticas de usuarios
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiRequest('/api/users/stats/');
  },
};

// Servicios de gestión de roles
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
};

// Servicios de permisos
export interface Permission {
  codename: string;
  name: string;
  content_type: string;
}

export const permissionService = {
  // Obtener todos los permisos disponibles
  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return apiRequest('/api/permissions/');
  },

  // Obtener permisos por grupo
  async getPermissionsByGroup(): Promise<ApiResponse<Record<string, Permission[]>>> {
    return apiRequest('/api/permissions/groups/');
  },
};

// Servicios de compatibilidad
export const usersService = userService;
export const rolesService = roleService;
export const permissionsService = permissionService;
