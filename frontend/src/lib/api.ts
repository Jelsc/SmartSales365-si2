import axios from "axios";
import toast from "react-hot-toast";

/**
 * Detecta automáticamente la URL base de la API según el entorno.
 * - En desarrollo local SIN Nginx: usa localhost:8000
 * - En desarrollo con Nginx (https://localhost): usa misma URL sin puerto
 * - En producción/nube: usa la misma URL que el frontend (todo por Nginx)
 */
export function getApiBaseUrl(): string {
  // 1. Si hay variable de entorno explícita, úsala
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    console.info("🔧 [API] Usando URL desde variable de entorno:", envUrl);
    return envUrl;
  }

  // 2. Detección automática basada en window.location
  const { protocol, hostname, port } = window.location;
  
  // Si estamos en localhost pero con puerto estándar (80/443) → hay Nginx
  const isLocalWithNginx = (hostname === "localhost" || hostname === "127.0.0.1") && 
                           (port === "" || port === "80" || port === "443");
  
  // Si estamos en localhost con puerto no estándar (5173/5174) → sin Nginx
  const isLocalDirect = (hostname === "localhost" || hostname === "127.0.0.1") && 
                        (port === "5173" || port === "5174");
  
  if (isLocalDirect) {
    // Desarrollo local directo → backend en :8000
    const localUrl = `${protocol}//localhost:8000`;
    console.info("🏠 [API] Desarrollo local (sin Nginx) →", localUrl);
    return localUrl;
  } else if (isLocalWithNginx) {
    // Desarrollo local con Nginx → todo por Nginx
    const nginxUrl = `${protocol}//${hostname}`;
    console.info("🔒 [API] Desarrollo local (con Nginx) →", nginxUrl);
    return nginxUrl;
  } else {
    // Producción/nube → siempre por Nginx (mismo dominio/IP, sin puerto)
    const prodUrl = `${protocol}//${hostname}`;
    console.info("☁️ [API] Producción (Nginx) →", prodUrl);
    return prodUrl;
  }
}

// Crear la instancia de axios con la URL detectada automáticamente
const apiBaseUrl = getApiBaseUrl();
console.info("🎯 [API] URL final de la API:", apiBaseUrl);

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false, // pon true si usas cookies/CSRF
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail || err.message || "Error de red";
    toast.error(msg);
    return Promise.reject(err);
  }
);
