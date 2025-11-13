import { apiRequest } from './authService';
import type {
  Producto,
  ProductoFormData,
  ProductoFilters,
  Categoria,
  ProductoImagen,
  ProductoVariante,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: ProductoFormData) => ({
  nombre: data.nombre,
  descripcion: data.descripcion,
  descripcion_corta: data.descripcion_corta,
  categoria: data.categoria_id,
  precio: data.precio,
  en_oferta: data.en_oferta || false,
  precio_oferta: data.precio_oferta,
  descuento_porcentaje: data.descuento_porcentaje || 0,
  fecha_inicio_oferta: data.fecha_inicio_oferta?.toISOString(),
  fecha_fin_oferta: data.fecha_fin_oferta?.toISOString(),
  stock: data.stock,
  stock_minimo: data.stock_minimo || 5,
  meses_garantia: data.meses_garantia || 12,
  descripcion_garantia: data.descripcion_garantia,
  sku: data.sku,
  codigo_barras: data.codigo_barras,
  marca: data.marca,
  modelo: data.modelo,
  peso: data.peso,
  activo: data.activo ?? true,
  destacado: data.destacado ?? false,
});

const fromDTO = (data: any): Producto => ({
  id: data.id,
  nombre: data.nombre,
  slug: data.slug,
  descripcion: data.descripcion,
  descripcion_corta: data.descripcion_corta,
  imagen: data.imagen,
  categoria: data.categoria,
  precio: parseFloat(data.precio),
  en_oferta: data.en_oferta,
  precio_oferta: data.precio_oferta ? parseFloat(data.precio_oferta) : null,
  precio_final: parseFloat(data.precio_final),
  descuento_porcentaje: data.descuento_porcentaje,
  fecha_inicio_oferta: data.fecha_inicio_oferta,
  fecha_fin_oferta: data.fecha_fin_oferta,
  stock: data.stock,
  stock_minimo: data.stock_minimo,
  meses_garantia: data.meses_garantia,
  descripcion_garantia: data.descripcion_garantia,
  sku: data.sku,
  codigo_barras: data.codigo_barras,
  marca: data.marca,
  modelo: data.modelo,
  peso: data.peso ? parseFloat(data.peso) : null,
  activo: data.activo,
  destacado: data.destacado,
  vistas: data.vistas,
  ventas: data.ventas,
  imagenes: data.imagenes || [],
  variantes: data.variantes || [],
  creado: data.creado,
  actualizado: data.actualizado,
});

const categoriaFromDTO = (data: any): Categoria => ({
  id: data.id,
  nombre: data.nombre,
  slug: data.slug,
  descripcion: data.descripcion,
  imagen: data.imagen,
  activa: data.activa,
  orden: data.orden,
  productos_count: data.productos_count || 0,
  creado: data.creado,
  actualizado: data.actualizado,
});

// Servicio de Productos
export const productosService = {
  // Listar productos con filtros y paginación
  async getAll(filters?: ProductoFilters): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoria) params.append('categoria', filters.categoria.toString());
    if (filters?.precio_min) params.append('precio_min', filters.precio_min.toString());
    if (filters?.precio_max) params.append('precio_max', filters.precio_max.toString());
    if (filters?.en_oferta !== undefined) params.append('en_oferta', filters.en_oferta.toString());
    if (filters?.destacado !== undefined) params.append('destacado', filters.destacado.toString());
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.stock_min) params.append('stock_min', filters.stock_min.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const url = `/api/productos/${queryString ? `?${queryString}` : ''}`;
    
    const { data } = await apiRequest<PaginatedResponse<any>>(url);
    if (!data) throw new Error('No se pudo obtener los productos');
    
    return {
      ...data,
      results: data.results.map(fromDTO),
    };
  },

  // Obtener un producto por ID (incluye imágenes y variantes)
  async getById(id: number): Promise<Producto> {
    const { data } = await apiRequest<any>(`/api/productos/${id}/`);
    if (!data) throw new Error('No se pudo obtener el producto');
    return fromDTO(data);
  },

  // Crear un producto
  async create(data: ProductoFormData): Promise<Producto> {
    let body: FormData | string;
    
    // Si hay imagen, usar FormData
    if (data.imagen && data.imagen instanceof File) {
      const formData = new FormData();
      const dto = toDTO(data);
      
      // Agregar todos los campos al FormData
      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Agregar la imagen
      formData.append('imagen', data.imagen);
      body = formData;
    } else {
      body = JSON.stringify(toDTO(data));
    }

    const { data: responseData } = await apiRequest<any>('/api/productos/', {
      method: 'POST',
      body,
    });
    if (!responseData) throw new Error('No se pudo crear el producto');
    return fromDTO(responseData);
  },

  // Actualizar un producto
  async update(id: number, data: Partial<ProductoFormData>): Promise<Producto> {
    let body: FormData | string;
    
    // Si hay imagen, usar FormData
    if (data.imagen && data.imagen instanceof File) {
      const formData = new FormData();
      const dto = toDTO(data as ProductoFormData);
      
      // Agregar todos los campos al FormData
      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Agregar la imagen
      formData.append('imagen', data.imagen);
      body = formData;
    } else {
      body = JSON.stringify(toDTO(data as ProductoFormData));
    }

    const { data: responseData } = await apiRequest<any>(`/api/productos/${id}/`, {
      method: 'PATCH',
      body,
    });
    if (!responseData) throw new Error('No se pudo actualizar el producto');
    return fromDTO(responseData);
  },

  // Eliminar un producto
  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/productos/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener productos destacados
  async getDestacados(): Promise<Producto[]> {
    const { data } = await apiRequest<any[]>('/api/productos/destacados/');
    if (!data) throw new Error('No se pudo obtener los productos destacados');
    return data.map(fromDTO);
  },

  // Obtener productos en oferta
  async getOfertas(): Promise<Producto[]> {
    const { data } = await apiRequest<any[]>('/api/productos/ofertas/');
    if (!data) throw new Error('No se pudo obtener las ofertas');
    return data.map(fromDTO);
  },

  // Búsqueda inteligente de productos
  async buscar(query: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    const { data } = await apiRequest<any>(`/api/productos/buscar/?${params.toString()}`);
    if (!data) throw new Error('No se pudo realizar la búsqueda');
    
    return {
      count: data.count,
      next: data.next || null,
      previous: data.previous || null,
      results: data.results.map(fromDTO),
    };
  },

  // Obtener productos por categoría
  async porCategoria(categoriaId: number, filters?: ProductoFilters): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams({ categoria_id: categoriaId.toString() });
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const { data } = await apiRequest<PaginatedResponse<any>>(
      `/api/productos/por_categoria/?${params.toString()}`
    );
    if (!data) throw new Error('No se pudo obtener los productos');
    
    return {
      ...data,
      results: data.results.map(fromDTO),
    };
  },
};

// Servicio de Categorías
export const categoriasService = {
  // Listar todas las categorías
  async getAll(): Promise<Categoria[]> {
    const { data } = await apiRequest<any>('/api/categorias/?page_size=100');
    if (!data) throw new Error('No se pudo obtener las categorías');
    
    // Manejar respuesta paginada o array directo
    const items = Array.isArray(data) ? data : (data.results || []);
    return items.map(categoriaFromDTO);
  },

  // Obtener una categoría por ID
  async getById(id: number): Promise<Categoria> {
    const { data } = await apiRequest<any>(`/api/categorias/${id}/`);
    if (!data) throw new Error('No se pudo obtener la categoría');
    return categoriaFromDTO(data);
  },

  // Crear una categoría
  async create(categoriaData: any): Promise<Categoria> {
    // Si hay imagen, usar FormData
    if (categoriaData.imagen instanceof File) {
      const formData = new FormData();
      formData.append('nombre', categoriaData.nombre);
      formData.append('descripcion', categoriaData.descripcion || '');
      formData.append('activa', categoriaData.activa !== undefined ? categoriaData.activa.toString() : 'true');
      formData.append('orden', categoriaData.orden?.toString() || '0');
      formData.append('imagen', categoriaData.imagen);

      const { data } = await apiRequest<any>('/api/categorias/', {
        method: 'POST',
        body: formData,
      });
      if (!data) throw new Error('No se pudo crear la categoría');
      return categoriaFromDTO(data);
    }
    
    // Sin imagen, usar JSON
    const payload = {
      nombre: categoriaData.nombre,
      descripcion: categoriaData.descripcion || '',
      activa: categoriaData.activa !== undefined ? categoriaData.activa : true,
      orden: categoriaData.orden || 0,
    };

    const { data } = await apiRequest<any>('/api/categorias/', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!data) throw new Error('No se pudo crear la categoría');
    return categoriaFromDTO(data);
  },

  // Actualizar una categoría
  async update(id: number, categoriaData: Partial<any>): Promise<Categoria> {
    // Si hay imagen, usar FormData
    if (categoriaData.imagen instanceof File) {
      const formData = new FormData();
      
      if (categoriaData.nombre) formData.append('nombre', categoriaData.nombre);
      if (categoriaData.descripcion !== undefined) formData.append('descripcion', categoriaData.descripcion);
      if (categoriaData.activa !== undefined) formData.append('activa', categoriaData.activa.toString());
      if (categoriaData.orden !== undefined) formData.append('orden', categoriaData.orden.toString());
      formData.append('imagen', categoriaData.imagen);

      const { data } = await apiRequest<any>(`/api/categorias/${id}/`, {
        method: 'PATCH',
        body: formData,
      });
      if (!data) throw new Error('No se pudo actualizar la categoría');
      return categoriaFromDTO(data);
    }
    
    // Sin imagen, usar JSON
    const payload: any = {};
    if (categoriaData.nombre) payload.nombre = categoriaData.nombre;
    if (categoriaData.descripcion !== undefined) payload.descripcion = categoriaData.descripcion;
    if (categoriaData.activa !== undefined) payload.activa = categoriaData.activa;
    if (categoriaData.orden !== undefined) payload.orden = categoriaData.orden;

    const { data } = await apiRequest<any>(`/api/categorias/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!data) throw new Error('No se pudo actualizar la categoría');
    return categoriaFromDTO(data);
  },

  // Eliminar una categoría
  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/categorias/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Servicio de Imágenes de Productos
export const productoImagenesService = {
  // Listar imágenes de un producto
  async getByProducto(productoId: number): Promise<ProductoImagen[]> {
    const { data } = await apiRequest<any[]>(`/api/imagenes/?producto=${productoId}`);
    if (!data) throw new Error('No se pudo obtener las imágenes');
    return data;
  },

  // Subir una imagen
  async upload(productoId: number, imagen: File, orden?: number, esPrincipal?: boolean): Promise<ProductoImagen> {
    const formData = new FormData();
    formData.append('producto', productoId.toString());
    formData.append('imagen', imagen);
    if (orden !== undefined) formData.append('orden', orden.toString());
    if (esPrincipal !== undefined) formData.append('es_principal', esPrincipal.toString());

    const { data } = await apiRequest<ProductoImagen>('/api/imagenes/', {
      method: 'POST',
      body: formData,
      headers: {}, // Dejar que el navegador establezca el Content-Type con boundary
    });
    if (!data) throw new Error('No se pudo subir la imagen');
    return data;
  },

  // Eliminar una imagen
  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/imagenes/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Servicio de Variantes de Productos
export const productoVariantesService = {
  // Listar variantes de un producto
  async getByProducto(productoId: number): Promise<ProductoVariante[]> {
    const { data } = await apiRequest<any[]>(`/api/variantes/?producto=${productoId}`);
    if (!data) throw new Error('No se pudo obtener las variantes');
    return data;
  },

  // Crear una variante
  async create(data: {
    producto: number;
    nombre: string;
    sku: string;
    precio_adicional?: number;
    stock: number;
  }): Promise<ProductoVariante> {
    const { data: responseData } = await apiRequest<ProductoVariante>('/api/variantes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!responseData) throw new Error('No se pudo crear la variante');
    return responseData;
  },

  // Actualizar una variante
  async update(id: number, data: Partial<ProductoVariante>): Promise<ProductoVariante> {
    const { data: responseData } = await apiRequest<ProductoVariante>(`/api/variantes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!responseData) throw new Error('No se pudo actualizar la variante');
    return responseData;
  },

  // Eliminar una variante
  async delete(id: number): Promise<void> {
    await apiRequest<void>(`/api/variantes/${id}/`, {
      method: 'DELETE',
    });
  },
};
