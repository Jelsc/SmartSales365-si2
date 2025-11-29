import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type {
  RatiosFinancieros,
  AnalisisPatrimonial,
  AlertaFinanciera
} from '@/services/afpService';
import { Loader2 } from 'lucide-react';

interface VisualizacionAnalisisProps {
  periodoId: number;
}

export default function VisualizacionAnalisis({ periodoId }: VisualizacionAnalisisProps) {
  const [ratios, setRatios] = useState<RatiosFinancieros | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisPatrimonial | null>(null);
  const [alertas, setAlertas] = useState<AlertaFinanciera[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [periodoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ratiosData, analisisData, alertasData] = await Promise.all([
        afpService.obtenerRatios(periodoId),
        afpService.obtenerAnalisisPatrimonial(periodoId),
        afpService.obtenerAlertas(periodoId)
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

  return (
    <div className="space-y-4">
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
                      <p className="text-2xl font-bold">{ratios.liquidez.liquidez_corriente.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prueba Ácida</p>
                      <p className="text-2xl font-bold">{ratios.liquidez.prueba_acida.toFixed(2)}</p>
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
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación CxC</p>
                      <p className="text-2xl font-bold">{ratios.gestion.rotacion_cxc.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Días: {ratios.gestion.dias_cobro.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación CxP</p>
                      <p className="text-2xl font-bold">{ratios.gestion.rotacion_cxp.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Días: {ratios.gestion.dias_pago.toFixed(0)}
                      </p>
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
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deuda/Patrimonio</p>
                      <p className="text-2xl font-bold">{ratios.endeudamiento.deuda_patrimonio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cobertura Intereses</p>
                      <p className="text-2xl font-bold">{ratios.endeudamiento.cobertura_intereses.toFixed(2)}</p>
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
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rotación Activos</p>
                      <p className="text-2xl font-bold">{ratios.rentabilidad.rotacion_activos.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROA</p>
                      <p className="text-2xl font-bold">{(ratios.rentabilidad.roa * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROE DuPont</p>
                      <p className="text-2xl font-bold">{(ratios.rentabilidad.roe_dupont * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Apalancamiento</p>
                      <p className="text-2xl font-bold">{ratios.rentabilidad.apalancamiento.toFixed(2)}</p>
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
                      <div className="space-y-1">
                        {Object.entries(analisis.vertical.pasivo_patrimonio).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{value.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
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
                      <p className="text-2xl font-bold">{analisis.estructura_capital.pasivo_patrimonio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pasivo NC / Total Pasivos</p>
                      <p className="text-2xl font-bold">{(analisis.estructura_capital.pasivo_nc_total * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cobertura Activos Corrientes</p>
                      <p className="text-2xl font-bold">{analisis.estructura_capital.cobertura_activos_corrientes.toFixed(2)}</p>
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

