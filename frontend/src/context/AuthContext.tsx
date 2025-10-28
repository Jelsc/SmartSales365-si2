import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import {
  authService,
  registrationService,
  profileService,
  ApiError,
} from "@/services/authService";
import { tokenUtils } from "@/lib/tokenUtils";
import { type User } from "@/types";

// Tipos para el contexto
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Funciones de autenticación unificada
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (googleData: {
    username: string;
    password: string;
    isGoogleAuth: boolean;
    googleToken: string;
  }) => Promise<void>;
  register: (userData: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
    telefono?: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  error: null,
};

// Tipos de acciones
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; isAdmin: boolean } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}


// Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = tokenUtils.getAccessToken();
    const user = tokenUtils.getStoredUser();

    if (!token || !user) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    // Verificar si el token está expirado
    if (tokenUtils.isTokenExpired(token)) {
      const refreshToken = tokenUtils.getRefreshToken();
      if (refreshToken) {
        try {
          await refreshAuthToken();
        } catch {
          tokenUtils.clearTokens();
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        tokenUtils.clearTokens();
        dispatch({ type: "SET_LOADING", payload: false });
      }
      return;
    }

    // Usuario autenticado
    dispatch({
      type: "AUTH_SUCCESS",
      payload: {
        user,
        isAdmin: user.es_administrativo || false,
      },
    });
  };

  const refreshAuthToken = async () => {
    const refreshToken = tokenUtils.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    try {
      const response = await authService.refreshToken(refreshToken);
      if (response.success && response.data) {
        const newTokens = {
          access: response.data.access,
          refresh: refreshToken,
        };
        tokenUtils.saveTokens(newTokens);
      }
    } catch (error) {
      throw error;
    }
  };

  // Login universal para clientes
  const login = async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.login({
        email,
        password,
        rememberMe,
      });

      if (response.success && response.data) {
        // Guardar tokens
        if (response.data) {
          tokenUtils.saveTokens(response.data);
        }

        // Obtener información del usuario
        const userResponse = await authService.getUserInfo();

        if (userResponse.success && userResponse.data) {
          const user = userResponse.data;
          if (response.data) {
            tokenUtils.saveTokens({ ...response.data, user });
          }

          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user,
              isAdmin: user.es_administrativo || false,
            },
          });
        } else {
          throw new Error("Error al obtener información del usuario");
        }
      } else {
        throw new Error(response.error || "Error en el login");
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Error de conexión";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Login para administradores
  const adminLogin = async (username: string, password: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.login({
        username,
        password,
      });

      if (response.success && response.data) {
        // Guardar tokens
        if (response.data) {
          tokenUtils.saveTokens(response.data);
        }

        // Obtener información del usuario
        const userResponse = await authService.getUserInfo();

        if (userResponse.success && userResponse.data) {
          const user = userResponse.data;
          if (response.data) {
            tokenUtils.saveTokens({ ...response.data, user });
          }

          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user,
              isAdmin: user.es_administrativo || false,
            },
          });
        } else {
          throw new Error("Error al obtener información del usuario");
        }
      } else {
        throw new Error(response.error || "Error en el login");
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Error de conexión";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Login con Google
  const loginWithGoogle = async (googleData: {
    username: string;
    password: string;
    isGoogleAuth: boolean;
    googleToken: string;
  }) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await registrationService.googleAuth(googleData.googleToken);

      if (response.success && response.data) {
        // Guardar tokens
        if (response.data) {
          tokenUtils.saveTokens(response.data);
        }

        // Obtener información del usuario
        const userResponse = await authService.getUserInfo();

        if (userResponse.success && userResponse.data) {
          const user = userResponse.data;
          if (response.data) {
            tokenUtils.saveTokens({ ...response.data, user });
          }

          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user,
              isAdmin: user.es_administrativo || false,
            },
          });
        } else {
          throw new Error("Error al obtener información del usuario");
        }
      } else {
        throw new Error(response.error || "Error en el login con Google");
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Error de conexión";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Registro de clientes
  const register = async (userData: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
    telefono?: string;
  }) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await registrationService.registerClient(userData);

      if (response.success && response.data) {
        // El registro exitoso no significa login automático
        // El usuario debe verificar su email
        dispatch({ type: "SET_LOADING", payload: false });
      } else {
        throw new Error(response.error || "Error en el registro");
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Error de conexión";
      dispatch({ type: "AUTH_FAILURE", payload: errorMessage });
      throw error;
    }
  };

  // Logout universal
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      tokenUtils.clearTokens();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Limpiar errores
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Refrescar información del usuario
  const refreshUser = async () => {
    try {
      const response = await authService.getUserInfo();
      if (response.success && response.data) {
        const user = response.data;
        const accessToken = tokenUtils.getAccessToken();
        const refreshToken = tokenUtils.getRefreshToken();
        if (accessToken && refreshToken) {
          tokenUtils.saveTokens({ 
            access: accessToken,
            refresh: refreshToken,
            user 
          });
        }

        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user,
            isAdmin: user.es_administrativo || false,
          },
        });
      }
    } catch (error) {
      console.error("Error al refrescar usuario:", error);
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    adminLogin,
    loginWithGoogle,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}