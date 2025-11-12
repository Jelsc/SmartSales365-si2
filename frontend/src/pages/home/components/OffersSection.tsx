import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Percent, TrendingUp } from "lucide-react";

export const OffersSection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-red-600 to-orange-600 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Ofertas Limitadas</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              ¡Ofertas especiales todos los días!
            </h2>
            <p className="text-xl text-red-100 mb-6">
              Descuentos de hasta 70% en productos seleccionados. 
              No te pierdas estas increíbles oportunidades.
            </p>
            <Button asChild size="lg" className="bg-white text-red-600 hover:bg-red-50">
              <Link to="/ofertas">
                <Percent className="w-5 h-5 mr-2" />
                Ver Todas las Ofertas
              </Link>
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div className="text-9xl font-bold text-white/20">70%</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold">OFF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
