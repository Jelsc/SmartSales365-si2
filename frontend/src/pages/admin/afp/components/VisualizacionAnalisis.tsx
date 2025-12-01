import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type {
  RatiosFinancieros,
  AnalisisPatrimonial,
  AlertaFinanciera,
  PeriodoFinanciero
} from '@/services/afpService';
import { Loader2 } from 'lucide-react';

interface VisualizacionAnalisisProps {
  empresaId: number | null;
  onPeriodoSeleccionado?: (periodoId: number | null) => void;
}

export default function VisualizacionAnalisis({ empresaId, onPeriodoSeleccionado }: VisualizacionAnalisisProps) {
  const [periodos, setPeriodos] = useState<PeriodoFinanciero[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
  const [ratios, setRatios] = useState<RatiosFinancieros | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisPatrimonial | null>(null);
  const [alertas, setAlertas] = useState<AlertaFinanciera[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false);

  useEffect(() => {
    if (empresaId) {
      cargarPeriodos();
    }
  }, [empresaId]);

  useEffect(() => {
    if (periodoSeleccionado) {
      cargarDatos();
      if (onPeriodoSeleccionado) {
        onPeriodoSeleccionado(periodoSeleccionado);
      }
    }
  }, [periodoSeleccionado]);

  const cargarPeriodos = async () => {
    if (!empresaId) return;
    try {
      setCargandoPeriodos(true);
      const periodosData = await afpService.obtenerPeriodos(empresaId);
      const periodosArray = Array.isArray(periodosData) ? periodosData : [];
      setPeriodos(periodosArray);
      
      if (periodosArray.length > 0 && periodosArray[0]) {
        setPeriodoSeleccionado(periodosArray[0].id);
      }
    } catch (error: any) {
      toast.error('Error al cargar periodos', {
        description: error.message
      });
    } finally {
      setCargandoPeriodos(false);
    }
  };

  const cargarDatos = async () => {
    if (!periodoSeleccionado) return;
    try {
      setLoading(true);
      const [ratiosData, analisisData, alertasData] = await Promise.all([
        afpService.obtenerRatios(periodoSeleccionado),
        afpService.obtenerAnalisisPatrimonial(periodoSeleccionado),
        afpService.obtenerAlertas(periodoSeleccionado)
      ]);
      setRatios(ratiosData);
      setAnalisis(analisisData);
      setAlertas(alertasData);
    } catch (error: any) {
      toast.error('Error al cargar análisis', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoAlerta = (estado: string) => {
    switch (estado) {
      case 'critico':
        return { icon: AlertTriangle, color: 'destructive', bg: 'bg-red-100' };
      case 'advertencia':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    }
  };

  // Función helper para formatear ratios especiales
  const formatearRatio = (valor: number, esPorcentaje: boolean = false): { valor: string; esExcelente: boolean } => {
    // Valores muy altos (999999) indican casos especiales
    if (valor >= 999000) {
      return {
        valor: esPorcentaje ? 'N/A' : valor.toFixed(2),
        esExcelente: true
      };
    }
    if (valor === 0 && !esPorcentaje) {
      return { valor: '0.00', esExcelente: false };
    }
    if (esPorcentaje) {
      return { valor: `${(valor * 100).toFixed(2)}%`, esExcelente: false };
    }
    return { valor: valor.toFixed(2), esExcelente: false };
  };

  // Función helper para mostrar descripción detallada
  const getDescripcionRatio = (valor: number, tipo: string): string | null => {
    if (valor >= 999000) {
      switch (tipo) {
        case 'liquidez_corriente':
          return 'La empresa no tiene pasivos corrientes, lo que significa que todos sus activos corrientes están disponibles sin obligaciones de pago inmediatas. Esto indica una posición de liquidez muy sólida.';
        case 'prueba_acida':
          return 'La empresa no tiene pasivos corrientes y cuenta con activos líquidos (sin inventarios) suficientes. Esto demuestra una capacidad excepcional para cubrir obligaciones a corto plazo sin depender de la venta de inventarios.';
        case 'cobertura_intereses':
          return 'La empresa no tiene gastos financieros, lo que significa que no tiene deudas que generen intereses. Esto indica una estructura financiera sin apalancamiento y sin costos financieros.';
        case 'apalancamiento':
          return 'Este es probablemente el primer period financiero. La empresa aún no tiene patrimonio inicial registrado (capital social), por lo que el apalancamiento se calcula sobre la base de activos y utilidades generadas.';
        case 'cobertura_activos_corrientes':
          return 'La empresa no tiene pasivos corrientes, lo que significa que todos sus activos corrientes están disponibles sin obligaciones de pago inmediatas. Esto indica una posición de liquidez muy sólida.';
        default:
          return 'Valor no aplicable en este contexto.';
      }
    }
    
    // Descripciones para valores normales
    switch (tipo) {
      case 'rotacion_inventario':
        if (valor === 0) {
          return 'No hay rotación de inventario. Esto puede indicar que no se están vendiendo productos o que el inventario está sobrevalorado.';
        } else if (valor < 1) {
          return 'La rotación de inventario es baja, lo que indica que los productos permanecen mucho tiempo en stock antes de venderse. Considera revisar tu estrategia de ventas o ajustar los niveles de inventario.';
        } else if (valor > 10) {
          return 'La rotación de inventario es muy alta, lo que indica una gestión eficiente del inventario. Sin embargo, asegúrate de tener suficiente stock para satisfacer la demanda.';
        } else {
          return 'La rotación de inventario muestra cuántas veces se renueva el inventario en un año. Un valor entre 1 y 10 generalmente indica una gestión adecuada del inventario.';
        }
      case 'rotacion_cxc':
        if (valor === 0) {
          return 'No hay rotación de cuentas por cobrar. Esto puede indicar que todas las ventas son al contado o que hay problemas con el cobro.';
        } else if (valor < 5) {
          return 'La rotación de cuentas por cobrar es baja, lo que indica que los clientes tardan mucho en pagar. Considera revisar tus políticas de crédito y cobranza.';
        } else if (valor > 20) {
          return 'La rotación de cuentas por cobrar es muy alta, lo que indica que los clientes pagan rápidamente. Esto es positivo para el flujo de caja.';
        } else {
          return 'La rotación de cuentas por cobrar muestra la eficiencia en el cobro de ventas a crédito. Un valor entre 5 y 20 generalmente indica una gestión adecuada.';
        }
      case 'rotacion_cxp':
        if (valor === 0) {
          return 'No hay rotación de cuentas por pagar. Esto puede indicar que todas las compras son al contado o que no hay proveedores registrados.';
        } else if (valor < 5) {
          return 'La rotación de cuentas por pagar es baja, lo que indica que pagas rápidamente a tus proveedores. Esto es positivo para las relaciones comerciales pero puede afectar el flujo de caja.';
        } else if (valor > 20) {
          return 'La rotación de cuentas por pagar es muy alta, lo que indica que tardas mucho en pagar a tus proveedores. Esto puede afectar las relaciones comerciales.';
        } else {
          return 'La rotación de cuentas por pagar muestra la eficiencia en el pago a proveedores. Un valor entre 5 y 20 generalmente indica una gestión adecuada.';
        }
      case 'deuda_activo':
        if (valor === 0) {
          return 'La empresa no tiene deuda en relación a sus activos. Esto indica una estructura financiera conservadora sin apalancamiento.';
        } else if (valor < 0.3) {
          return 'El nivel de endeudamiento es bajo (menos del 30% de los activos). Esto indica una estructura financiera conservadora y baja dependencia de deuda.';
        } else if (valor > 0.7) {
          return 'El nivel de endeudamiento es alto (más del 70% de los activos). Esto puede indicar un alto riesgo financiero y dependencia excesiva de deuda.';
        } else {
          return 'El nivel de endeudamiento es moderado. Un valor entre 30% y 70% generalmente indica un uso equilibrado de deuda para financiar los activos.';
        }
      case 'deuda_patrimonio':
        if (valor === 0) {
          return 'La empresa no tiene deuda en relación a su patrimonio. Esto indica una estructura financiera conservadora sin apalancamiento.';
        } else if (valor < 1) {
          return 'El nivel de endeudamiento es bajo (menos de 1:1). Esto indica que el patrimonio es mayor que la deuda, lo cual es una posición financiera sólida.';
        } else if (valor > 2) {
          return 'El nivel de endeudamiento es alto (más de 2:1). Esto puede indicar un alto riesgo financiero y dependencia excesiva de deuda sobre el patrimonio.';
        } else {
          return 'El nivel de endeudamiento es moderado. Un valor entre 1:1 y 2:1 generalmente indica un uso equilibrado de deuda.';
        }
      case 'margen_neto':
        if (valor < 0) {
          return 'El margen neto es negativo, lo que indica que la empresa está operando con pérdidas. Es importante revisar los costos y estrategias de venta.';
        } else if (valor < 0.05) {
          return 'El margen neto es bajo (menos del 5%). Esto indica que los costos y gastos están consumiendo la mayor parte de los ingresos. Considera revisar la eficiencia operativa.';
        } else if (valor > 0.2) {
          return 'El margen neto es alto (más del 20%). Esto indica una excelente rentabilidad y eficiencia en la gestión de costos y gastos.';
        } else {
          return 'El margen neto muestra la rentabilidad después de todos los costos y gastos. Un valor entre 5% y 20% generalmente indica una rentabilidad adecuada.';
        }
      case 'rotacion_activos':
        if (valor === 0) {
          return 'No hay rotación de activos. Esto puede indicar que los activos no están generando ventas o que están sobrevalorados.';
        } else if (valor < 1) {
          return 'La rotación de activos es baja, lo que indica que los activos no están generando suficientes ventas. Considera revisar la eficiencia en el uso de los activos.';
        } else if (valor > 3) {
          return 'La rotación de activos es alta, lo que indica una eficiencia excelente en el uso de los activos para generar ventas.';
        } else {
          return 'La rotación de activos muestra la eficiencia en el uso de los activos para generar ventas. Un valor entre 1 y 3 generalmente indica una gestión adecuada.';
        }
      case 'roa':
        if (valor < 0) {
          return 'El ROA es negativo, lo que indica que la empresa está generando pérdidas en relación a sus activos. Es importante revisar la rentabilidad.';
        } else if (valor < 0.05) {
          return 'El ROA es bajo (menos del 5%). Esto indica que los activos no están generando suficiente rentabilidad. Considera revisar la eficiencia operativa.';
        } else if (valor > 0.15) {
          return 'El ROA es alto (más del 15%). Esto indica una excelente rentabilidad sobre los activos y eficiencia en su uso.';
        } else {
          return 'El ROA muestra la rentabilidad generada por los activos. Un valor entre 5% y 15% generalmente indica una rentabilidad adecuada.';
        }
      case 'roe_dupont':
        if (valor < 0) {
          return 'El ROE es negativo, lo que indica que la empresa está generando pérdidas en relación a su patrimonio. Es importante revisar la rentabilidad.';
        } else if (valor < 0.1) {
          return 'El ROE es bajo (menos del 10%). Esto indica que el patrimonio no está generando suficiente rentabilidad. Considera revisar la eficiencia operativa y el uso del apalancamiento.';
        } else if (valor > 0.25) {
          return 'El ROE es alto (más del 25%). Esto indica una excelente rentabilidad sobre el patrimonio y eficiencia en el uso de los recursos propios.';
        } else {
          return 'El ROE muestra la rentabilidad generada por el patrimonio. Un valor entre 10% y 25% generalmente indica una rentabilidad adecuada.';
        }
      case 'pasivo_patrimonio':
        if (valor === 0) {
          return 'La empresa no tiene pasivos en relación a su patrimonio. Esto indica una estructura financiera conservadora sin apalancamiento.';
        } else if (valor < 0.5) {
          return 'El ratio pasivo/patrimonio es bajo (menos de 0.5:1). Esto indica que el patrimonio es significativamente mayor que los pasivos, lo cual es una posición financiera sólida.';
        } else if (valor > 2) {
          return 'El ratio pasivo/patrimonio es alto (más de 2:1). Esto puede indicar un alto riesgo financiero y dependencia excesiva de deuda sobre el patrimonio.';
        } else {
          return 'El ratio pasivo/patrimonio muestra la relación entre deuda y patrimonio. Un valor entre 0.5:1 y 2:1 generalmente indica un uso equilibrado de deuda.';
        }
      case 'pasivo_nc_total':
        if (valor === 0) {
          return 'No hay pasivos no corrientes. Todos los pasivos son a corto plazo, lo que puede indicar una estructura financiera más líquida pero con mayor presión de pago a corto plazo.';
        } else if (valor < 0.3) {
          return 'La proporción de pasivos no corrientes es baja (menos del 30%). La mayor parte de la deuda es a corto plazo, lo que puede generar presión de liquidez.';
        } else if (valor > 0.7) {
          return 'La proporción de pasivos no corrientes es alta (más del 70%). La mayor parte de la deuda es a largo plazo, lo que proporciona mayor estabilidad financiera.';
        } else {
          return 'La proporción de pasivos no corrientes muestra el peso de la deuda a largo plazo. Un valor entre 30% y 70% generalmente indica un equilibrio adecuado.';
        }
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!empresaId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No hay empresa disponible. Genera un periodo desde la pestaña "Cargar Estados".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de periodo */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Periodo</CardTitle>
          <CardDescription>Seleccione el periodo financiero a analizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="periodo-analisis">Periodo</Label>
            {cargandoPeriodos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando periodos...
              </div>
            ) : (
              <Select
                {...(periodoSeleccionado ? { value: periodoSeleccionado.toString() } : {})}
                onValueChange={(value) => setPeriodoSeleccionado(Number(value))}
                disabled={periodos.length === 0}
              >
                <SelectTrigger id="periodo-analisis">
                  <SelectValue placeholder={
                    periodos.length === 0
                      ? "No hay periodos disponibles"
                      : "Seleccione un periodo"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {periodos.length > 0 && periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      {periodo.tipo_periodo_display} - {periodo.año}
                      {periodo.mes && ` - Mes ${periodo.mes}`}
                      {periodo.trimestre && ` - T${periodo.trimestre}`}
                      {periodo.version > 1 && ` (v${periodo.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!cargandoPeriodos && periodos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay periodos disponibles. Genera uno desde la pestaña "Cargar Estados".
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!periodoSeleccionado && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Seleccione un periodo para ver el análisis
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Financieras</CardTitle>
            <CardDescription>Indicadores que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map((alerta) => {
                const estado = getEstadoAlerta(alerta.estado);
                const Icon = estado.icon;
                return (
                  <div
                    key={alerta.codigo}
                    className={`p-3 rounded-lg ${estado.bg} flex items-start gap-3`}
                  >
                    <Icon className={`w-5 h-5 ${estado.color} mt-0.5`} />
                    <div className="flex-1">
                      <p className="font-medium">{alerta.nombre}</p>
                      <p className="text-sm text-muted-foreground">{alerta.mensaje}</p>
                      <p className="text-sm font-semibold mt-1">
                        Valor actual: {alerta.valor.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ratios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ratios">Ratios Financieros</TabsTrigger>
          <TabsTrigger value="patrimonial">Análisis Patrimonial</TabsTrigger>
        </TabsList>

        <TabsContent value="ratios" className="space-y-4">
          {ratios && (
            <>
              {/* Liquidez */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratios de Liquidez</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Liquidez Corriente</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(ratios.liquidez.liquidez_corriente).valor}
                        </p>
                        {formatearRatio(ratios.liquidez.liquidez_corriente).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(ratios.liquidez.liquidez_corriente, 'liquidez_corriente') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.liquidez.liquidez_corriente, 'liquidez_corriente')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prueba Ácida</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(ratios.liquidez.prueba_acida).valor}
                        </p>
                        {formatearRatio(ratios.liquidez.prueba_acida).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(ratios.liquidez.prueba_acida, 'prueba_acida') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.liquidez.prueba_acida, 'prueba_acida')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gestión */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratios de Gestión/Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación Inventario</p>
                      <p className="text-2xl font-bold">{ratios.gestion.rotacion_inventario.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Días: {ratios.gestion.dias_inventario.toFixed(0)}
                      </p>
                      {getDescripcionRatio(ratios.gestion.rotacion_inventario, 'rotacion_inventario') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.gestion.rotacion_inventario, 'rotacion_inventario')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación CxC</p>
                      <p className="text-2xl font-bold">{ratios.gestion.rotacion_cxc.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Días: {ratios.gestion.dias_cobro.toFixed(0)}
                      </p>
                      {getDescripcionRatio(ratios.gestion.rotacion_cxc, 'rotacion_cxc') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.gestion.rotacion_cxc, 'rotacion_cxc')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación CxP</p>
                      <p className="text-2xl font-bold">{ratios.gestion.rotacion_cxp.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Días: {ratios.gestion.dias_pago.toFixed(0)}
                      </p>
                      {getDescripcionRatio(ratios.gestion.rotacion_cxp, 'rotacion_cxp') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.gestion.rotacion_cxp, 'rotacion_cxp')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endeudamiento */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratios de Endeudamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Deuda/Activo</p>
                      <p className="text-2xl font-bold">{(ratios.endeudamiento.deuda_activo * 100).toFixed(2)}%</p>
                      {getDescripcionRatio(ratios.endeudamiento.deuda_activo, 'deuda_activo') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.endeudamiento.deuda_activo, 'deuda_activo')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deuda/Patrimonio</p>
                      <p className="text-2xl font-bold">{ratios.endeudamiento.deuda_patrimonio.toFixed(2)}</p>
                      {getDescripcionRatio(ratios.endeudamiento.deuda_patrimonio, 'deuda_patrimonio') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.endeudamiento.deuda_patrimonio, 'deuda_patrimonio')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cobertura Intereses</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(ratios.endeudamiento.cobertura_intereses).valor}
                        </p>
                        {formatearRatio(ratios.endeudamiento.cobertura_intereses).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(ratios.endeudamiento.cobertura_intereses, 'cobertura_intereses') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.endeudamiento.cobertura_intereses, 'cobertura_intereses')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rentabilidad */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratios de Rentabilidad (DuPont)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Margen Neto</p>
                      <p className="text-2xl font-bold">{(ratios.rentabilidad.margen_neto * 100).toFixed(2)}%</p>
                      {getDescripcionRatio(ratios.rentabilidad.margen_neto, 'margen_neto') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.rentabilidad.margen_neto, 'margen_neto')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación Activos</p>
                      <p className="text-2xl font-bold">{ratios.rentabilidad.rotacion_activos.toFixed(2)}</p>
                      {getDescripcionRatio(ratios.rentabilidad.rotacion_activos, 'rotacion_activos') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.rentabilidad.rotacion_activos, 'rotacion_activos')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROA</p>
                      <p className="text-2xl font-bold">{(ratios.rentabilidad.roa * 100).toFixed(2)}%</p>
                      {getDescripcionRatio(ratios.rentabilidad.roa, 'roa') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.rentabilidad.roa, 'roa')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROE DuPont</p>
                      <p className="text-2xl font-bold">{(ratios.rentabilidad.roe_dupont * 100).toFixed(2)}%</p>
                      {getDescripcionRatio(ratios.rentabilidad.roe_dupont, 'roe_dupont') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.rentabilidad.roe_dupont, 'roe_dupont')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Apalancamiento</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(ratios.rentabilidad.apalancamiento).valor}
                        </p>
                        {formatearRatio(ratios.rentabilidad.apalancamiento).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(ratios.rentabilidad.apalancamiento, 'apalancamiento') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(ratios.rentabilidad.apalancamiento, 'apalancamiento')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="patrimonial" className="space-y-4">
          {analisis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Vertical</CardTitle>
                  <CardDescription>Composición porcentual sobre totales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Activo</h4>
                      <div className="space-y-1">
                        {Object.entries(analisis.vertical.activo).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{value.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Pasivo y Patrimonio</h4>
                      {analisis.vertical.pasivo_patrimonio && Object.keys(analisis.vertical.pasivo_patrimonio).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(analisis.vertical.pasivo_patrimonio).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{value.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay datos de pasivo y patrimonio disponibles. Regenera el periodo desde la pestaña "Cargar Estados".
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analisis.horizontal && (
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis Horizontal</CardTitle>
                    <CardDescription>Variación porcentual interperiodo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Activo</h4>
                        <div className="space-y-1">
                          {Object.entries(analisis.horizontal.activo).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <Badge variant={value >= 0 ? 'default' : 'destructive'}>
                                {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Pasivo y Patrimonio</h4>
                        <div className="space-y-1">
                          {Object.entries(analisis.horizontal.pasivo_patrimonio).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <Badge variant={value >= 0 ? 'default' : 'destructive'}>
                                {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Estructura de Capital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pasivo/Patrimonio</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(analisis.estructura_capital.pasivo_patrimonio).valor}
                        </p>
                        {formatearRatio(analisis.estructura_capital.pasivo_patrimonio).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(analisis.estructura_capital.pasivo_patrimonio, 'pasivo_patrimonio') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(analisis.estructura_capital.pasivo_patrimonio, 'pasivo_patrimonio')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pasivo NC / Total Pasivos</p>
                      <p className="text-2xl font-bold">{(analisis.estructura_capital.pasivo_nc_total * 100).toFixed(2)}%</p>
                      {getDescripcionRatio(analisis.estructura_capital.pasivo_nc_total, 'pasivo_nc_total') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(analisis.estructura_capital.pasivo_nc_total, 'pasivo_nc_total')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cobertura Activos Corrientes</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {formatearRatio(analisis.estructura_capital.cobertura_activos_corrientes).valor}
                        </p>
                        {formatearRatio(analisis.estructura_capital.cobertura_activos_corrientes).esExcelente && (
                          <Badge variant="default" className="bg-green-600">
                            Excelente
                          </Badge>
                        )}
                      </div>
                      {getDescripcionRatio(analisis.estructura_capital.cobertura_activos_corrientes, 'cobertura_activos_corrientes') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getDescripcionRatio(analisis.estructura_capital.cobertura_activos_corrientes, 'cobertura_activos_corrientes')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

