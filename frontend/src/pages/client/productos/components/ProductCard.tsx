import type { Producto } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  producto: Producto;
  onAddToCart?: (producto: Producto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ producto, onAddToCart }) => {
  const navigate = useNavigate();
  
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(precio);
  };

  const calcularDescuento = () => {
    if (producto.en_oferta && producto.precio_oferta) {
      const descuento = ((producto.precio - producto.precio_oferta) / producto.precio) * 100;
      return Math.round(descuento);
    }
    return 0;
  };

  // Priorizar producto.imagen sobre imagenes array
  const imagenUrl = producto.imagen || producto.imagenes?.find(img => img.es_principal)?.imagen || producto.imagenes?.[0]?.imagen;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Si la imagen falla, mostrar placeholder
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"
          style={{ display: imagenUrl ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Sin imagen</p>
          </div>
        </div>
        
        {producto.en_oferta && calcularDescuento() > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{calcularDescuento()}%
          </Badge>
        )}
        
        {producto.destacado && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
            Destacado
          </Badge>
        )}

        {!producto.stock || producto.stock === 0 && (
          <Badge className="absolute bottom-2 right-2 bg-gray-500 text-white">
            Agotado
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Categoría */}
        {producto.categoria && (
          <p className="text-xs text-gray-500 mb-1">{producto.categoria.nombre}</p>
        )}

        {/* Nombre del producto */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
          {producto.nombre}
        </h3>

        {/* Descripción corta */}
        {producto.descripcion_corta && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {producto.descripcion_corta}
          </p>
        )}

        {/* Precios */}
        <div className="mb-4">
          {producto.en_oferta && producto.precio_oferta ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">
                {formatPrecio(producto.precio_oferta)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrecio(producto.precio)}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              {formatPrecio(producto.precio)}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="mb-4">
          {producto.stock > 0 ? (
            <p className="text-sm text-green-600">
              Stock: {producto.stock} unidades
            </p>
          ) : (
            <p className="text-sm text-red-600">Sin stock</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/productos/${producto.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
          
          {producto.stock > 0 && onAddToCart && (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => onAddToCart(producto)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
