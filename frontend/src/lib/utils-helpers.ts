import { getApiBaseUrl } from './api';

/**
 * Convierte una ruta de imagen relativa del backend en una URL completa
 * @param imagePath - Ruta de la imagen del backend (puede ser relativa o absoluta)
 * @returns URL completa de la imagen o placeholder si no hay imagen
 */
export function getImageUrl(imagePath?: string | null): string {
  // Si no hay imagen, retornar placeholder
  if (!imagePath) {
    return '/placeholder-product.svg';
  }

  // Si ya es una URL completa (http/https), retornarla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si es una ruta relativa, combinarla con la URL base de la API
  const baseUrl = getApiBaseUrl();
  
  // Asegurarse de que la ruta comience con /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
}

/**
 * Obtiene la URL completa actual del sitio para compartir
 * @returns URL completa del sitio (protocolo + hostname + puerto si aplica)
 */
export function getSiteUrl(): string {
  const { protocol, hostname, port } = window.location;
  
  // Si el puerto es 80 (http) o 443 (https), no incluirlo en la URL
  const shouldIncludePort = port && port !== '80' && port !== '443';
  const portPart = shouldIncludePort ? `:${port}` : '';
  
  return `${protocol}//${hostname}${portPart}`;
}

/**
 * Copia texto al portapapeles y muestra un mensaje
 * @param text - Texto a copiar
 * @param successMessage - Mensaje de éxito (opcional)
 */
export async function copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
  try {
    // Intentar usar la API moderna de clipboard
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores antiguos o contextos no seguros
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      
      if (!successful) {
        throw new Error('No se pudo copiar al portapapeles');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
}

/**
 * Comparte contenido usando la Web Share API o copia al portapapeles como fallback
 * @param data - Datos a compartir (título, texto, url)
 */
export async function shareContent(data: {
  title: string;
  text?: string;
  url: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  // Intentar usar la API nativa de compartir (disponible en móviles principalmente)
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      // El usuario canceló o hubo un error
      if ((error as Error).name === 'AbortError') {
        return 'failed';
      }
      console.error('Error al compartir:', error);
    }
  }
  
  // Fallback: copiar URL al portapapeles
  const success = await copyToClipboard(data.url);
  return success ? 'copied' : 'failed';
}
