import { useEffect, useState } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { analyticsService, type MetricasGenerales, type PrediccionVentasResponse, type GraficoVentasDiarias, type ProductoTop, type ProductoBajoStock } from '@/services/analyticsService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [entrenando, setEntrenando] = useState(false);
  
  // Estados para los datos
  const [metricas, setMetricas] = useState<MetricasGenerales | null>(null);
  const [prediccion, setPrediccion] = useState<PrediccionVentasResponse | null>(null);
  const [ventasDiarias, setVentasDiarias] = useState<GraficoVentasDiarias | null>(null);
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([]);
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([]);
  const [diasPrediccion, setDiasPrediccion] = useState(7);
  const [diasGrafico, setDiasGrafico] = useState(30);

  useEffect(() => {
    cargarDatos();
  }, [diasPrediccion, diasGrafico]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [
        metricasData,
        prediccionData,
        ventasData,
        productosData,
        stockData
      ] = await Promise.all([
        analyticsService.getMetricasGenerales(),
        analyticsService.getPrediccionVentas(diasPrediccion),
        analyticsService.getGraficoVentasDiarias(diasGrafico),
        analyticsService.getProductosTop(10),
        analyticsService.getProductosBajoStock(10)
      ]);

      setMetricas(metricasData);
      setPrediccion(prediccionData);
      setVentasDiarias(ventasData);
      setProductosTop(productosData.productos);
      setProductosBajoStock(stockData.productos);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const entrenarModelo = async () => {
    try {
      setEntrenando(true);
      toast.info('Entrenando modelo de IA...');
      
      const resultado = await analyticsService.entrenarModelo();
      
      toast.success(resultado.mensaje);
      
      // Recargar predicciones
      const nuevaPrediccion = await analyticsService.getPrediccionVentas(diasPrediccion);
      setPrediccion(nuevaPrediccion);
    } catch (error) {
      console.error('Error entrenando modelo:', error);
      toast.error('Error al entrenar el modelo');
    } finally {
      setEntrenando(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Dashboard Analytics
            </h1>
            <p className="text-muted-foreground">
              Análisis predictivo con Machine Learning
            </p>
          </div>
          <Button 
            onClick={entrenarModelo} 
            disabled={entrenando}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {entrenando ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Entrenando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Re-entrenar IA
              </>
            )}
          </Button>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Bs {metricas?.ventas_mes.total.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {metricas && metricas.ventas_mes.crecimiento >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">
                      +{metricas.ventas_mes.crecimiento.toFixed(1)}% vs mes anterior
                    </p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-600 font-medium">
                      {metricas?.ventas_mes.crecimiento.toFixed(1)}% vs mes anterior
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas?.ventas_mes.cantidad_ordenes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket promedio: Bs {metricas?.ventas_mes.ticket_promedio.toFixed(2) || '0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas?.productos.total_activos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metricas?.productos.bajo_stock || 0} con stock bajo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas?.clientes.activos_mes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de análisis */}
        <Tabs defaultValue="predicciones" className="space-y-4">
          <TabsList>
            <TabsTrigger value="predicciones">
              <Sparkles className="w-4 h-4 mr-2" />
              Predicciones IA
            </TabsTrigger>
            <TabsTrigger value="historico">
              <LineChartIcon className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="productos">
              <Package className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
          </TabsList>

          {/* Tab Predicciones */}
          <TabsContent value="predicciones" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Predicción de Ventas (Machine Learning)
                    </CardTitle>
                    <CardDescription>
                      Modelo: {prediccion?.modelo} • Confiabilidad: {prediccion?.confiabilidad}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={diasPrediccion === 7 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasPrediccion(7)}
                    >
                      7 días
                    </Button>
                    <Button 
                      variant={diasPrediccion === 14 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasPrediccion(14)}
                    >
                      14 días
                    </Button>
                    <Button 
                      variant={diasPrediccion === 30 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasPrediccion(30)}
                    >
                      30 días
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Total Estimado</p>
                      <p className="text-2xl font-bold text-purple-900">
                        Bs {prediccion?.total_estimado.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-purple-600">
                      Próximos {diasPrediccion} días
                    </Badge>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prediccion?.predicciones || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia_nombre" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `Bs ${value.toLocaleString()}`}
                      labelFormatter={(label: string) => `${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="venta_estimada" 
                      stroke="#9333ea" 
                      strokeWidth={2}
                      name="Venta Estimada"
                      dot={{ fill: '#9333ea', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ventas Diarias</CardTitle>
                    <CardDescription>
                      {ventasDiarias?.periodo}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={diasGrafico === 7 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasGrafico(7)}
                    >
                      7 días
                    </Button>
                    <Button 
                      variant={diasGrafico === 30 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasGrafico(30)}
                    >
                      30 días
                    </Button>
                    <Button 
                      variant={diasGrafico === 90 ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDiasGrafico(90)}
                    >
                      90 días
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ventasDiarias?.datos || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `Bs ${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Ventas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Productos */}
          <TabsContent value="productos" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Productos más vendidos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Productos</CardTitle>
                  <CardDescription>Productos más vendidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productosTop.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="producto__nombre" type="category" width={100} />
                      <Tooltip 
                        formatter={(value: number) => `Bs ${value.toLocaleString()}`}
                      />
                      <Bar dataKey="ingresos_totales" fill="#10b981" name="Ingresos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Productos con stock bajo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Stock Bajo
                  </CardTitle>
                  <CardDescription>
                    Productos que necesitan reabastecimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productosBajoStock.slice(0, 8).map((producto) => (
                      <div 
                        key={producto.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            Bs {producto.precio.toFixed(2)}
                          </p>
                        </div>
                        <Badge 
                          variant={producto.stock <= 5 ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {producto.stock} unid.
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
