// ========================================
// TIPOS DE CONDUCTORES
// ========================================

// Tipo principal de conductor
export type Conductor = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  // Corregido: fecha_nacimiento
  telefono: string;
  email: string;
  ci: string;
  // Campos específicos de Conductor
  nro_licencia: string;
  tipo_licencia: string;
  fecha_venc_licencia: string;
  experiencia_anios: number;
  estado: 'disponible' | 'ocupado' | 'descanso' | 'inactivo'; // Nuevo campo operacional
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: number; // FK a CustomUser (nullable)
  // Campos calculados/derivados
  nombre_completo: string;
  licencia_vencida: boolean;
  dias_para_vencer_licencia: number;
  puede_conducir: boolean;
  estado_usuario: 'activo' | 'inactivo' | 'sin_usuario'; // Estado del usuario vinculado
};

// Tipos para formularios de conductor
export type ConductorFormData = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date | null;
  telefono: string;
  email: string;
  ci: string;
  nro_licencia: string;
  fecha_venc_licencia: Date | null;
  experiencia_anios: number;
  tipo_licencia: string;
  estado: 'disponible' | 'ocupado' | 'descanso' | 'inactivo'; // Nuevo campo operacional
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
};

// Tipos para filtros de conductor
export type ConductorFilters = {
  search?: string;
  estado?: 'disponible' | 'ocupado' | 'descanso' | 'inactivo';
  tipo_licencia?: string;
};

// Tipos para opciones de autocompletado
export type ConductorOption = {
  id: number;
  nombre: string; // Cambiado de personal__nombre
  apellido: string; // Cambiado de personal__apellido
  email: string; // Cambiado de personal__email
  ci: string; // Cambiado de personal__ci
  telefono: string; // Cambiado de personal__telefono
  nro_licencia: string;
};
