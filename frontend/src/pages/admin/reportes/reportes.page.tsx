import React, { useState } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { VoiceRecognition } from '@/components/voice-recognition';
import { reportesService, type DatosReporte, type RespuestaMultiReporte } from '@/services/reportesService';
import { FileText, Sparkles, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportes, setReportes] = useState<DatosReporte[]>([]);

  const handleVoiceTranscript = (transcript: string) => {
    // Actualizar el prompt inmediatamente para el input
    setPrompt(transcript);

    // Detectar formato en el comando de voz
    const textoLower = transcript.toLowerCase();
    let formatoDetectado: 'pantalla' | 'pdf' | 'excel' | null = null;

    if (textoLower.includes('en pdf') || textoLower.includes('pdf')) {
      formatoDetectado = 'pdf';
    } else if (textoLower.includes('en excel') || textoLower.includes('excel')) {
      formatoDetectado = 'excel';
    }

    // Si se detectó formato, generar automáticamente usando el transcript directo
    if (formatoDetectado) {
      const formato = formatoDetectado;
      toast.info(`Formato ${formato.toUpperCase()} detectado. Generando...`);
      setTimeout(() => {
        generarReporte(formato, transcript);
      }, 100);
    } else {
      // Si no especificó formato, mostrar vista previa
      toast.info('No se especificó formato. Mostrando vista previa...');
      setTimeout(() => {
        generarReporte('pantalla', transcript);
      }, 100);
    }
  };



  const generarReporte = async (formato: 'pantalla' | 'pdf' | 'excel', promptOverride?: string) => {
    const promptToUse = typeof promptOverride === 'string' ? promptOverride : prompt;

    if (!promptToUse.trim()) {
      toast.error('Escribe o dicta un comando primero');
      return;
    }

    try {
      setLoading(true);
      toast.info(`Generando reporte en ${formato.toUpperCase()}...`);

      const resultado = await reportesService.generarReporte(promptToUse, formato);

      if (formato === 'pantalla') {
        // Verificar si es múltiple o único
        if ('reportes' in resultado && Array.isArray(resultado.reportes)) {
          setReportes(resultado.reportes);
          toast.success(`${resultado.cantidad_reportes} reporte(s) generado(s) exitosamente`);
        } else {
          setReportes([resultado as DatosReporte]);
          toast.success('Reporte generado exitosamente');
        }
      } else {
        const archivo = resultado as { blob: Blob; filename: string };

        try {
          reportesService.descargarArchivo(archivo.blob, archivo.filename);
          toast.success(`Reporte ${formato.toUpperCase()} descargado: ${archivo.filename}`);
        } catch (downloadError: any) {
          console.error('Error al descargar:', downloadError);
          toast.error('Error al descargar el archivo: ' + downloadError.message);
        }
      }
    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      toast.error(error.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const ejemplos = [
    'Quiero un reporte de ventas del mes de noviembre, agrupado por producto, en PDF',
    'Quiero un reporte en Excel que muestre las ventas del periodo del 01/10/2024 al 01/01/2025. Debe mostrar el nombre del cliente, la cantidad de compras que realizó, el monto total que pagó y el rango de fechas en las que hizo la compra',
    'Generar reporte de ventas de los últimos 30 días agrupado por cliente',
    'Mostrar ventas del último mes por categoría Y también mostrar productos más vendidos',
    'Quiero ver 2 reportes: primero las ventas por cliente del mes actual y segundo el top 10 productos más vendidos',
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Generador de Reportes Inteligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera reportes dinámicos usando lenguaje natural o comandos de voz
          </p>
        </div>

        {/* Input de comando */}
        <Card>
          <CardHeader>
            <CardTitle>Comando para Reporte</CardTitle>
            <CardDescription>
              Describe el reporte que deseas generar en lenguaje natural
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ej: Quiero un reporte de ventas del mes de septiembre, agrupado por producto, en PDF"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />

            <div className="flex flex-wrap gap-2">
              <VoiceRecognition onTranscript={handleVoiceTranscript} />

              <div className="flex-1" />

              <Button
                onClick={() => generarReporte('pantalla')}
                variant="outline"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Vista Previa
              </Button>

              <Button
                onClick={() => generarReporte('pdf')}
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generar PDF
              </Button>

              <Button
                onClick={() => generarReporte('excel')}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Generar Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ejemplos de Comandos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ejemplos.map((ejemplo, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(ejemplo)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                >
                  💡 {ejemplo}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resultados - Solo para formato pantalla */}
        {reportes.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Vista Previa en Pantalla</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setReportes([])}
              >
                Limpiar
              </Button>
            </div>
            {reportes.map((reporte, reporteIndex) => (
              <Card key={reporteIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      {reportes.length > 1 && (
                        <Badge className="mb-2">Reporte {reporteIndex + 1} de {reportes.length}</Badge>
                      )}
                      <CardTitle>{reporte.titulo}</CardTitle>
                      <CardDescription>{reporte.subtitulo}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {reporte.total_registros} registros
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {reporte.datos && reporte.datos.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            {reporte.columnas.map((columna, index) => (
                              <th key={index} className="border border-gray-300 px-4 py-2 text-left font-bold">
                                {columna}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.datos.map((fila, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {reporte.columnas.map((columna, colIndex) => {
                                // Normalizar la clave de la misma forma que en el backend
                                let key = columna.toLowerCase();
                                // Remover palabras conectoras
                                key = key.replace(/ de /g, '_').replace(/ del /g, '_').replace(/ la /g, '_');
                                // Reemplazar espacios restantes
                                key = key.replace(/ /g, '_');
                                // Remover acentos
                                key = key.replace(/á/g, 'a').replace(/é/g, 'e')
                                  .replace(/í/g, 'i').replace(/ó/g, 'o')
                                  .replace(/ú/g, 'u');
                                
                                const valor = fila[key];
                                
                                return (
                                  <td key={colIndex} className="border border-gray-300 px-4 py-2">
                                    {typeof valor === 'number' && (key.includes('total') || key.includes('monto') || key.includes('precio') || key.includes('vendido'))
                                      ? `Bs ${valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : valor ?? '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No hay datos para mostrar
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
