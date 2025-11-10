import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart } from "lucide-react";

// Productos de ejemplo
const featuredProducts = [
  {
    id: 1,
    name: "Laptop HP Pavilion 15",
    price: 4500,
    oldPrice: 5200,
    rating: 4.5,
    reviews: 128,
    image: "/products/laptop.jpg",
    badge: "Más vendido",
    badgeColor: "bg-blue-600"
  },
  {
    id: 2,
    name: "iPhone 14 Pro 256GB",
    price: 8900,
    oldPrice: 9500,
    rating: 4.8,
    reviews: 256,
    image: "/products/iphone.jpg",
    badge: "Oferta",
    badgeColor: "bg-red-600"
  },
  {
    id: 3,
    name: "Smart TV Samsung 55\"",
    price: 3200,
    oldPrice: 3800,
    rating: 4.6,
    reviews: 89,
    image: "/products/tv.jpg",
    badge: "-15%",
    badgeColor: "bg-green-600"
  },
  {
    id: 4,
    name: "Audífonos Sony WH-1000XM5",
    price: 1800,
    oldPrice: 2100,
    rating: 4.9,
    reviews: 342,
    image: "/products/headphones.jpg",
    badge: "Nuevo",
    badgeColor: "bg-yellow-600"
  },
  {
    id: 5,
    name: "PlayStation 5 Digital",
    price: 5500,
    oldPrice: 6000,
    rating: 4.7,
    reviews: 198,
    image: "/products/ps5.jpg",
    badge: "Popular",
    badgeColor: "bg-purple-600"
  },
  {
    id: 6,
    name: "MacBook Air M2",
    price: 9800,
    oldPrice: 11000,
    rating: 4.9,
    reviews: 445,
    image: "/products/macbook.jpg",
    badge: "Premium",
    badgeColor: "bg-gray-800"
  },
];

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Productos Destacados
            </h2>
            <p className="text-lg text-gray-600">
              Los más populares esta semana
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link to="/products">Ver todos</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              {/* Imagen */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <ShoppingCart className="w-24 h-24 opacity-20" />
                </div>
                {/* Badge */}
                <div className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {product.badge}
                </div>
              </div>
              
              {/* Contenido */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.reviews})
                  </span>
                </div>
                
                {/* Precio */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    Bs {product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    Bs {product.oldPrice.toLocaleString()}
                  </span>
                </div>
                
                {/* Botón */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Agregar al carrito
                </Button>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Botón móvil */}
        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/products">Ver todos los productos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
