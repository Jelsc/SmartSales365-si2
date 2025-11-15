import { apiRequest } from './authService';
import { getApiBaseUrl } from '@/lib/api';

export interface ParametrosReporte {
  tipo: string;
  formato: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  agrupacion: string[];
  filtros: Record<string, any>;
  campos: string[];
  raw_prompt: string;
}

export interface DatosReporte {
  datos: Record<string, any>[];
  columnas: string[];
  titulo: string;
  subtitulo: string;
  total_registros: number;
  parametros: ParametrosReporte;
}

export interface RespuestaMultiReporte {
  reportes: DatosReporte[];
  cantidad_reportes: number;
}

export interface InterpretacionReporte {
  parametros: ParametrosReporte;
  interpretacion: string[];
  prompt_original: string;
}

export interface ArchivoDescarga {
  blob: Blob;
  filename: string;
}

class ReportesService {
  /**
   * Generar un reporte desde un prompt de texto
   */
  async generarReporte(prompt: string, formato?: 'pantalla' | 'pdf' | 'excel'): Promise<DatosReporte | RespuestaMultiReporte | ArchivoDescarga> {
    
    const body: any = { prompt };
    if (formato) {
      body.formato = formato;
    }

    // Si es PDF o Excel, retornar Blob con metadata
    if (formato === 'pdf' || formato === 'excel') {
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/reportes/generar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(body)
      });


      if (!response.ok) {
        let errorMsg = 'Error al generar reporte';
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      // Extraer nombre de archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `reporte_${new Date().getTime()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      return { blob, filename };
    }

    // Si es pantalla, retornar JSON usando apiRequest (que ya incluye la base URL)
    const response = await apiRequest<{ reporte?: DatosReporte; reportes?: DatosReporte[]; cantidad_reportes?: number }>(
      '/api/reportes/generar/',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    // Si hay múltiples reportes, retornar la estructura completa
    if (response.data!.reportes && response.data!.cantidad_reportes) {
      return {
        reportes: response.data!.reportes,
        cantidad_reportes: response.data!.cantidad_reportes
      };
    }

    // Si es un solo reporte, retornarlo directamente
    return response.data!.reporte!;
  }

  /**
   * Interpretar un prompt sin generar el reporte
   */
  async interpretarPrompt(prompt: string): Promise<InterpretacionReporte> {
    const response = await apiRequest<InterpretacionReporte>(
      '/api/reportes/interpretar/',
      {
        method: 'POST',
        body: JSON.stringify({ prompt })
      }
    );

    return response.data!;
  }

  /**
   * Descargar un archivo (PDF o Excel)
   */
  descargarArchivo(blob: Blob, filename: string) {
    try {
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error('El archivo está vacío');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      // Limpiar después de un pequeño delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      throw error;
    }
  }
}

export const reportesService = new ReportesService();
