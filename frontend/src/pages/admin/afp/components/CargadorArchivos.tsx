import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, FileSpreadsheet, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { afpService } from '@/services/afpService';
import type { Empresa } from '@/services/afpService';

interface CargadorArchivosProps {
  empresas: Empresa[];
  empresaSeleccionada: number | null;
  onArchivoCargado: () => void;
}

export default function CargadorArchivos({ empresas, empresaSeleccionada, onArchivoCargado }: CargadorArchivosProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  // Si solo hay una empresa, usar esa automáticamente; si hay múltiples, permitir selección
  const [empresaId, setEmpresaId] = useState<string>(
    empresas.length === 1 && empresas[0] ? empresas[0].id.toString() : 
    empresaSeleccionada ? empresaSeleccionada.toString() : ''
  );
  const [tipoPeriodo, setTipoPeriodo] = useState<'MES' | 'TRIMESTRE' | 'AÑO'>('MES');
  
  // Actualizar empresaId cuando cambie empresaSeleccionada o empresas
  useEffect(() => {
    if (empresas.length === 1 && empresas[0]) {
      setEmpresaId(empresas[0].id.toString());
    } else if (empresaSeleccionada) {
      setEmpresaId(empresaSeleccionada.toString());
    } else if (empresas.length > 0 && empresas[0]) {
      // Si hay empresas pero no hay selección, usar la primera
      setEmpresaId(empresas[0].id.toString());
    }
  }, [empresas, empresaSeleccionada]);
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [mes, setMes] = useState<number | undefined>(new Date().getMonth() + 1);
  const [trimestre, setTrimestre] = useState<number | undefined>(undefined);
  const [fechaCierre, setFechaCierre] = useState<string>(
    new Date().toISOString().split('T')[0] || ''
  );
  const [version, setVersion] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [generandoDesdeVentas, setGenerandoDesdeVentas] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
        toast.error('Formato no válido', {
          description: 'Solo se permiten archivos CSV o Excel (.xlsx, .xls)'
        });
        return;
      }
      setArchivo(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivo) {
      toast.error('Seleccione un archivo');
      return;
    }

    // Si solo hay una empresa, usar esa automáticamente
    const empresaIdFinal = empresaId || (empresas.length === 1 && empresas[0] ? empresas[0].id.toString() : '');
    
    if (!empresaIdFinal) {
      toast.error('No hay empresa disponible');
      return;
    }
    
    const empresaIdNum = Number(empresaIdFinal);

    if (tipoPeriodo === 'MES' && !mes) {
      toast.error('Seleccione un mes');
      return;
    }

    if (tipoPeriodo === 'TRIMESTRE' && !trimestre) {
      toast.error('Seleccione un trimestre');
      return;
    }

    try {
      setLoading(true);
      await afpService.cargarArchivo(
        archivo,
        empresaIdNum,
        tipoPeriodo,
        año,
        fechaCierre,
        tipoPeriodo === 'MES' ? mes : undefined,
        tipoPeriodo === 'TRIMESTRE' ? trimestre : undefined,
        version
      );

      toast.success('Archivo cargado exitosamente', {
        description: 'Los estados financieros han sido procesados correctamente'
      });

      // Reset form
      setArchivo(null);
      setMes(new Date().getMonth() + 1);
      setTrimestre(undefined);
      setVersion(1);
      
      // Trigger reload
      onArchivoCargado();
    } catch (error: any) {
      toast.error('Error al cargar archivo', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Cargar Estados Financieros
        </CardTitle>
        <CardDescription>
          Cargue archivos CSV o Excel con Balance General, Estado de Resultados y Flujo de Efectivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`grid gap-4 ${empresas.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {/* Solo mostrar selector de empresa si hay más de una */}
            {empresas.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Select 
                  {...(empresaId ? { value: empresaId } : {})}
                  onValueChange={setEmpresaId} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : empresas.length === 1 && empresas[0] ? (
              <div className="space-y-2">
                <Label>Empresa</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {empresas[0].nombre}
                </div>
                <input type="hidden" value={empresas[0].id.toString()} />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="tipoPeriodo">Tipo de Periodo *</Label>
              <Select
                value={tipoPeriodo}
                onValueChange={(value) => {
                  setTipoPeriodo(value as 'MES' | 'TRIMESTRE' | 'AÑO');
                  if (value === 'TRIMESTRE') {
                    setMes(undefined);
                  } else if (value === 'AÑO') {
                    setMes(undefined);
                    setTrimestre(undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MES">Mes</SelectItem>
                  <SelectItem value="TRIMESTRE">Trimestre</SelectItem>
                  <SelectItem value="AÑO">Año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="año">Año *</Label>
              <Input
                id="año"
                type="number"
                value={año}
                onChange={(e) => setAño(Number(e.target.value))}
                min="2000"
                max="2100"
                required
              />
            </div>

            {tipoPeriodo === 'MES' && (
              <div className="space-y-2">
                <Label htmlFor="mes">Mes *</Label>
                <Select
                  value={mes?.toString() || ''}
                  onValueChange={(value) => setMes(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoPeriodo === 'TRIMESTRE' && (
              <div className="space-y-2">
                <Label htmlFor="trimestre">Trimestre *</Label>
                <Select
                  value={trimestre?.toString() || ''}
                  onValueChange={(value) => setTrimestre(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primer Trimestre</SelectItem>
                    <SelectItem value="2">Segundo Trimestre</SelectItem>
                    <SelectItem value="3">Tercer Trimestre</SelectItem>
                    <SelectItem value="4">Cuarto Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fechaCierre">Fecha de Cierre *</Label>
              <Input
                id="fechaCierre"
                type="date"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                type="number"
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archivo">Archivo (CSV/Excel) *</Label>
            <div>
              <Input
                id="archivo"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                required
              />
              {archivo && (
                <p className="text-sm text-muted-foreground mt-2">
                  Archivo seleccionado: {archivo.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || generandoDesdeVentas} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Archivo
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              disabled={loading || generandoDesdeVentas}
              onClick={async () => {
                // Obtener empresaId: prioridad: estado local > empresa seleccionada > primera empresa disponible
                let empresaIdFinal = empresaId;
                
                if (!empresaIdFinal && empresaSeleccionada) {
                  empresaIdFinal = empresaSeleccionada.toString();
                }
                
                if (!empresaIdFinal && empresas.length > 0 && empresas[0]) {
                  empresaIdFinal = empresas[0].id.toString();
                }
                
                // Si aún no hay empresaId, intentar recargar empresas desde el backend
                if (!empresaIdFinal) {
                  console.warn('No se encontró empresaId, intentando recargar empresas...');
                  try {
                    const empresasRecargadas = await afpService.obtenerEmpresas();
                    const empresasArray = Array.isArray(empresasRecargadas) ? empresasRecargadas : [];
                    if (empresasArray.length > 0 && empresasArray[0]) {
                      empresaIdFinal = empresasArray[0].id.toString();
                      // Actualizar el estado local
                      setEmpresaId(empresasArray[0].id.toString());
                    }
                  } catch (errorRecarga: any) {
                    console.error('Error al recargar empresas:', errorRecarga);
                  }
                }
                
                if (!empresaIdFinal) {
                  toast.error('No hay empresa disponible. Asegúrate de que exista al menos una empresa.');
                  console.error('No se pudo obtener empresaId. Estado:', { 
                    empresaId, 
                    empresaSeleccionada, 
                    empresasLength: empresas.length,
                    empresas 
                  });
                  return;
                }
                
                const empresaIdNum = Number(empresaIdFinal);
                
                if (isNaN(empresaIdNum) || empresaIdNum <= 0) {
                  toast.error('ID de empresa inválido');
                  console.error('ID de empresa inválido:', empresaIdFinal);
                  return;
                }
                
                console.log('Generando periodo desde ventas con empresaId:', empresaIdNum);

                if (tipoPeriodo === 'MES' && !mes) {
                  toast.error('Seleccione un mes');
                  return;
                }

                if (tipoPeriodo === 'TRIMESTRE' && !trimestre) {
                  toast.error('Seleccione un trimestre');
                  return;
                }

                try {
                  setGenerandoDesdeVentas(true);
                  await afpService.generarPeriodoDesdeVentas(
                    empresaIdNum,
                    tipoPeriodo,
                    año,
                    tipoPeriodo === 'MES' ? mes : undefined,
                    tipoPeriodo === 'TRIMESTRE' ? trimestre : undefined
                  );

                  toast.success('Periodo generado automáticamente desde ventas', {
                    description: 'Los estados financieros se han calculado desde tus ventas y pagos'
                  });

                  onArchivoCargado();
                } catch (error: any) {
                  toast.error('Error al generar periodo desde ventas', {
                    description: error.message
                  });
                } finally {
                  setGenerandoDesdeVentas(false);
                }
              }}
            >
              {generandoDesdeVentas ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generar desde Ventas
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

