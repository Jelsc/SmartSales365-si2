import { apiRequest } from "./authService";
import type {
  Personal,
  PersonalFormData,
  PersonalFilters,
  PaginatedResponse,
  ApiResponse,
  PersonalOption,
} from "@/types";

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: PersonalFormData) => ({
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento
    ? data.fecha_nacimiento.toISOString().split("T")[0]
    : undefined,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  codigo_empleado: data.codigo_empleado,
  fecha_ingreso: data.fecha_ingreso ? data.fecha_ingreso.toISOString().split('T')[0] : undefined,
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  estado: data.estado ?? true, // Cambiado de es_activo a estado
});

const fromDTO = (data: any): Personal => ({
  id: data.id,
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  codigo_empleado: data.codigo_empleado,
  fecha_ingreso: data.fecha_ingreso,
  estado: data.estado, // Cambiado a boolean
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  fecha_creacion: data.fecha_creacion,
  fecha_actualizacion: data.fecha_actualizacion,
  usuario: data.usuario,
  // Campos calculados/derivados
  nombre_completo: data.nombre_completo,
  anos_antiguedad: data.anos_antiguedad,
  puede_acceder_sistema: data.puede_acceder_sistema,
});

export const personalApi = {
  // Listar personal con filtros y paginación
  async list(
    filters?: PersonalFilters
  ): Promise<ApiResponse<PaginatedResponse<Personal>>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.estado !== undefined) params.append('estado', filters.estado.toString());
    const query = params.toString();
    const response = await apiRequest(
      `/api/personal/${query ? `?${query}` : ""}`
    );

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

    return response as ApiResponse<PaginatedResponse<Personal>>;
  },

  // Obtener personal por ID
  async get(id: number): Promise<ApiResponse<Personal>> {
    const response = await apiRequest(`/api/personal/${id}/`);

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Personal>;
  },

  // Crear nuevo personal
  async create(data: PersonalFormData): Promise<ApiResponse<Personal>> {
    const response = await apiRequest("/api/personal/", {
      method: "POST",
      body: JSON.stringify(toDTO(data)),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Personal>;
  },

  // Actualizar personal
  async update(
    id: number,
    data: PersonalFormData
  ): Promise<ApiResponse<Personal>> {
    const response = await apiRequest(`/api/personal/${id}/`, {
      method: "PUT",
      body: JSON.stringify(toDTO(data)),
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }

    return response as ApiResponse<Personal>;
  },

  // Eliminar personal
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/personal/${id}/`, {
      method: "DELETE",
    });
  },

  // Obtener personal disponible para autocompletado
  async getAvailable(): Promise<ApiResponse<PersonalOption[]>> {
    const response = await apiRequest(
      "/api/personal/disponibles_para_usuario/"
    );

    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          apellido: item.apellido,
          email: item.email,
          ci: item.ci,
          telefono: item.telefono,
        })),
      };
    }

    return response as ApiResponse<PersonalOption[]>;
  },

  // Obtener estadísticas
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/personal/estadisticas/');
  },
};
