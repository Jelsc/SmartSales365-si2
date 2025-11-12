import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Percent, Star } from "lucide-react";
import SmartSalesIcon from "@/components/app-logo";

export const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Bienvenido a SmartSales365</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Tu tienda en línea de confianza
            </h1>
            <p className="text-xl text-blue-100">
              Encuentra los mejores productos con la mejor calidad y precio. 
              Envíos rápidos y garantía en todos nuestros productos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link to="/productos">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Ver Productos
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/ofertas" className="text-white hover:bg-white/10">
                  <Percent className="w-5 h-5 mr-2" />
                  Ver Ofertas
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-3xl opacity-20"></div>
              <SmartSalesIcon className="w-64 h-64 relative z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
