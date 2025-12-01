import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type { EscenarioWhatIf, PeriodoFinanciero } from '@/services/afpService';

interface EscenariosWhatIfProps {
  empresaId: number | null;
  onPeriodoSeleccionado?: (periodoId: number | null) => void;
}

export default function EscenariosWhatIf({ empresaId, onPeriodoSeleccionado }: EscenariosWhatIfProps) {
  const [periodos, setPeriodos] = useState<PeriodoFinanciero[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
  const [variacionPrecio, setVariacionPrecio] = useState<number>(0);
  const [variacionCosto, setVariacionCosto] = useState<number>(0);
  const [diasCobro, setDiasCobro] = useState<number | undefined>(undefined);
  const [diasPago, setDiasPago] = useState<number | undefined>(undefined);
  const [diasInventario, setDiasInventario] = useState<number | undefined>(undefined);
  const [escenario, setEscenario] = useState<EscenarioWhatIf | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId) {
      cargarPeriodos();
    }
  }, [empresaId]);

  useEffect(() => {
    if (periodoSeleccionado && onPeriodoSeleccionado) {
      onPeriodoSeleccionado(periodoSeleccionado);
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

  const calcularEscenario = async () => {
    if (!periodoSeleccionado) {
      toast.error('Seleccione un periodo primero');
      return;
    }

    try {
      setLoading(true);
      const escenarioParams: {
        variacion_precio?: number;
        variacion_costo?: number;
        dias_cobro?: number;
        dias_pago?: number;
        dias_inventario?: number;
      } = {};
      
      // Solo incluir variaciones si son diferentes de 0
      if (variacionPrecio !== 0) {
        escenarioParams.variacion_precio = variacionPrecio;
      }
      if (variacionCosto !== 0) {
        escenarioParams.variacion_costo = variacionCosto;
      }
      if (diasCobro !== undefined && diasCobro !== null) {
        escenarioParams.dias_cobro = diasCobro;
      }
      if (diasPago !== undefined && diasPago !== null) {
        escenarioParams.dias_pago = diasPago;
      }
      if (diasInventario !== undefined && diasInventario !== null) {
        escenarioParams.dias_inventario = diasInventario;
      }
      
      const resultado = await afpService.calcularEscenario(periodoSeleccionado, escenarioParams);
      setEscenario(resultado);
    } catch (error: any) {
      toast.error('Error al calcular escenario', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

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
          <CardDescription>Seleccione el periodo financiero para el escenario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="periodo-escenario">Periodo</Label>
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
                <SelectTrigger id="periodo-escenario">
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
              Seleccione un periodo para crear escenarios
            </p>
          </CardContent>
        </Card>
      )}

      {periodoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Escenarios What-If
            </CardTitle>
            <CardDescription>
              Simule variaciones en precio, costo y días de cobro/pago/inventario para ver el impacto
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Sliders */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="variacion-precio">
                Variación de Precio: {variacionPrecio > 0 ? '+' : ''}{variacionPrecio}%
              </Label>
              <div className="px-2">
                <Slider
                  id="variacion-precio"
                  value={[variacionPrecio]}
                  onValueChange={(value) => setVariacionPrecio(value[0] ?? 0)}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variacion-costo">
                Variación de Costo: {variacionCosto > 0 ? '+' : ''}{variacionCosto}%
              </Label>
              <div className="px-2">
                <Slider
                  id="variacion-costo"
                  value={[variacionCosto]}
                  onValueChange={(value) => setVariacionCosto(value[0] ?? 0)}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias-cobro">Días de Cobro (opcional)</Label>
              <Input
                id="dias-cobro"
                type="number"
                value={diasCobro ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiasCobro(value ? Number(value) : undefined);
                }}
                placeholder="Días promedio de cobro"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias-pago">Días de Pago (opcional)</Label>
              <Input
                id="dias-pago"
                type="number"
                value={diasPago ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiasPago(value ? Number(value) : undefined);
                }}
                placeholder="Días promedio de pago"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias-inventario">Días de Inventario (opcional)</Label>
              <Input
                id="dias-inventario"
                type="number"
                value={diasInventario ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiasInventario(value ? Number(value) : undefined);
                }}
                placeholder="Días promedio de inventario"
                min="0"
              />
            </div>
          </div>

          <Button onClick={calcularEscenario} disabled={loading || !periodoSeleccionado} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Calcular Escenario
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Resultados */}
      {escenario && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto en Ventas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevas Ventas</p>
                  <p className="text-2xl font-bold">
                    ${escenario.impacto_ventas.nuevas_ventas.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Representa las ventas proyectadas después de aplicar la variación de precio. Si aumentaste el precio, las ventas pueden aumentar o disminuir dependiendo de la elasticidad de la demanda. Si disminuiste el precio, las ventas pueden aumentar si hay más demanda.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variación</p>
                  <p className={`text-2xl font-bold ${escenario.impacto_ventas.variacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {escenario.impacto_ventas.variacion >= 0 ? '+' : ''}
                    ${escenario.impacto_ventas.variacion.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Diferencia entre las nuevas ventas proyectadas y las ventas originales. Un valor positivo indica un aumento en los ingresos, mientras que un valor negativo indica una disminución. Esta variación refleja el impacto directo del cambio de precio en los ingresos.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impacto en Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevo Costo</p>
                  <p className="text-2xl font-bold">
                    ${escenario.impacto_costo.nuevo_costo.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Costo de ventas proyectado después de aplicar la variación de costo. Si aumentaste el costo, el nuevo costo será mayor, lo que reduce el margen de ganancia. Si disminuiste el costo, el nuevo costo será menor, mejorando el margen.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variación</p>
                  <p className={`text-2xl font-bold ${escenario.impacto_costo.variacion >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {escenario.impacto_costo.variacion >= 0 ? '+' : ''}
                    ${escenario.impacto_costo.variacion.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Diferencia entre el nuevo costo y el costo original. Un valor positivo (rojo) indica un aumento en los costos, lo que reduce la rentabilidad. Un valor negativo (verde) indica una disminución en los costos, lo que mejora la rentabilidad.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capital de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Necesidad de Capital de Trabajo</p>
                  <p className="text-2xl font-bold">
                    ${escenario.necesidad_capital_trabajo.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Capital necesario para financiar las operaciones diarias del negocio bajo este escenario. Incluye el dinero necesario para cubrir cuentas por cobrar, inventarios y otros activos corrientes, menos las cuentas por pagar. Un valor alto indica mayor necesidad de financiamiento.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variación</p>
                  <p className={`text-2xl font-bold ${escenario.variacion_capital_trabajo >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {escenario.variacion_capital_trabajo >= 0 ? '+' : ''}
                    ${escenario.variacion_capital_trabajo.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Cambio en la necesidad de capital de trabajo comparado con el escenario actual. Un valor positivo (rojo) indica que necesitarás más capital para operar, lo que puede requerir financiamiento adicional. Un valor negativo (verde) indica que necesitarás menos capital, liberando recursos.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flujo de Caja Proyectado</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className={`text-3xl font-bold ${escenario.flujo_caja_proyectado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {escenario.flujo_caja_proyectado >= 0 ? '+' : ''}
                  ${escenario.flujo_caja_proyectado.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    El flujo de caja proyectado representa el efectivo que generará o consumirá tu negocio bajo este escenario. Se calcula considerando la utilidad neta proyectada menos los cambios en el capital de trabajo. Un valor positivo (verde) indica que generarás efectivo, mejorando tu liquidez. Un valor negativo (rojo) indica que consumirás efectivo, lo que puede requerir financiamiento adicional o ajustes en las operaciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

