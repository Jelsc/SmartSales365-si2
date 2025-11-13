import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productosService } from '@/services';
import { ProductCard } from '../productos/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Package, X, Sparkles, Filter } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Producto } from '@/types';

interface SearchMetadata {
  mode?: string;
  interpretacion?: {
    query_original: string;
    query_limpia: string;
    palabras_clave: string[];
    filtros: Record<string, any>;
  };
}

const BuscarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { agregarProducto } = useCart();
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<SearchMetadata>({});
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query.trim()) {
      realizarBusqueda();
    } else {
      setResultados([]);
      setMetadata({});
    }
  }, [query, pagination.page]);

  const realizarBusqueda = async () => {
    setLoading(true);
    try {
      const response = await productosService.buscar(query, pagination.page, pagination.pageSize);
      setResultados(response.results);
      setPagination(prev => ({
        ...prev,
        count: response.count,
        totalPages: Math.ceil(response.count / prev.pageSize),
      }));
      
      // Guardar metadata de la búsqueda (modo IA, interpretación)
      setMetadata({
        mode: (response as any).mode,
        interpretacion: (response as any).interpretacion,
      });
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setResultados([]);
      setMetadata({});
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (producto: Producto) => {
    await agregarProducto(producto.id);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarBusqueda = () => {
    navigate('/productos');
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Buscar Productos
            </h1>
            <p className="text-gray-600 mb-8">
              Usa el buscador en la parte superior para encontrar productos
            </p>
            <Button onClick={() => navigate('/productos')}>
              Ver todos los productos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de búsqueda */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Resultados de búsqueda
                </h1>
                {/* Indicador de modo de búsqueda */}
                {metadata.mode === 'semantic_ai' && (
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Búsqueda IA
                  </Badge>
                )}
                {metadata.mode === 'basic_keyword' && (
                  <Badge variant="outline">
                    <Search className="w-3 h-3 mr-1" />
                    Búsqueda básica
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600">
                Buscando: <span className="font-semibold text-blue-600">"{query}"</span>
              </p>
              
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  {pagination.count} {pagination.count === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </p>
              )}
              
              {/* Mostrar interpretación de IA si existe */}
              {metadata.interpretacion && Object.keys(metadata.interpretacion.filtros).length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Filtros detectados:</span>
                  {metadata.interpretacion.filtros.precio && (
                    <Badge variant="secondary" className="text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      Precio {metadata.interpretacion.filtros.precio}
                    </Badge>
                  )}
                  {metadata.interpretacion.filtros.en_oferta && (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                      <Filter className="w-3 h-3 mr-1" />
                      Solo ofertas
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={limpiarBusqueda}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar búsqueda
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Buscando productos...</p>
            </div>
          </div>
        ) : resultados.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-xl shadow-md">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-6">
              No encontramos productos que coincidan con "{query}"
            </p>
            
            {/* Mensaje especial si la IA está activa */}
            {metadata.mode === 'semantic_ai' && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg inline-block">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">Búsqueda inteligente activada</span>
                </div>
                <p className="text-sm text-purple-600">
                  Nuestra IA entendió tu consulta, pero no encontró productos similares
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-semibold">💡 Sugerencias:</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Búsqueda natural:</strong> Intenta "quiero una laptop" o "necesito termo"</li>
                <li>• <strong>Por voz:</strong> Usa el micrófono 🎤 y habla naturalmente</li>
                <li>• Verifica la ortografía o usa palabras más generales</li>
                <li>• Prueba con sinónimos o términos relacionados</li>
              </ul>
              <div className="mt-6">
                <Button onClick={() => navigate('/productos')} className="bg-blue-600 hover:bg-blue-700">
                  Ver todos los productos
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {resultados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1 || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-6"
                >
                  ← Anterior
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={pagination.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={pagination.page === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <Button
                        variant={pagination.page === pagination.totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className={pagination.page === pagination.totalPages ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
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

export default BuscarPage;
