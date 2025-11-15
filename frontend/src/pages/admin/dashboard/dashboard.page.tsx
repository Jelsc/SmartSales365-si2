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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [entrenando, setEntrenando] = useState(false);
  
  // Estados para los datos
  const [metricas, setMetricas] = useState<MetricasGenerales | null>(null);
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([]);
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([]);
  
  // Precargamos todas las predicciones y gráficos
  const [predicciones, setPredicciones] = useState<{
    dias7: PrediccionVentasResponse | null;
    dias14: PrediccionVentasResponse | null;
    dias30: PrediccionVentasResponse | null;
  }>({
    dias7: null,
    dias14: null,
    dias30: null,
  });
  
  const [ventasDiarias, setVentasDiarias] = useState<{
    dias7: GraficoVentasDiarias | null;
    dias30: GraficoVentasDiarias | null;
    dias90: GraficoVentasDiarias | null;
  }>({
    dias7: null,
    dias30: null,
    dias90: null,
  });
  
  // Estados para UI (qué tab está activo)
  const [diasPrediccion, setDiasPrediccion] = useState<7 | 14 | 30>(7);
  const [diasGrafico, setDiasGrafico] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    cargarDatos();
  }, []); // Solo se ejecuta una vez al montar

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar TODOS los datos en paralelo (una sola vez)
      const [
        metricasData,
        prediccion7,
        prediccion14,
        prediccion30,
        ventas7,
        ventas30,
        ventas90,
        productosData,
        stockData
      ] = await Promise.all([
        analyticsService.getMetricasGenerales(),
        // Predicciones para 7, 14 y 30 días
        analyticsService.getPrediccionVentas(7),
        analyticsService.getPrediccionVentas(14),
        analyticsService.getPrediccionVentas(30),
        // Gráficos históricos para 7, 30 y 90 días
        analyticsService.getGraficoVentasDiarias(7),
        analyticsService.getGraficoVentasDiarias(30),
        analyticsService.getGraficoVentasDiarias(90),
        // Productos
        analyticsService.getProductosTop(10),
        analyticsService.getProductosBajoStock(10)
      ]);

      setMetricas(metricasData);
      setPredicciones({
        dias7: prediccion7,
        dias14: prediccion14,
        dias30: prediccion30,
      });
      setVentasDiarias({
        dias7: ventas7,
        dias30: ventas30,
        dias90: ventas90,
      });
      console.log('Productos recibidos:', productosData.productos);
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
      
      // Recargar TODAS las predicciones
      const [pred7, pred14, pred30] = await Promise.all([
        analyticsService.getPrediccionVentas(7),
        analyticsService.getPrediccionVentas(14),
        analyticsService.getPrediccionVentas(30),
      ]);
      
      setPredicciones({
        dias7: pred7,
        dias14: pred14,
        dias30: pred30,
      });
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
                Actualizar Predicciones
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Predicción de Ventas (Machine Learning)
                    </CardTitle>
                    <CardDescription>
                      Modelo: {predicciones[`dias${diasPrediccion}` as keyof typeof predicciones]?.modelo} • Confiabilidad: {predicciones[`dias${diasPrediccion}` as keyof typeof predicciones]?.confiabilidad}
                    </CardDescription>
                  </div>
                  <Tabs 
                    value={diasPrediccion.toString()} 
                    onValueChange={(value) => setDiasPrediccion(Number(value) as 7 | 14 | 30)}
                  >
                    <TabsList>
                      <TabsTrigger value="7">7 días</TabsTrigger>
                      <TabsTrigger value="14">14 días</TabsTrigger>
                      <TabsTrigger value="30">30 días</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Total Estimado</p>
                      <p className="text-2xl font-bold text-purple-900">
                        Bs {predicciones[`dias${diasPrediccion}` as keyof typeof predicciones]?.total_estimado.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-purple-600 text-white">
                      Próximos {diasPrediccion} días
                    </Badge>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predicciones[`dias${diasPrediccion}` as keyof typeof predicciones]?.predicciones || []}>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle>Ventas Diarias</CardTitle>
                    <CardDescription>
                      {ventasDiarias[`dias${diasGrafico}` as keyof typeof ventasDiarias]?.periodo}
                    </CardDescription>
                  </div>
                  <Tabs 
                    value={diasGrafico.toString()} 
                    onValueChange={(value) => setDiasGrafico(Number(value) as 7 | 30 | 90)}
                  >
                    <TabsList>
                      <TabsTrigger value="7">7 días</TabsTrigger>
                      <TabsTrigger value="30">30 días</TabsTrigger>
                      <TabsTrigger value="90">90 días</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ventasDiarias[`dias${diasGrafico}` as keyof typeof ventasDiarias]?.datos || []}>
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
            {/* Fila superior: Diagrama de torta y Top 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Diagrama de torta */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Ingresos</CardTitle>
                  <CardDescription>Top 5 productos por ingresos totales</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {productosTop.length > 0 ? (
                    <>
                      <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={productosTop.slice(0, 5).map((producto) => ({
                                name: producto.producto__nombre.length > 20 
                                  ? producto.producto__nombre.substring(0, 20) + '...' 
                                  : producto.producto__nombre,
                                value: producto.ingresos_totales,
                                fullName: producto.producto__nombre
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {productosTop.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `Bs ${value.toLocaleString()}`}
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Mini lista de porcentajes */}
                      <div className="border-t p-4 space-y-2 bg-gray-50/50">
                        {productosTop.slice(0, 5).map((producto, index) => {
                          const totalIngresos = productosTop.slice(0, 5).reduce((sum, p) => sum + p.ingresos_totales, 0);
                          const porcentaje = (producto.ingresos_totales / totalIngresos) * 100;
                          return (
                            <div key={producto.producto__id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full shrink-0" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-muted-foreground truncate">{producto.producto__nombre}</span>
                              </div>
                              <span className="font-semibold text-gray-900 ml-2">{porcentaje.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos de productos vendidos
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Productos</CardTitle>
                  <CardDescription>Productos más vendidos por cantidad e ingresos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productosTop.slice(0, 5).map((producto, index) => (
                      <div 
                        key={producto.producto__id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{producto.producto__nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {producto.producto__categoria__nombre}
                            </Badge>
                            <span className="text-xs text-blue-600 font-medium">
                              {producto.total_vendido} unid.
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold text-green-600">
                            Bs {producto.ingresos_totales.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {producto.total_vendido} vendidos
                          </div>
                        </div>
                      </div>
                    ))}
                    {productosTop.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay datos de productos vendidos
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fila inferior: Stock bajo */}
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
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            Bs {producto.precio.toFixed(2)}
                          </p>
                        </div>
                        <Badge 
                          variant={producto.stock <= 5 ? 'destructive' : 'secondary'}
                        >
                          {producto.stock} unid.
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {productosBajoStock.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay productos con stock bajo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
