import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type { EscenarioWhatIf } from '@/services/afpService';

interface EscenariosWhatIfProps {
  periodoId: number;
}

export default function EscenariosWhatIf({ periodoId }: EscenariosWhatIfProps) {
  const [variacionPrecio, setVariacionPrecio] = useState<number>(0);
  const [variacionCosto, setVariacionCosto] = useState<number>(0);
  const [diasCobro, setDiasCobro] = useState<number | undefined>(undefined);
  const [diasPago, setDiasPago] = useState<number | undefined>(undefined);
  const [diasInventario, setDiasInventario] = useState<number | undefined>(undefined);
  const [escenario, setEscenario] = useState<EscenarioWhatIf | null>(null);
  const [loading, setLoading] = useState(false);

  const calcularEscenario = async () => {
    try {
      setLoading(true);
      const escenarioParams: {
        variacion_precio?: number;
        variacion_costo?: number;
        dias_cobro?: number;
        dias_pago?: number;
        dias_inventario?: number;
      } = {
        variacion_precio: variacionPrecio,
        variacion_costo: variacionCosto,
      };
      
      if (diasCobro !== undefined) {
        escenarioParams.dias_cobro = diasCobro;
      }
      if (diasPago !== undefined) {
        escenarioParams.dias_pago = diasPago;
      }
      if (diasInventario !== undefined) {
        escenarioParams.dias_inventario = diasInventario;
      }
      
      const resultado = await afpService.calcularEscenario(periodoId, escenarioParams);
      setEscenario(resultado);
    } catch (error: any) {
      toast.error('Error al calcular escenario', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="space-y-4">
            <div>
              <Label>Variación de Precio: {variacionPrecio > 0 ? '+' : ''}{variacionPrecio}%</Label>
              <Slider
                value={[variacionPrecio]}
                onValueChange={(value) => setVariacionPrecio(value[0] ?? 0)}
                min={-50}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Variación de Costo: {variacionCosto > 0 ? '+' : ''}{variacionCosto}%</Label>
              <Slider
                value={[variacionCosto]}
                onValueChange={(value) => setVariacionCosto(value[0] ?? 0)}
                min={-50}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Días de Cobro (opcional)</Label>
              <Input
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

            <div>
              <Label>Días de Pago (opcional)</Label>
              <Input
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

            <div>
              <Label>Días de Inventario (opcional)</Label>
              <Input
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

          <Button onClick={calcularEscenario} disabled={loading} className="w-full">
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

      {/* Resultados */}
      {escenario && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto en Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevas Ventas</p>
                  <p className="text-2xl font-bold">
                    ${escenario.impacto_ventas.nuevas_ventas.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impacto en Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevo Costo</p>
                  <p className="text-2xl font-bold">
                    ${escenario.impacto_costo.nuevo_costo.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capital de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Necesidad de Capital de Trabajo</p>
                  <p className="text-2xl font-bold">
                    ${escenario.necesidad_capital_trabajo.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
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
                <p className="text-sm text-muted-foreground mt-2">
                  Flujo de caja estimado bajo este escenario
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

