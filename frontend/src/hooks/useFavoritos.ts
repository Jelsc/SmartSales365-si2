import { useState, useEffect } from 'react';
import { 
  isFavorito, 
  toggleFavorito, 
  getFavoritos, 
  contarFavoritos 
} from '@/services/favoritosService';

/**
 * Hook para manejar el estado de favoritos de un producto específico
 * @param productId - ID del producto
 */
export function useFavorito(productId: number) {
  const [esFavorito, setEsFavorito] = useState<boolean>(false);

  useEffect(() => {
    setEsFavorito(isFavorito(productId));
  }, [productId]);

  const toggle = () => {
    const nuevoEstado = toggleFavorito(productId);
    setEsFavorito(nuevoEstado);
    return nuevoEstado;
  };

  return {
    esFavorito,
    toggle,
  };
}

/**
 * Hook para manejar la lista completa de favoritos
 */
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [count, setCount] = useState<number>(0);

  const refresh = () => {
    const listaFavoritos = getFavoritos();
    setFavoritos(listaFavoritos);
    setCount(listaFavoritos.length);
  };

  useEffect(() => {
    refresh();
    
    // Listener para cambios en localStorage desde otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartsales_favoritos') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggle = (productId: number) => {
    const nuevoEstado = toggleFavorito(productId);
    refresh();
    return nuevoEstado;
  };

  const esFavorito = (productId: number) => {
    return favoritos.includes(productId);
  };

  return {
    favoritos,
    count,
    toggle,
    esFavorito,
    refresh,
  };
}
