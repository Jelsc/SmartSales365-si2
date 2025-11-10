import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Flame, ArrowRight } from "lucide-react";

const offers = [
  {
    id: 1,
    title: "Ofertas Flash",
    subtitle: "Hasta 50% de descuento",
    description: "Solo por 24 horas",
    bgColor: "bg-gradient-to-br from-red-500 to-orange-600",
    icon: Flame,
    href: "/ofertas/flash"
  },
  {
    id: 2,
    title: "Electrónica",
    subtitle: "Tecnología al mejor precio",
    description: "Descuentos especiales",
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
    icon: Clock,
    href: "/ofertas/electronica"
  },
  {
    id: 3,
    title: "Liquidación",
    subtitle: "Últimas unidades",
    description: "Hasta 70% OFF",
    bgColor: "bg-gradient-to-br from-purple-500 to-pink-600",
    icon: Flame,
    href: "/ofertas/liquidacion"
  },
];

export function OffersSection() {
  return (
    <section id="ofertas" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ofertas Especiales
          </h2>
          <p className="text-lg text-gray-600">
            Aprovecha los descuentos por tiempo limitado
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const Icon = offer.icon;
            return (
              <Link
                key={offer.id}
                to={offer.href}
                className={`group relative ${offer.bgColor} rounded-2xl p-8 text-white overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl`}
              >
                {/* Decoración de fondo */}
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <Icon className="w-12 h-12 mb-4 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                    <p className="text-lg font-semibold opacity-90">{offer.subtitle}</p>
                    <p className="text-sm opacity-75 mt-1">{offer.description}</p>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    className="bg-white text-gray-900 hover:bg-gray-100 group-hover:translate-x-1 transition-transform"
                  >
                    Ver ofertas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
