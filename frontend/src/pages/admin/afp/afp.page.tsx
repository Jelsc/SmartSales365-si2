import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, TrendingUp, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
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
      // El backend crea automáticamente la empresa si no existe al hacer GET
      const empresasData = await afpService.obtenerEmpresas();
      console.log('Empresas cargadas:', empresasData); // Debug
      // Asegurar que siempre sea un array
      const empresasArray = Array.isArray(empresasData) ? empresasData : [];
      
      setEmpresas(empresasArray);
      // Si hay al menos una empresa, seleccionarla automáticamente
      if (empresasArray.length > 0 && empresasArray[0]) {
        setEmpresaSeleccionada(empresasArray[0].id);
      }
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
      toast.error('Error al cargar empresas', {
        description: error.message || 'No se pudieron cargar las empresas. Verifica que el backend esté funcionando.'
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

      {/* Tabs principales */}
      <Tabs defaultValue="cargar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cargar">
            <Upload className="w-4 h-4 mr-2" />
            Cargar Estados
          </TabsTrigger>
          <TabsTrigger value="analisis">
            <TrendingUp className="w-4 h-4 mr-2" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="escenarios">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Escenarios What-If
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cargar" className="space-y-4">
          <CargadorArchivos
            empresas={empresas}
            empresaSeleccionada={empresaSeleccionada}
            onArchivoCargado={handleArchivoCargado}
          />
        </TabsContent>

        <TabsContent value="analisis" className="space-y-4">
          <VisualizacionAnalisis 
            empresaId={empresaSeleccionada}
            onPeriodoSeleccionado={setPeriodoSeleccionado}
          />
        </TabsContent>

        <TabsContent value="escenarios" className="space-y-4">
          <EscenariosWhatIf 
            empresaId={empresaSeleccionada}
            onPeriodoSeleccionado={setPeriodoSeleccionado}
          />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ReportesAFP 
            empresaId={empresaSeleccionada}
            onPeriodoSeleccionado={setPeriodoSeleccionado}
          />
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}

