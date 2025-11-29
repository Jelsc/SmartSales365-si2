import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type { InformeEjecutivo } from '@/services/afpService';

interface ReportesAFPProps {
  periodoId: number;
}

export default function ReportesAFP({ periodoId }: ReportesAFPProps) {
  const [informe, setInforme] = useState<InformeEjecutivo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);

  useEffect(() => {
    cargarInforme();
  }, [periodoId]);

  const cargarInforme = async () => {
    try {
      setLoading(true);
      const informeData = await afpService.obtenerInformeEjecutivo(periodoId);
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
    // TODO: Implementar exportación a PDF
    toast.info('Funcionalidad en desarrollo', {
      description: 'La exportación a PDF estará disponible próximamente'
    });
  };

  const exportarExcel = async () => {
    // TODO: Implementar exportación a Excel
    toast.info('Funcionalidad en desarrollo', {
      description: 'La exportación a Excel estará disponible próximamente'
    });
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

  if (!informe) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No se pudo cargar el informe ejecutivo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                    className={`p-3 rounded-lg ${
                      alerta.estado === 'critico'
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
    </div>
  );
}

