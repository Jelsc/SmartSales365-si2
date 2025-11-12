import { useState, useEffect } from 'react';
import type { Producto, Categoria, ProductoFilters } from '@/types';
import { productosService, categoriasService } from '@/services';
import { ProductCard } from './components/ProductCard';
import { ProductFilters as FiltersComponent } from './components/ProductFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filters, setFilters] = useState<ProductoFilters>({
    page: 1,
    page_size: 12,
    ordering: '-creado',
  });
  const [loading, setLoading] = useState(true);
  const [loadingDestacados, setLoadingDestacados] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar categorías
        const categoriasData = await categoriasService.getAll();
        setCategorias(categoriasData.filter(cat => cat.activa));

        // Cargar productos destacados
        setLoadingDestacados(true);
        try {
          const destacadosData = await productosService.getAll({ 
            destacado: true, 
            activo: true,
            page_size: 8 
          });
          setDestacados(destacadosData.results);
        } catch (error) {
          console.error('Error al cargar destacados:', error);
        } finally {
          setLoadingDestacados(false);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar la información');
      }
    };
    loadInitialData();
  }, []);

  // Cargar productos con filtros
  useEffect(() => {
    const loadProductos = async () => {
      setLoading(true);
      try {
        const response = await productosService.getAll(filters);
        setProductos(response.results);
        setPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
        });
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast.error('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    loadProductos();
  }, [filters]);

  const handleFiltersChange = (newFilters: ProductoFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset a página 1 cuando cambian filtros
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      page_size: 12,
      ordering: '-creado',
    });
  };

  const handleAddToCart = (producto: Producto) => {
    // TODO: Implementar carrito de compras
    toast.success(`${producto.nombre} agregado al carrito`);
    console.log('Agregar al carrito:', producto);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(pagination.count / (filters.page_size || 12));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-blue-100 text-lg">
            Descubre nuestra amplia variedad de productos
          </p>
        </div>
      </div>

      {/* Categorías con imágenes - Grid compacto */}
      {categorias.length > 0 && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Explora por Categoría</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => {
                    // Toggle: si ya está seleccionada, deseleccionar; si no, seleccionar
                    if (filters.categoria === categoria.id) {
                      const newFilters = { ...filters };
                      delete newFilters.categoria;
                      handleFiltersChange(newFilters);
                    } else {
                      handleFiltersChange({ ...filters, categoria: categoria.id });
                    }
                  }}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                    filters.categoria === categoria.id
                      ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200">
                    {categoria.imagen ? (
                      <img
                        src={categoria.imagen}
                        alt={categoria.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si la imagen falla al cargar, mostrar fallback
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ display: categoria.imagen ? 'none' : 'flex' }}
                    >
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                      <h3 className="text-white font-semibold text-xs leading-tight line-clamp-2">
                        {categoria.nombre}
                      </h3>
                    </div>
                    {filters.categoria === categoria.id && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Productos destacados - Solo si hay */}
      {destacados.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
              </div>
              <Badge variant="warning" badgeType="icon" size="md">
                {destacados.length} {destacados.length === 1 ? 'producto' : 'productos'}
              </Badge>
            </div>
            {loadingDestacados ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {destacados.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Separador */}
      <div className="h-px bg-gray-200 my-8"></div>

      {/* Catálogo completo */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con filtros */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <FiltersComponent
                filters={filters}
                categorias={categorias}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {/* Grid de productos */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Todos los Productos
              </h2>
              <p className="text-gray-600">
                {pagination.count} {pagination.count === 1 ? 'producto' : 'productos'} disponibles
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-600">No se encontraron productos</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productos.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={!pagination.previous || loading}
                      onClick={() => handlePageChange((filters.page || 1) - 1)}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-gray-600">
                      Página {filters.page} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      disabled={!pagination.next || loading}
                      onClick={() => handlePageChange((filters.page || 1) + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductosPage;
