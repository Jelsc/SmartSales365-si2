import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Contenido izquierdo */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Envío gratis en compras mayores a Bs 200</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Todo lo que necesitas,
              <span className="block text-yellow-300">en un solo lugar</span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-50">
              Descubre miles de productos con los mejores precios y ofertas exclusivas.
              Compra seguro y recibe en la puerta de tu casa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild
                size="lg" 
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-lg px-8 py-6"
              >
                <Link to="/products">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Explorar Productos
                </Link>
              </Button>
              
              <Button 
                asChild
                size="lg" 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm text-lg px-8 py-6"
              >
                <Link to="#ofertas">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Ver Ofertas
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-6 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">10,000+</div>
                <div className="text-sm text-blue-100">Productos</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5,000+</div>
                <div className="text-sm text-blue-100">Clientes Felices</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-blue-100">Soporte</div>
              </div>
            </div>
          </div>
          
          {/* Imagen derecha - mockup de productos */}
          <div className="relative hidden md:block">
            <div className="relative z-10">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-32 h-32 text-blue-600" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            
            {/* Elementos flotantes decorativos */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-30 animate-pulse delay-75"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
