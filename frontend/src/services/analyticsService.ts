import { apiRequest } from './authService';

// ==================== TYPES ====================

export interface MetricasGenerales {
  ventas_mes: {
    total: number;
    cantidad_ordenes: number;
    crecimiento: number;
    ticket_promedio: number;
  };
  productos: {
    total_activos: number;
    bajo_stock: number;
    porcentaje_bajo_stock: number;
  };
  clientes: {
    activos_mes: number;
  };
}

export interface PrediccionVenta {
  fecha: string;
  dia_nombre: string;
  venta_estimada: number;
  confianza: string;
}

export interface PrediccionVentasResponse {
  predicciones: PrediccionVenta[];
  total_estimado: number;
  modelo: string;
  confiabilidad: string;
}

export interface PrediccionMes {
  mes: string;
  total_estimado: number;
  promedio_diario: number;
  predicciones_diarias: PrediccionVenta[];
}

export interface ProductoTop {
  producto__id: number;
  producto__nombre: string;
  producto__imagen: string | null;
  total_vendido: number;
  ingresos_totales: number;
}

export interface ProductoBajoStock {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
  imagen: string | null;
}

export interface CategoriaTop {
  id: number;
  nombre: string;
  total_ventas: number;
  ingresos: number;
}

export interface VentaDiaria {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface GraficoVentasDiarias {
  datos: VentaDiaria[];
  periodo: string;
}

export interface Tendencias {
  semana_actual: {
    total: number;
    cantidad: number;
  };
  semana_anterior: {
    total: number;
    cantidad: number;
  };
  tendencia_porcentaje: number;
  direccion: 'alza' | 'baja' | 'estable';
}

export interface VentaPorProducto {
  producto__id: number;
  producto__nombre: string;
  producto__categoria__nombre: string;
  cantidad_vendida: number;
  ingresos: number;
  total_ordenes: number;
}

export interface VentaPorCategoria {
  producto__categoria__id: number;
  producto__categoria__nombre: string;
  cantidad_vendida: number;
  ingresos: number;
  total_productos: number;
}

export interface VentaPorCliente {
  usuario__id: number;
  usuario__first_name: string;
  usuario__last_name: string;
  usuario__email: string;
  total_ordenes: number;
  total_gastado: number;
  ticket_promedio: number;
}

export interface MetricasEntrenamiento {
  exito: boolean;
  registros: number;
  train_score: number;
  test_score: number;
  features_importance: Record<string, number>;
}

// ==================== SERVICE ====================

class AnalyticsService {
  private readonly baseUrl = '/api/analytics/dashboard';

  /**
   * Obtiene métricas generales del negocio
   */
  async getMetricasGenerales(): Promise<MetricasGenerales> {
    const response = await apiRequest<MetricasGenerales>(
      `${this.baseUrl}/metricas-generales/`
    );
    return response.data!;
  }

  /**
   * Obtiene predicciones de ventas usando ML
   * @param dias Número de días a predecir (default: 7)
   */
  async getPrediccionVentas(dias: number = 7): Promise<PrediccionVentasResponse> {
    const response = await apiRequest<PrediccionVentasResponse>(
      `${this.baseUrl}/prediccion-ventas/?dias=${dias}`
    );
    return response.data!;
  }

  /**
   * Obtiene predicción de ventas del mes
   */
  async getPrediccionMes(): Promise<PrediccionMes> {
    const response = await apiRequest<PrediccionMes>(
      `${this.baseUrl}/prediccion-mes/`
    );
    return response.data!;
  }

  /**
   * Entrena/re-entrena el modelo de ML
   */
  async entrenarModelo(): Promise<{ mensaje: string; metricas: MetricasEntrenamiento }> {
    const response = await apiRequest<{ mensaje: string; metricas: MetricasEntrenamiento }>(
      `${this.baseUrl}/entrenar-modelo/`,
      { method: 'POST' }
    );
    return response.data!;
  }

  /**
   * Obtiene productos más vendidos
   * @param limite Cantidad de productos (default: 10)
   */
  async getProductosTop(limite: number = 10): Promise<{ productos: ProductoTop[]; total: number }> {
    const response = await apiRequest<{ productos: ProductoTop[]; total: number }>(
      `${this.baseUrl}/productos-top/?limite=${limite}`
    );
    return response.data!;
  }

  /**
   * Obtiene productos con bajo stock
   * @param umbral Stock mínimo (default: 10)
   */
  async getProductosBajoStock(umbral: number = 10): Promise<{ productos: ProductoBajoStock[]; total: number; umbral: number }> {
    const response = await apiRequest<{ productos: ProductoBajoStock[]; total: number; umbral: number }>(
      `${this.baseUrl}/productos-bajo-stock/?umbral=${umbral}`
    );
    return response.data!;
  }

  /**
   * Obtiene categorías más vendidas
   */
  async getCategoriasTop(): Promise<{ categorias: CategoriaTop[]; total: number }> {
    const response = await apiRequest<{ categorias: CategoriaTop[]; total: number }>(
      `${this.baseUrl}/categorias-top/`
    );
    return response.data!;
  }

  /**
   * Obtiene datos para gráfico de ventas diarias
   * @param dias Período de análisis (default: 30)
   */
  async getGraficoVentasDiarias(dias: number = 30): Promise<GraficoVentasDiarias> {
    const response = await apiRequest<GraficoVentasDiarias>(
      `${this.baseUrl}/grafico-ventas-diarias/?dias=${dias}`
    );
    return response.data!;
  }

  /**
   * Obtiene análisis de tendencias
   */
  async getTendencias(): Promise<Tendencias> {
    const response = await apiRequest<Tendencias>(
      `${this.baseUrl}/tendencias/`
    );
    return response.data!;
  }

  /**
   * Obtiene ventas históricas por producto
   * @param dias Período de análisis (default: 30)
   */
  async getVentasPorProducto(dias: number = 30): Promise<{ productos: VentaPorProducto[]; total: number; periodo: string }> {
    const response = await apiRequest<{ productos: VentaPorProducto[]; total: number; periodo: string }>(
      `${this.baseUrl}/ventas-por-producto/?dias=${dias}`
    );
    return response.data!;
  }

  /**
   * Obtiene ventas históricas por categoría
   * @param dias Período de análisis (default: 30)
   */
  async getVentasPorCategoria(dias: number = 30): Promise<{ categorias: VentaPorCategoria[]; total: number; periodo: string }> {
    const response = await apiRequest<{ categorias: VentaPorCategoria[]; total: number; periodo: string }>(
      `${this.baseUrl}/ventas-por-categoria/?dias=${dias}`
    );
    return response.data!;
  }

  /**
   * Obtiene ventas históricas por cliente
   * @param dias Período de análisis (default: 30)
   * @param limite Cantidad de clientes (default: 20)
   */
  async getVentasPorCliente(dias: number = 30, limite: number = 20): Promise<{ clientes: VentaPorCliente[]; total: number; periodo: string }> {
    const response = await apiRequest<{ clientes: VentaPorCliente[]; total: number; periodo: string }>(
      `${this.baseUrl}/ventas-por-cliente/?dias=${dias}&limite=${limite}`
    );
    return response.data!;
  }
}

export const analyticsService = new AnalyticsService();
