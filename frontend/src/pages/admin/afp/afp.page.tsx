import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { afpService } from '@/services/afpService';
import type { Empresa, PeriodoFinanciero } from '@/services/afpService';
import { toast } from 'sonner';
import CargadorArchivos from './components/CargadorArchivos';
import VisualizacionAnalisis from './components/VisualizacionAnalisis';
import EscenariosWhatIf from './components/EscenariosWhatIf';
import ReportesAFP from './components/ReportesAFP';

export default function AfpPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoFinanciero[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (empresaSeleccionada) {
      cargarPeriodos(empresaSeleccionada);
    }
  }, [empresaSeleccionada]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const empresasData = await afpService.obtenerEmpresas();
      // Asegurar que siempre sea un array
      const empresasArray = Array.isArray(empresasData) ? empresasData : [];
      setEmpresas(empresasArray);
      
      if (empresasArray.length > 0 && empresasArray[0]) {
        setEmpresaSeleccionada(empresasArray[0].id);
      }
    } catch (error: any) {
      toast.error('Error al cargar empresas', {
        description: error.message
      });
      setEmpresas([]); // Asegurar que siempre sea un array incluso en caso de error
    } finally {
      setLoading(false);
    }
  };

  const cargarPeriodos = async (empresaId: number) => {
    try {
      setLoading(true);
      const periodosData = await afpService.obtenerPeriodos(empresaId);
      // Asegurar que siempre sea un array
      const periodosArray = Array.isArray(periodosData) ? periodosData : [];
      setPeriodos(periodosArray);
      
      if (periodosArray.length > 0 && periodosArray[0]) {
        setPeriodoSeleccionado(periodosArray[0].id);
      }
    } catch (error: any) {
      toast.error('Error al cargar periodos', {
        description: error.message
      });
      setPeriodos([]); // Asegurar que siempre sea un array incluso en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleArchivoCargado = () => {
    if (empresaSeleccionada) {
      cargarPeriodos(empresaSeleccionada);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis Financiero & Patrimonial</h1>
            <p className="text-muted-foreground">
              Análisis patrimonial, ratios financieros, escenarios y reportes
            </p>
          </div>
        </div>

      {/* Selectores */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Seleccione empresa y periodo para analizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Empresa</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={empresaSeleccionada || ''}
                onChange={(e) => {
                  setEmpresaSeleccionada(Number(e.target.value));
                  setPeriodoSeleccionado(null);
                }}
              >
                <option value="">Seleccione una empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={periodoSeleccionado || ''}
                onChange={(e) => setPeriodoSeleccionado(Number(e.target.value))}
                disabled={!empresaSeleccionada || periodos.length === 0}
              >
                <option value="">Seleccione un periodo</option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.tipo_periodo_display} - {periodo.año}
                    {periodo.mes && ` - Mes ${periodo.mes}`}
                    {periodo.trimestre && ` - T${periodo.trimestre}`}
                    {periodo.version > 1 && ` (v${periodo.version})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="cargar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cargar">
            <Upload className="w-4 h-4 mr-2" />
            Cargar Estados
          </TabsTrigger>
          <TabsTrigger value="analisis" disabled={!periodoSeleccionado}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="escenarios" disabled={!periodoSeleccionado}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Escenarios What-If
          </TabsTrigger>
          <TabsTrigger value="reportes" disabled={!periodoSeleccionado}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cargar" className="space-y-4">
          <CargadorArchivos
            empresas={empresas}
            onArchivoCargado={handleArchivoCargado}
          />
        </TabsContent>

        <TabsContent value="analisis" className="space-y-4">
          {periodoSeleccionado ? (
            <VisualizacionAnalisis periodoId={periodoSeleccionado} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Seleccione un periodo para ver el análisis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="escenarios" className="space-y-4">
          {periodoSeleccionado ? (
            <EscenariosWhatIf periodoId={periodoSeleccionado} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Seleccione un periodo para crear escenarios
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          {periodoSeleccionado ? (
            <ReportesAFP periodoId={periodoSeleccionado} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Seleccione un periodo para generar reportes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}

