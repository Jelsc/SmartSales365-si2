import { apiRequest } from './authService';

const BASE_URL = '/api/carrito';

export interface ItemCarrito {
  id: number;
  producto: number; // ID del producto
  producto_detalle: {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
    precio_oferta?: number | string;
    imagen?: string;
    stock: number;
  };
  variante?: number; // ID de la variante (opcional)
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
  agregado: string;
}

export interface Carrito {
  id: number;
  items: ItemCarrito[];
  total: number | string;
  total_items: number;
  subtotal: number | string;
  creado: string;
  actualizado: string;
}

export interface AgregarItemRequest {
  producto_id: number;
  cantidad: number;
  variante_id?: number;
}

export interface ActualizarItemRequest {
  cantidad: number;
}

export const carritoService = {
  /**
   * Obtener el carrito actual del usuario
   */
  async obtenerCarrito(): Promise<Carrito> {
    const response = await apiRequest<Carrito>(`${BASE_URL}/mi_carrito/`);
    return response.data!;
  },

  /**
   * Agregar un producto al carrito
   */
  async agregarItem(data: AgregarItemRequest): Promise<Carrito> {
    const response = await apiRequest<Carrito>(
      `${BASE_URL}/agregar_item/`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  },

  /**
   * Actualizar la cantidad de un item en el carrito
   */
  async actualizarItem(itemId: number, data: ActualizarItemRequest): Promise<Carrito> {
    const response = await apiRequest<{ message: string; carrito: Carrito }>(
      `${BASE_URL}/actualizar_item/${itemId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data!.carrito;
  },

  /**
   * Eliminar un item del carrito
   */
  async eliminarItem(itemId: number): Promise<Carrito> {
    const response = await apiRequest<{ message: string; carrito: Carrito }>(
      `${BASE_URL}/eliminar_item/${itemId}/`,
      {
        method: 'DELETE',
      }
    );
    return response.data!.carrito;
  },

  /**
   * Vaciar todo el carrito
   */
  async vaciarCarrito(): Promise<Carrito> {
    const response = await apiRequest<{ message: string; carrito: Carrito }>(
      `${BASE_URL}/vaciar/`,
      {
        method: 'DELETE',
      }
    );
    return response.data!.carrito;
  },
};
