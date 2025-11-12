// ========================================
// TIPOS DE PRODUCTOS Y CATÁLOGO
// ========================================

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  imagen?: string | null;
  activa: boolean;
  orden: number;
  productos_count?: number;
  creado: string;
  actualizado: string;
}

export interface ProductoImagen {
  id: number;
  producto: number;
  imagen: string;
  es_principal: boolean;
  orden: number;
  alt_text: string;
  creado: string;
}

export interface ProductoVariante {
  id: number;
  producto: number;
  nombre: string;
  sku: string;
  precio_adicional: number;
  stock: number;
}

export interface Producto {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  descripcion_corta?: string;
  imagen?: string | null;
  categoria: Categoria | null;
  precio: number;
  en_oferta: boolean;
  precio_oferta: number | null;
  precio_final: number;
  descuento_porcentaje: number;
  fecha_inicio_oferta?: string | null;
  fecha_fin_oferta?: string | null;
  stock: number;
  stock_minimo: number;
  meses_garantia: number;
  descripcion_garantia: string;
  sku: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  peso: number | null;
  activo: boolean;
  destacado: boolean;
  vistas: number;
  ventas: number;
  imagenes: ProductoImagen[];
  variantes: ProductoVariante[];
  creado: string;
  actualizado: string;
}

export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  descripcion_corta?: string;
  imagen?: File;
  categoria_id: number;
  precio: number;
  en_oferta?: boolean;
  precio_oferta?: number;
  descuento_porcentaje?: number;
  fecha_inicio_oferta?: Date;
  fecha_fin_oferta?: Date;
  stock: number;
  stock_minimo?: number;
  meses_garantia?: number;
  descripcion_garantia?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  peso?: number;
  activo?: boolean;
  destacado?: boolean;
}

export interface ProductoFilters {
  search?: string;
  categoria?: number;
  precio_min?: number;
  precio_max?: number;
  en_oferta?: boolean;
  destacado?: boolean;
  activo?: boolean;
  stock_min?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}
