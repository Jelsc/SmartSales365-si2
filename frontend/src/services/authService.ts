import { tokenUtils } from "@/lib/tokenUtils";
import { getApiBaseUrl } from "@/lib/api";

// Configuración base de la API con detección automática
const API_BASE_URL = getApiBaseUrl();

// Tipos de datos para autenticación
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  es_administrativo: boolean;
  es_cliente: boolean;
  puede_acceder_admin: boolean;
  personal?: number;
  conductor?: number;
  rol?: {
    id: number;
    nombre: string;
    descripcion: string;
    es_administrativo: boolean;
    permisos: string[];
    fecha_creacion: string;
    fecha_actualizacion: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminLoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;
  telefono?: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// Clase para manejar errores de API
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// Función para hacer peticiones HTTP
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Agregar token de autenticación si existe
  const token = localStorage.getItem("access_token");
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Intentar obtener el contenido de error si existe
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: "Error en la petición" };
      }
      
      throw new ApiError(
        errorData.error || errorData.message || "Error en la petición",
        response.status,
        errorData
      );
    }

    // Para respuestas 204 (No Content) o respuestas vacías, no intentar parsear JSON
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {
        success: true,
        data: null,
      };
    }

    // Intentar parsear JSON solo si hay contenido
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Error de conexión", 0, { originalError: error });
  }
}

// Servicios de autenticación unificada
export const authService = {
  // Login universal (clientes y administradores)
  async login(credentials: LoginCredentials | AdminLoginCredentials): Promise<ApiResponse<AuthTokens>> {
    return apiRequest("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Logout universal
  async logout(): Promise<ApiResponse> {
    const refreshToken = tokenUtils.getRefreshToken();
    return apiRequest("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },

  // Obtener información del usuario
  async getUserInfo(): Promise<ApiResponse<User>> {
    return apiRequest("/api/auth/user-info/");
  },

  // Obtener datos del dashboard
  async getDashboardData(): Promise<ApiResponse<{
    tipo_usuario: string;
    permisos: string[];
    estadisticas: {
      total_usuarios: number;
      usuarios_activos: number;
      usuarios_inactivos: number;
    };
  }>> {
    return apiRequest("/api/auth/dashboard-data/");
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access: string }>> {
    return apiRequest("/api/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },

  // Verificar email
  async verifyEmail(verificationKey: string): Promise<ApiResponse> {
    return apiRequest("/api/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ key: verificationKey }),
    });
  },

  // Reenviar verificación de email
  async resendEmailVerification(): Promise<ApiResponse> {
    return apiRequest("/api/auth/resend-email-verification/", {
      method: "POST",
    });
  },
};

// Servicios de registro diferenciado
export const registrationService = {
  // Registro de cliente
  async registerClient(userData: RegisterData): Promise<ApiResponse<User>> {
    return apiRequest("/api/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Crear administrador (solo para superusuarios)
  async createAdmin(userData: RegisterData): Promise<ApiResponse<User>> {
    return apiRequest("/api/admin/create/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Autenticación con Google
  async googleAuth(accessToken: string): Promise<ApiResponse<AuthTokens>> {
    return apiRequest("/api/google/", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    });
  },

  // Verificar código de verificación
  async verifyCode(code: string): Promise<ApiResponse> {
    return apiRequest("/api/verify/", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  // Reenviar código de verificación
  async resendCode(): Promise<ApiResponse> {
    return apiRequest("/api/resend-code/", {
      method: "POST",
    });
  },
};

// Servicios de perfil y configuración
export const profileService = {
  // Obtener perfil del usuario
  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest("/api/profile/");
  },

  // Actualizar perfil
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest("/api/profile/", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // Cambiar contraseña
  async changePassword(passwordData: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<ApiResponse> {
    return apiRequest("/api/change-password/", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },
};

// Servicios de compatibilidad (para mantener funcionalidad existente)
export const clientAuthService = authService;
export const adminAuthService = authService;
