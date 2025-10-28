// ========================================
// TIPOS DE PERSONAL
// ========================================

// Tipo principal de personal
export type Personal = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  ci: string;
  // Campos laborales
  codigo_empleado: string;
  fecha_ingreso: string;
  estado: boolean; // Cambiado a boolean
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: number; // FK a CustomUser (nullable)
  // Campos calculados/derivados
  nombre_completo: string;
  anos_antiguedad: number;
  puede_acceder_sistema: boolean;
};

// Tipos para formularios de personal
export type PersonalFormData = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date | null;
  telefono: string;
  email: string;
  ci: string;
  // Requeridos por el backend (PersonalCreateSerializer)
  codigo_empleado: string;
  fecha_ingreso: Date | null;
  // Opcionales
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
  estado?: boolean | undefined; // Cambiado de es_activo a estado
};

// Tipos para filtros de personal
export type PersonalFilters = {
  search?: string;
  estado?: boolean; // Cambiado de string a boolean
};

// Tipos para opciones de autocompletado
export type PersonalOption = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  telefono: string;
  codigo_empleado: string;
};
