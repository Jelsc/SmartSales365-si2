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

export interface InterpretacionReporte {
  parametros: ParametrosReporte;
  interpretacion: string[];
  prompt_original: string;
}

class ReportesService {
  /**
   * Generar un reporte desde un prompt de texto
   */
  async generarReporte(prompt: string, formato?: 'pantalla' | 'pdf' | 'excel'): Promise<DatosReporte | Blob> {
    const body: any = { prompt };
    if (formato) {
      body.formato = formato;
    }

    // Si es PDF o Excel, retornar Blob
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

      return response.blob();
    }

    // Si es pantalla, retornar JSON usando apiRequest (que ya incluye la base URL)
    const response = await apiRequest<{ reporte: DatosReporte }>(
      '/api/reportes/generar/',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    return response.data!.reporte;
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
  descargarArchivo(blob: Blob, nombre: string, extension: 'pdf' | 'xlsx') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombre}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const reportesService = new ReportesService();
