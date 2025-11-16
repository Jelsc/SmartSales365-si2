import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, Trash2, ExternalLink } from 'lucide-react';
import { favoritosService, type Favorito } from '@/services/favoritosService';
import { toast } from 'sonner';

const FavoritosPage = () => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFavoritos();
  }, []);

  const loadFavoritos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await favoritosService.getFavoritos();
      setFavoritos(data);
    } catch (err: any) {
      console.error('Error al cargar favoritos:', err);
      setError(err.message || 'Error al cargar los favoritos');
      toast.error('Error al cargar los favoritos');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (favoritoId: number, productoId: number) => {
    try {
      setEliminando(favoritoId);
      await favoritosService.eliminarFavoritoPorId(favoritoId);
      setFavoritos(favoritos.filter(f => f.id !== favoritoId));
      toast.success('Producto eliminado de favoritos');
    } catch (err: any) {
      console.error('Error al eliminar favorito:', err);
      toast.error('Error al eliminar el favorito');
    } finally {
      setEliminando(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `Bs ${numPrice.toFixed(2)}`;
  };

  const handleVerProducto = (slug: string) => {
    navigate(`/productos/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-900">Mis Favoritos</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {favoritos.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No tienes favoritos aún</h2>
          <p className="text-gray-600 mb-8">
            Marca productos como favoritos para verlos aquí
          </p>
          <Button onClick={() => navigate('/productos')} className="bg-blue-600 hover:bg-blue-700">
            Ver Productos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {favoritos.map((favorito) => (
            <Card key={favorito.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Imagen del producto */}
                  <div 
                    className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-gray-100 cursor-pointer flex-shrink-0"
                    onClick={() => handleVerProducto(favorito.producto.slug)}
                  >
                    {favorito.producto.imagen_principal || favorito.producto.imagen ? (
                      <img
                        src={favorito.producto.imagen_principal || favorito.producto.imagen || ''}
                        alt={favorito.producto.nombre}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Heart className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleVerProducto(favorito.producto.slug)}
                        >
                          {favorito.producto.nombre}
                        </h3>
                        <Badge variant="outline" className="mb-2">
                          {favorito.producto.categoria_nombre}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleEliminar(favorito.id, favorito.producto.id)}
                        variant="ghost"
                        size="sm"
                        disabled={eliminando === favorito.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        {eliminando === favorito.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(favorito.producto.precio_final)}
                      </p>
                      {favorito.producto.en_oferta && (
                        <Badge className="bg-green-100 text-green-800">
                          Oferta
                        </Badge>
                      )}
                      {!favorito.producto.tiene_stock && (
                        <Badge variant="destructive">
                          Sin Stock
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Agregado el {formatDate(favorito.creado)}
                    </p>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleVerProducto(favorito.producto.slug)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Producto
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritosPage;

