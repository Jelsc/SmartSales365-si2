import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { carritoService, type Carrito } from '@/services/carritoService';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface CartState {
  carrito: Carrito | null;
  loading: boolean;
  itemsCount: number;
}

type CartAction =
  | { type: 'SET_CARRITO'; payload: Carrito }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CARRITO' };

interface CartContextType extends CartState {
  agregarProducto: (productoId: number, cantidad?: number, varianteId?: number) => Promise<void>;
  actualizarCantidad: (itemId: number, cantidad: number) => Promise<void>;
  eliminarItem: (itemId: number) => Promise<void>;
  vaciarCarrito: () => Promise<void>;
  refrescarCarrito: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_CARRITO':
      return {
        ...state,
        carrito: action.payload,
        itemsCount: action.payload.total_items,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CLEAR_CARRITO':
      return {
        carrito: null,
        loading: false,
        itemsCount: 0,
      };
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    carrito: null,
    loading: false,
    itemsCount: 0,
  });

  // Cargar carrito al iniciar si el usuario está autenticado
  const refrescarCarrito = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CARRITO' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const carrito = await carritoService.obtenerCarrito();
      dispatch({ type: 'SET_CARRITO', payload: carrito });
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refrescarCarrito();
  }, [refrescarCarrito]);

  const agregarProducto = async (productoId: number, cantidad: number = 1, varianteId?: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const carrito = await carritoService.agregarItem({ 
        producto_id: productoId, 
        cantidad,
        ...(varianteId && { variante_id: varianteId })
      });
      dispatch({ type: 'SET_CARRITO', payload: carrito });
      toast.success('Producto agregado al carrito');
    } catch (error: any) {
      console.error('Error al agregar producto:', error);
      toast.error(error.message || 'Error al agregar producto al carrito');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const actualizarCantidad = async (itemId: number, cantidad: number) => {
    if (cantidad < 1) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const carrito = await carritoService.actualizarItem(itemId, { cantidad });
      dispatch({ type: 'SET_CARRITO', payload: carrito });
      toast.success('Cantidad actualizada');
    } catch (error: any) {
      console.error('Error al actualizar cantidad:', error);
      toast.error(error.message || 'Error al actualizar cantidad');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const eliminarItem = async (itemId: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const carrito = await carritoService.eliminarItem(itemId);
      dispatch({ type: 'SET_CARRITO', payload: carrito });
      toast.success('Producto eliminado del carrito');
    } catch (error: any) {
      console.error('Error al eliminar item:', error);
      toast.error(error.message || 'Error al eliminar producto');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const vaciarCarrito = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const carrito = await carritoService.vaciarCarrito();
      dispatch({ type: 'SET_CARRITO', payload: carrito });
      toast.success('Carrito vaciado');
    } catch (error: any) {
      console.error('Error al vaciar carrito:', error);
      toast.error(error.message || 'Error al vaciar carrito');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        agregarProducto,
        actualizarCantidad,
        eliminarItem,
        vaciarCarrito,
        refrescarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
