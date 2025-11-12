import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Producto, ProductoVariante } from '@/types';
import { productosService } from '@/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ShoppingCart, Heart, Share2, ChevronLeft, Package, Shield, TruckIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductoDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<number>(0);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<ProductoVariante | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  useEffect(() => {
    const loadProducto = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await productosService.getById(parseInt(id));
        setProducto(data);
        
        // Seleccionar primera variante si existe
        if (data.variantes && data.variantes.length > 0) {
          setVarianteSeleccionada(data.variantes[0] ?? null);
        }
      } catch (error) {
        console.error('Error al cargar producto:', error);
        toast.error('No se pudo cargar el producto');
        navigate('/productos');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducto();
  }, [id, navigate]);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(precio);
  };

  const getPrecioFinal = () => {
    if (!producto) return 0;
    let precio = producto.precio_final;
    if (varianteSeleccionada) {
      precio += varianteSeleccionada.precio_adicional;
    }
    return precio;
  };

  const getStockDisponible = () => {
    if (varianteSeleccionada) {
      return varianteSeleccionada.stock;
    }
    return producto?.stock || 0;
  };

  const handleAddToCart = () => {
    if (!producto) return;
    
    // TODO: Implementar carrito de compras
    toast.success(`${cantidad} ${producto.nombre} agregado(s) al carrito`);
    console.log({
      producto,
      variante: varianteSeleccionada,
      cantidad,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Producto no encontrado</p>
      </div>
    );
  }

  const stockDisponible = getStockDisponible();
  const tieneStock = stockDisponible > 0;
  const imagenes = producto.imagenes.length > 0 ? producto.imagenes : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          onClick={() => navigate('/productos')}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galería de imágenes */}
          <div>
            <Card>
              <CardContent className="p-4">
                {/* Imagen principal */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {imagenes.length > 0 && imagenes[imagenSeleccionada] ? (
                    <img
                      src={imagenes[imagenSeleccionada]?.imagen ?? ''}
                      alt={imagenes[imagenSeleccionada]?.alt_text ?? producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen disponible
                    </div>
                  )}
                </div>

                {/* Miniaturas */}
                {imagenes.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {imagenes.map((imagen, index) => (
                      <button
                        key={imagen.id}
                        onClick={() => setImagenSeleccionada(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          imagenSeleccionada === index
                            ? 'border-blue-600'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={imagen.imagen}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            {/* Categoría y badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {producto.categoria && (
                <Badge variant="outline">{producto.categoria.nombre}</Badge>
              )}
              {producto.destacado && (
                <Badge className="bg-yellow-500">Destacado</Badge>
              )}
              {producto.en_oferta && (
                <Badge className="bg-red-500">En oferta</Badge>
              )}
            </div>

            {/* Título y SKU */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {producto.nombre}
              </h1>
              {producto.marca && (
                <p className="text-gray-600">Marca: {producto.marca}</p>
              )}
              {producto.sku && (
                <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
              )}
            </div>

            {/* Precio */}
            <div>
              <div className="text-4xl font-bold text-blue-600">
                {formatPrecio(getPrecioFinal())}
              </div>
              {producto.en_oferta && producto.precio_oferta && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrecio(producto.precio)}
                  </span>
                  <Badge className="bg-red-500">
                    -{Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100)}% OFF
                  </Badge>
                </div>
              )}
            </div>

            {/* Variantes */}
            {producto.variantes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar variante
                </label>
                <Select
                  value={varianteSeleccionada?.id.toString() ?? ''}
                  onValueChange={(value) => {
                    const variante = producto.variantes.find(v => v.id === parseInt(value));
                    setVarianteSeleccionada(variante ?? null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {producto.variantes.map((variante) => (
                      <SelectItem key={variante.id} value={variante.id.toString()}>
                        {variante.nombre} - {formatPrecio(producto.precio_final + variante.precio_adicional)}
                        {variante.stock <= 0 && ' (Agotado)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <Select
                value={cantidad.toString()}
                onValueChange={(value) => setCantidad(parseInt(value))}
                disabled={!tieneStock}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(stockDisponible, 10) }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {tieneStock ? `${stockDisponible} disponibles` : 'Sin stock'}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                disabled={!tieneStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {tieneStock ? 'Agregar al carrito' : 'Sin stock'}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Favoritos
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>

            {/* Información adicional */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <TruckIcon className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold">Envío gratis</p>
                    <p className="text-sm text-gray-600">En compras mayores a Bs. 200</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold">Garantía de {producto.meses_garantia} meses</p>
                    <p className="text-sm text-gray-600">{producto.descripcion_garantia}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold">Devolución gratis</p>
                    <p className="text-sm text-gray-600">Tienes 30 días para devolver</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Descripción del producto */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Descripción del producto</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{producto.descripcion}</p>
            </div>

            {/* Especificaciones */}
            {(producto.modelo || producto.peso || producto.codigo_barras) && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-3">Especificaciones</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {producto.modelo && (
                    <>
                      <dt className="font-semibold text-gray-700">Modelo:</dt>
                      <dd className="text-gray-600">{producto.modelo}</dd>
                    </>
                  )}
                  {producto.peso && (
                    <>
                      <dt className="font-semibold text-gray-700">Peso:</dt>
                      <dd className="text-gray-600">{producto.peso} kg</dd>
                    </>
                  )}
                  {producto.codigo_barras && (
                    <>
                      <dt className="font-semibold text-gray-700">Código de barras:</dt>
                      <dd className="text-gray-600">{producto.codigo_barras}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductoDetallePage;
