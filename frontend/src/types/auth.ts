// ========================================
// TIPOS DE AUTENTICACIÓN
// ========================================

// Tipos para credenciales de login
export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AdminLoginCredentials = {
  username: string;
  password: string;
};

// Tipos para registro
export type RegisterData = {
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
};

// Tipos para tokens y respuestas de autenticación
export type AuthTokens = {
  access: string;
  refresh: string;
};

export type AuthResponse = {
  access: string;
  refresh: string;
  user: User;
};

// Tipos para información de usuario
export type UserInfo = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  es_administrativo: boolean;
  es_cliente: boolean;
  puede_acceder_admin: boolean;
  rol?: {
    id: number;
    nombre: string;
    es_administrativo: boolean;
    permisos: string[];
  };
};

// Tipos para datos del dashboard
export type DashboardData = {
  tipo_usuario: string;
  permisos: string[];
  estadisticas: {
    total_usuarios: number;
    usuarios_activos: number;
    usuarios_inactivos: number;
  };
};

// Tipos para respuestas de API
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T | null;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Importar User desde user.ts para evitar dependencias circulares
import type { User } from './user';
