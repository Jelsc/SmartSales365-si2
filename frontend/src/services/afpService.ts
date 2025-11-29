import { apiRequest } from './authService';
import { getApiBaseUrl } from '@/lib/api';

export interface Empresa {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface PeriodoFinanciero {
  id: number;
  empresa: number;
  empresa_nombre: string;
  tipo_periodo: 'MES' | 'TRIMESTRE' | 'AÑO';
  tipo_periodo_display: string;
  año: number;
  mes?: number;
  trimestre?: number;
  fecha_cierre: string;
  version: number;
  creado_por_nombre: string;
  creado: string;
}

export interface BalanceGeneral {
  id: number;
  periodo: number;
  periodo_info?: PeriodoFinanciero;
  // Activo Corriente
  caja_bancos: number;
  cuentas_por_cobrar: number;
  inventarios: number;
  otros_activos_corrientes: number;
  // Activo No Corriente
  propiedades_planta_equipo: number;
  inversiones_largo_plazo: number;
  intangibles: number;
  otros_activos_no_corrientes: number;
  // Pasivo Corriente
  cuentas_por_pagar: number;
  prestamos_corto_plazo: number;
  pasivos_acreedores: number;
  otros_pasivos_corrientes: number;
  // Pasivo No Corriente
  prestamos_largo_plazo: number;
  otros_pasivos_no_corrientes: number;
  // Patrimonio
  capital_social: number;
  reservas: number;
  utilidades_acumuladas: number;
  otros_patrimonios: number;
  // Calculados
  activo_corriente: number;
  activo_no_corriente: number;
  total_activo: number;
  pasivo_corriente: number;
  pasivo_no_corriente: number;
  total_pasivo: number;
  total_patrimonio: number;
  pasivo_mas_patrimonio: number;
}

export interface EstadoResultados {
  id: number;
  periodo: number;
  periodo_info?: PeriodoFinanciero;
  ventas_netas: number;
  otros_ingresos: number;
  costo_ventas: number;
  gastos_operativos: number;
  gastos_financieros: number;
  impuestos: number;
  // Calculados
  utilidad_bruta: number;
  ebit: number;
  utilidad_antes_impuestos: number;
  utilidad_neta: number;
}

export interface RatiosFinancieros {
  liquidez: {
    liquidez_corriente: number;
    prueba_acida: number;
  };
  gestion: {
    rotacion_inventario: number;
    dias_inventario: number;
    rotacion_cxc: number;
    dias_cobro: number;
    rotacion_cxp: number;
    dias_pago: number;
  };
  endeudamiento: {
    deuda_activo: number;
    deuda_patrimonio: number;
    cobertura_intereses: number;
  };
  rentabilidad: {
    margen_neto: number;
    rotacion_activos: number;
    roa: number;
    roe_dupont: number;
    apalancamiento: number;
  };
}

export interface AnalisisPatrimonial {
  vertical: {
    activo: Record<string, number>;
    pasivo_patrimonio: Record<string, number>;
  };
  horizontal: {
    activo: Record<string, number>;
    pasivo_patrimonio: Record<string, number>;
  } | null;
  estructura_capital: {
    pasivo_patrimonio: number;
    pasivo_nc_total: number;
    cobertura_activos_corrientes: number;
  };
}

export interface EscenarioWhatIf {
  impacto_ventas: {
    nuevas_ventas: number;
    variacion: number;
  };
  impacto_costo: {
    nuevo_costo: number;
    variacion: number;
  };
  impacto_capital_trabajo: {
    nuevas_cxc: number;
    nuevas_cxp: number;
    nuevo_inventario: number;
    nuevo_activo_corriente: number;
    nuevo_pasivo_corriente: number;
  };
  flujo_caja_proyectado: number;
  necesidad_capital_trabajo: number;
  variacion_capital_trabajo: number;
}

export interface AlertaFinanciera {
  codigo: string;
  nombre: string;
  valor: number;
  estado: 'ok' | 'advertencia' | 'critico';
  mensaje: string;
  umbral_minimo?: number;
  umbral_maximo?: number;
}

export interface InformeEjecutivo {
  periodo: PeriodoFinanciero;
  ratios: RatiosFinancieros;
  alertas: AlertaFinanciera[];
  insights: string[];
}

class AfpService {
  // Empresas
  async obtenerEmpresas(): Promise<Empresa[]> {
    const response = await apiRequest<Empresa[]>(
      '/api/afp/empresas/',
      { method: 'GET' }
    );
    // Asegurar que siempre devolvamos un array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  async crearEmpresa(empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await apiRequest<Empresa>(
      '/api/afp/empresas/',
      {
        method: 'POST',
        body: JSON.stringify(empresa)
      }
    );
    return response.data!;
  }

  // Periodos
  async obtenerPeriodos(empresaId?: number): Promise<PeriodoFinanciero[]> {
    const url = empresaId 
      ? `/api/afp/periodos/?empresa_id=${empresaId}`
      : '/api/afp/periodos/';
    const response = await apiRequest<PeriodoFinanciero[]>(
      url,
      { method: 'GET' }
    );
    // Asegurar que siempre devolvamos un array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  async obtenerPeriodo(id: number): Promise<PeriodoFinanciero> {
    const response = await apiRequest<PeriodoFinanciero>(
      `/api/afp/periodos/${id}/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async obtenerBalance(periodoId: number): Promise<BalanceGeneral> {
    const response = await apiRequest<BalanceGeneral>(
      `/api/afp/periodos/${periodoId}/balance/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async obtenerEstadoResultados(periodoId: number): Promise<EstadoResultados> {
    const response = await apiRequest<EstadoResultados>(
      `/api/afp/periodos/${periodoId}/estado_resultados/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async obtenerRatios(periodoId: number): Promise<RatiosFinancieros> {
    const response = await apiRequest<RatiosFinancieros>(
      `/api/afp/periodos/${periodoId}/ratios/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async obtenerAnalisisPatrimonial(periodoId: number): Promise<AnalisisPatrimonial> {
    const response = await apiRequest<AnalisisPatrimonial>(
      `/api/afp/periodos/${periodoId}/analisis_patrimonial/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async calcularEscenario(periodoId: number, escenario: {
    variacion_precio?: number;
    variacion_costo?: number;
    dias_cobro?: number;
    dias_pago?: number;
    dias_inventario?: number;
  }): Promise<EscenarioWhatIf> {
    const response = await apiRequest<EscenarioWhatIf>(
      `/api/afp/periodos/${periodoId}/escenario_whatif/`,
      {
        method: 'POST',
        body: JSON.stringify(escenario)
      }
    );
    return response.data!;
  }

  async obtenerAlertas(periodoId: number): Promise<AlertaFinanciera[]> {
    const response = await apiRequest<AlertaFinanciera[]>(
      `/api/afp/periodos/${periodoId}/alertas/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  async obtenerInformeEjecutivo(periodoId: number): Promise<InformeEjecutivo> {
    const response = await apiRequest<InformeEjecutivo>(
      `/api/afp/informe-ejecutivo/${periodoId}/`,
      { method: 'GET' }
    );
    return response.data!;
  }

  // Generar periodo desde ventas
  async generarPeriodoDesdeVentas(
    empresaId: number,
    tipoPeriodo: 'MES' | 'TRIMESTRE' | 'AÑO',
    año: number,
    mes?: number,
    trimestre?: number
  ): Promise<{ mensaje: string; periodo: PeriodoFinanciero }> {
    const response = await apiRequest<{ mensaje: string; periodo: PeriodoFinanciero }>(
      '/api/afp/periodos/generar_desde_ventas/',
      {
        method: 'POST',
        body: JSON.stringify({
          empresa_id: empresaId,
          tipo_periodo: tipoPeriodo,
          año: año,
          mes: mes,
          trimestre: trimestre
        })
      }
    );
    return response.data!;
  }

  // Cargar archivo
  async cargarArchivo(
    archivo: File,
    empresaId: number,
    tipoPeriodo: 'MES' | 'TRIMESTRE' | 'AÑO',
    año: number,
    fechaCierre: string,
    mes?: number,
    trimestre?: number,
    version: number = 1
  ): Promise<{ mensaje: string; periodo: PeriodoFinanciero }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('empresa_id', empresaId.toString());
    formData.append('tipo_periodo', tipoPeriodo);
    formData.append('año', año.toString());
    formData.append('fecha_cierre', fechaCierre);
    if (mes !== undefined) formData.append('mes', mes.toString());
    if (trimestre !== undefined) formData.append('trimestre', trimestre.toString());
    formData.append('version', version.toString());

    const apiBaseUrl = getApiBaseUrl();
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${apiBaseUrl}/api/afp/cargar-archivo/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cargar archivo');
    }

    return await response.json();
  }
}

export const afpService = new AfpService();

