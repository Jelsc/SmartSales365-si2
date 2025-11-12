import { useState, useEffect } from 'react';
import type { Producto, ProductoFilters } from '@/types';
import { productosService } from '@/services';
import { ProductCard } from './components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Percent, Flame, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OfertasPage: React.FC = () => {
  const [ofertas, setOfertas] = useState<Producto[]>([]);
  const [filters, setFilters] = useState<ProductoFilters>({
    page: 1,
    page_size: 16,
    en_oferta: true,
    activo: true,
    ordering: '-creado', // Ordenar por más recientes por defecto (más seguro)
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  // Cargar ofertas
  useEffect(() => {
    const loadOfertas = async () => {
      setLoading(true);
      try {
        const response = await productosService.getAll(filters);
        setOfertas(response.results);
        setPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
        });
      } catch (error) {
        console.error('Error al cargar ofertas:', error);
        toast.error('No se pudieron cargar las ofertas');
      } finally {
        setLoading(false);
      }
    };
    loadOfertas();
  }, [filters]);

  const handleAddToCart = (producto: Producto) => {
    // TODO: Implementar carrito de compras
    toast.success(`${producto.nombre} agregado al carrito`);
    console.log('Agregar al carrito:', producto);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (ordering: string) => {
    setFilters({ ...filters, ordering, page: 1 });
  };

  const totalPages = Math.ceil(pagination.count / (filters.page_size || 16));
  const maxDescuento = ofertas.length > 0 
    ? Math.max(...ofertas.map(p => p.descuento_porcentaje)) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-white">
      {/* Header con gradiente llamativo */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <Flame className="w-12 h-12 text-yellow-300 animate-pulse mr-3" />
            <h1 className="text-5xl font-bold">Ofertas Especiales</h1>
            <Flame className="w-12 h-12 text-yellow-300 animate-pulse ml-3" />
          </div>
          <p className="text-red-100 text-xl text-center max-w-2xl mx-auto">
            ¡Aprovecha los mejores descuentos! Ofertas por tiempo limitado
          </p>
          {maxDescuento > 0 && (
            <div className="flex justify-center mt-6">
              <Badge 
                variant="error" 
                badgeType="icon" 
                className="text-2xl px-6 py-3 bg-white text-red-600 shadow-xl"
              >
                <TrendingDown className="w-6 h-6 mr-2" />
                Hasta {maxDescuento}% OFF
              </Badge>
            </div>
          )}
        </div>
        {/* Decoración de fondo */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controles de ordenamiento */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white rounded-xl p-6 shadow-md">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {pagination.count} {pagination.count === 1 ? 'Oferta' : 'Ofertas'} Disponibles
            </h2>
            <p className="text-gray-600">¡No dejes pasar estas oportunidades!</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Ordenar por:</span>
            <div className="flex gap-2">
              <Button
                variant={filters.ordering === '-descuento_porcentaje' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('-descuento_porcentaje')}
                className={filters.ordering === '-descuento_porcentaje' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Mayor descuento
              </Button>
              <Button
                variant={filters.ordering === 'precio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('precio')}
                className={filters.ordering === 'precio' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Menor precio
              </Button>
              <Button
                variant={filters.ordering === '-creado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('-creado')}
                className={filters.ordering === '-creado' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Más recientes
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de ofertas */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Cargando ofertas increíbles...</p>
            </div>
          </div>
        ) : ofertas.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-xl shadow-md">
            <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No hay ofertas disponibles en este momento
            </h3>
            <p className="text-gray-600 mb-6">
              Vuelve pronto para descubrir nuevas ofertas especiales
            </p>
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <a href="/productos">Ver todos los productos</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ofertas.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <Button
                  variant="outline"
                  disabled={!pagination.previous || loading}
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  className="px-6"
                >
                  ← Anterior
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={filters.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={filters.page === page ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <Button
                        variant={filters.page === totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className={filters.page === totalPages ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  disabled={!pagination.next || loading}
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  className="px-6"
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfertasPage;
