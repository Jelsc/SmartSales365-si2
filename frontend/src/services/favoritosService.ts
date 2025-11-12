/**
 * Servicio para manejar los productos favoritos del usuario
 * Almacena los favoritos en localStorage por ahora
 * TODO: Migrar a backend cuando se implemente la funcionalidad de favoritos
 */

const FAVORITES_KEY = 'smartsales_favoritos';

export interface FavoritosState {
  productIds: number[];
}

/**
 * Obtiene la lista de IDs de productos favoritos
 */
export function getFavoritos(): number[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    const data: FavoritosState = JSON.parse(stored);
    return Array.isArray(data.productIds) ? data.productIds : [];
  } catch (error) {
    console.error('Error al leer favoritos:', error);
    return [];
  }
}

/**
 * Guarda la lista de favoritos en localStorage
 */
function saveFavoritos(productIds: number[]): void {
  try {
    const data: FavoritosState = { productIds };
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar favoritos:', error);
  }
}

/**
 * Verifica si un producto está en favoritos
 */
export function isFavorito(productId: number): boolean {
  const favoritos = getFavoritos();
  return favoritos.includes(productId);
}

/**
 * Agrega un producto a favoritos
 */
export function agregarFavorito(productId: number): void {
  const favoritos = getFavoritos();
  
  if (!favoritos.includes(productId)) {
    favoritos.push(productId);
    saveFavoritos(favoritos);
  }
}

/**
 * Elimina un producto de favoritos
 */
export function eliminarFavorito(productId: number): void {
  const favoritos = getFavoritos();
  const filtered = favoritos.filter(id => id !== productId);
  
  if (filtered.length !== favoritos.length) {
    saveFavoritos(filtered);
  }
}

/**
 * Alterna el estado de favorito de un producto
 * @returns true si se agregó, false si se eliminó
 */
export function toggleFavorito(productId: number): boolean {
  if (isFavorito(productId)) {
    eliminarFavorito(productId);
    return false;
  } else {
    agregarFavorito(productId);
    return true;
  }
}

/**
 * Limpia todos los favoritos
 */
export function limpiarFavoritos(): void {
  localStorage.removeItem(FAVORITES_KEY);
}

/**
 * Obtiene el número total de favoritos
 */
export function contarFavoritos(): number {
  return getFavoritos().length;
}
