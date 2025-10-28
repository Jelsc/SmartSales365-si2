import { apiRequest } from './authService';
import type {
  User,
  UserFormData,
  UserFilters,
  PaginatedResponse,
  ApiResponse,
  Role,
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: UserFormData) => ({
  username: data.username,
  email: data.email,
  first_name: data.first_name,
  last_name: data.last_name,
  telefono: data.telefono,
  direccion: data.direccion,
  ci: data.ci,
  fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.toISOString().split('T')[0] : undefined,
  rol_id: data.rol_id,
  is_active: data.is_active, // Unificado con es_activo
  personal_id: data.personal_id, // Usar personal_id directamente
  conductor_id: data.conductor_id, // Usar conductor_id directamente
  password: data.password,
  password_confirm: data.password_confirm,
});

const fromDTO = (data: any): User => ({
  id: data.id,
  username: data.username,
  email: data.email,
  first_name: data.first_name,
  last_name: data.last_name,
  telefono: data.telefono,
  direccion: data.direccion,
  ci: data.ci,
  fecha_nacimiento: data.fecha_nacimiento,
  rol: data.rol,
  is_superuser: data.is_superuser,
  is_active: data.is_active, // Unificado con es_activo
  date_joined: data.date_joined,
  last_login: data.last_login,
  // Relaciones opcionales (solo IDs)
  personal_id: data.personal_id,
  conductor_id: data.conductor_id,
  // Campos derivados
  puede_acceder_admin: data.puede_acceder_admin,
  es_administrativo: data.es_administrativo,
  es_cliente: data.es_cliente,
  rol_nombre: data.rol_nombre,
  rol_obj: data.rol_obj,
});

// Nota: las opciones de roles se obtienen desde la API. No hardcodear IDs.

export const usuariosApi = {
  // Listar usuarios con filtros y paginación
  async list(filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    // Filtrar por nombre de rol (requiere soporte BE: filterset_fields=['rol__nombre'])
    if (filters?.rol) params.append('rol__nombre', filters.rol);
    if (filters?.is_staff !== undefined) params.append('is_staff', filters.is_staff.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    
    const query = params.toString();
    const response = await apiRequest(`/api/admin/users/${query ? `?${query}` : ''}`);
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          results: data.results.map(fromDTO),
        },
      };
    }
    
    return response as ApiResponse<PaginatedResponse<User>>;
  },

  // Obtener usuario por ID
  async get(id: number): Promise<ApiResponse<User>> {
    const response = await apiRequest(`/api/admin/users/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<User>;
  },

  // Crear nuevo usuario
  async create(data: UserFormData): Promise<ApiResponse<User>> {
    const response = await apiRequest('/api/admin/users/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<User>;
  },

  // Actualizar usuario
  async update(id: number, data: UserFormData): Promise<ApiResponse<User>> {
    const response = await apiRequest(`/api/admin/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<User>;
  },

  // Eliminar usuario
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/admin/users/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener roles disponibles
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiRequest('/api/admin/roles/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.results || data,
      };
    }
    
    return response as ApiResponse<Role[]>;
  },

  // Obtener personal disponible para autocompletado
  async getPersonalDisponible(): Promise<ApiResponse<Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>>> {
    const response = await apiRequest('/api/admin/users/personal_disponible/');
    return response as ApiResponse<Array<{
      id: number;
      nombre: string;
      apellido: string;
      email: string;
      ci: string;
      telefono: string;
    }>>;
  },

  // Obtener conductores disponibles para autocompletado
  async getConductoresDisponibles(): Promise<ApiResponse<Array<{
    id: number;
    nombre: string; // Cambiado de personal__nombre
    apellido: string; // Cambiado de personal__apellido
    email: string; // Cambiado de personal__email
    ci: string; // Cambiado de personal__ci
    telefono: string; // Cambiado de personal__telefono
    nro_licencia: string;
  }>>> {
    const response = await apiRequest('/api/admin/users/conductores_disponibles/');
    return response as ApiResponse<Array<{
      id: number;
      nombre: string;
      apellido: string;
      email: string;
      ci: string;
      telefono: string;
      nro_licencia: string;
    }>>;
  },

  // Activar/desactivar usuario
  async toggleStatus(id: number, is_active: boolean): Promise<ApiResponse> {
    return apiRequest(`/api/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }), // Cambiado de es_activo a is_active
    });
  },
};
