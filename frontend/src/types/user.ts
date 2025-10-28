// ========================================
// TIPOS DE USUARIOS Y ROLES
// ========================================

// Tipo principal de usuario
export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
  rol?: {
    id: number;
    nombre: string;
    descripcion: string;
    es_administrativo: boolean;
    permisos: string[];
    fecha_creacion: string;
    fecha_actualizacion: string;
  };
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  // Relaciones opcionales (solo IDs)
  personal_id?: number; // ID del personal asociado
  conductor_id?: number; // ID del conductor asociado
  // Campos derivados
  puede_acceder_admin: boolean;
  es_administrativo: boolean;
  es_cliente: boolean;
  rol_nombre?: string;
  rol_obj?: {
    id: number;
    nombre: string;
    es_administrativo: boolean;
    permisos: string[];
  };
};

// Tipo para roles
export type Role = {
  id: number;
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
  permisos: string[];
  fecha_creacion: string;
  fecha_actualizacion: string;
};

// Tipos para formularios de usuario
export type UserFormData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string | undefined;
  direccion?: string | undefined;
  ci?: string | undefined;
  fecha_nacimiento?: Date | null | undefined;
  // Identificador del rol (FK), obtenido desde /api/admin/roles
  rol_id?: number | undefined;
  is_active: boolean;
  // Relaciones opcionales
  personal_id?: number | undefined;
  conductor_id?: number | undefined;
  password?: string | undefined;
  password_confirm?: string | undefined;
};

// Tipos para filtros de usuario
export type UserFilters = {
  search?: string;
  rol?: string;
  is_staff?: boolean;
  is_active?: boolean;
};

// Tipos para formularios de rol
export type RoleFormData = {
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
  permisos: string[];
};

// Tipos para filtros de rol
export type RoleFilters = {
  search?: string;
  es_administrativo?: boolean;
};

// Tipos para opciones de autocompletado
export type UserOption = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol_nombre?: string;
};
