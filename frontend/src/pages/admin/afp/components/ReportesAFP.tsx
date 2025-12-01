import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type { InformeEjecutivo, PeriodoFinanciero } from '@/services/afpService';
import { getApiBaseUrl } from '@/lib/api';

interface ReportesAFPProps {
  empresaId: number | null;
  onPeriodoSeleccionado?: (periodoId: number | null) => void;
}

export default function ReportesAFP({ empresaId, onPeriodoSeleccionado }: ReportesAFPProps) {
  const [periodos, setPeriodos] = useState<PeriodoFinanciero[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
  const [informe, setInforme] = useState<InformeEjecutivo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);

  useEffect(() => {
    if (empresaId) {
      cargarPeriodos();
    }
  }, [empresaId]);

  useEffect(() => {
    if (periodoSeleccionado) {
      cargarInforme();
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

  const cargarInforme = async () => {
    if (!periodoSeleccionado) return;
    try {
      setLoading(true);
      const informeData = await afpService.obtenerInformeEjecutivo(periodoSeleccionado);
      setInforme(informeData);
    } catch (error: any) {
      toast.error('Error al cargar informe', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    if (!periodoSeleccionado) {
      toast.error('Seleccione un periodo primero');
      return;
    }

    try {
      setGenerandoReporte(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = localStorage.getItem('access_token') || '';

      const response = await fetch(
        `${API_BASE_URL}/api/afp/exportar-pdf/${periodoSeleccionado}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al generar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Obtener nombre del archivo del header Content-Disposition si está disponible
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `informe_ejecutivo_${periodoSeleccionado}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF generado exitosamente', {
        description: 'El archivo se ha descargado correctamente'
      });
    } catch (error: any) {
      toast.error('Error al generar PDF', {
        description: error.message || 'No se pudo generar el archivo PDF'
      });
    } finally {
      setGenerandoReporte(false);
    }
  };

  const exportarExcel = async () => {
    if (!periodoSeleccionado) {
      toast.error('Seleccione un periodo primero');
      return;
    }

    try {
      setGenerandoReporte(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = localStorage.getItem('access_token') || '';

      const response = await fetch(
        `${API_BASE_URL}/api/afp/exportar-excel/${periodoSeleccionado}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al generar Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Obtener nombre del archivo del header Content-Disposition si está disponible
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `informe_ejecutivo_${periodoSeleccionado}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel generado exitosamente', {
        description: 'El archivo se ha descargado correctamente'
      });
    } catch (error: any) {
      toast.error('Error al generar Excel', {
        description: error.message || 'No se pudo generar el archivo Excel'
      });
    } finally {
      setGenerandoReporte(false);
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

  if (loading && periodoSeleccionado) {
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
      {/* Selector de periodo */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Periodo</CardTitle>
          <CardDescription>Seleccione el periodo financiero para el reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="periodo-reporte">Periodo</Label>
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
                <SelectTrigger id="periodo-reporte">
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
              Seleccione un periodo para generar reportes
            </p>
          </CardContent>
        </Card>
      )}

      {!informe && periodoSeleccionado && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No se pudo cargar el informe ejecutivo
            </p>
          </CardContent>
        </Card>
      )}

      {informe && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Informe Ejecutivo</CardTitle>
                <CardDescription>
                  Periodo: {informe.periodo.tipo_periodo_display} - {informe.periodo.año}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportarPDF} disabled={generandoReporte}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={exportarExcel} disabled={generandoReporte}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Insights */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Insights Automáticos</h3>
              <div className="space-y-2">
                {informe.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Ratios */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Resumen de Ratios Clave</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Liquidez Corriente</p>
                  <p className="text-xl font-bold">{informe.ratios.liquidez.liquidez_corriente.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">ROA</p>
                  <p className="text-xl font-bold">{(informe.ratios.rentabilidad.roa * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className="text-xl font-bold">{(informe.ratios.rentabilidad.roe_dupont * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Deuda/Activo</p>
                  <p className="text-xl font-bold">{(informe.ratios.endeudamiento.deuda_activo * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Alertas */}
            {informe.alertas.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Alertas</h3>
                <div className="space-y-2">
                  {informe.alertas.map((alerta) => (
                    <div
                      key={alerta.codigo}
                      className={`p-3 rounded-lg ${alerta.estado === 'critico'
                          ? 'bg-red-50 border border-red-200'
                          : alerta.estado === 'advertencia'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-green-50 border border-green-200'
                        }`}
                    >
                      <p className="font-medium">{alerta.nombre}</p>
                      <p className="text-sm text-muted-foreground">{alerta.mensaje}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

