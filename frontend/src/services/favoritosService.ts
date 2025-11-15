/**
 * Servicio para manejar los productos favoritos del usuario
 * Integrado con el backend de Django
 */

import { apiRequest } from './authService';

export interface Favorito {
  id: number;
  producto: {
    id: number;
    nombre: string;
    slug: string;
    precio: string;
    precio_final: string;
    imagen: string | null;
    imagen_principal: string | null;
    categoria_nombre: string;
    tiene_stock: boolean;
    en_oferta: boolean;
  };
  creado: string;
}

export interface FavoritosResponse {
  results: Favorito[];
}

const BASE_URL = '/api/favoritos';

/**
 * Servicio de favoritos
 */
export const favoritosService = {
  /**
   * Obtener todos los favoritos del usuario
   */
  async getFavoritos(): Promise<Favorito[]> {
    try {
      const response = await apiRequest<Favorito[]>(`${BASE_URL}/mis_favoritos/`);
      return response.data!;
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      throw error;
    }
  },

  /**
   * Agregar un producto a favoritos
   */
  async agregarFavorito(productId: number): Promise<Favorito> {
    try {
      const response = await apiRequest<Favorito>(`${BASE_URL}/`, {
        method: 'POST',
        body: JSON.stringify({ producto_id: productId }),
      });
      return response.data!;
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      throw error;
    }
  },

  /**
   * Eliminar un producto de favoritos
   */
  async eliminarFavorito(productId: number): Promise<void> {
    try {
      await apiRequest(`${BASE_URL}/eliminar/`, {
        method: 'POST',
        body: JSON.stringify({ producto_id: productId }),
      });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      throw error;
    }
  },

  /**
   * Eliminar favorito por ID
   */
  async eliminarFavoritoPorId(favoritoId: number): Promise<void> {
    try {
      await apiRequest(`${BASE_URL}/${favoritoId}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      throw error;
    }
  },

  /**
   * Alternar el estado de favorito de un producto
   * @returns true si se agregó, false si se eliminó
   */
  async toggleFavorito(productId: number): Promise<boolean> {
    try {
      const response = await apiRequest<{ agregado: boolean; mensaje?: string }>(`${BASE_URL}/toggle/`, {
        method: 'POST',
        body: JSON.stringify({ producto_id: productId }),
      });
      // El backend devuelve { agregado: true/false } o { agregado: false, mensaje: ... }
      return response.data?.agregado ?? false;
    } catch (error: any) {
      console.error('Error al alternar favorito:', error);
      console.error('Detalles del error:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  },

  /**
   * Verificar si un producto está en favoritos
   */
  async isFavorito(productId: number): Promise<boolean> {
    try {
      const response = await apiRequest<{ es_favorito: boolean }>(`${BASE_URL}/${productId}/verificar/`);
      return response.data!.es_favorito;
    } catch (error) {
      console.error('Error al verificar favorito:', error);
      return false;
    }
  },

  /**
   * Obtener el número total de favoritos
   */
  async contarFavoritos(): Promise<number> {
    try {
      const favoritos = await this.getFavoritos();
      return favoritos.length;
    } catch (error) {
      console.error('Error al contar favoritos:', error);
      return 0;
    }
  },
};

// Funciones de compatibilidad para mantener la API anterior
export function getFavoritos(): Promise<number[]> {
  return favoritosService.getFavoritos().then(favoritos => 
    favoritos.map(f => f.producto.id)
  );
}

export function agregarFavorito(productId: number): Promise<void> {
  return favoritosService.agregarFavorito(productId).then(() => {});
}

export function eliminarFavorito(productId: number): Promise<void> {
  return favoritosService.eliminarFavorito(productId);
}

export async function isFavorito(productId: number): Promise<boolean> {
  return await favoritosService.isFavorito(productId);
}

export function toggleFavorito(productId: number): Promise<boolean> {
  return favoritosService.toggleFavorito(productId);
}

export async function contarFavoritos(): Promise<number> {
  return await favoritosService.contarFavoritos();
}

export function limpiarFavoritos(): void {
  // Ya no se usa localStorage, pero mantenemos la función para compatibilidad
  console.warn('limpiarFavoritos() ya no está disponible. Use eliminarFavorito() para cada favorito.');
}
