import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export const CategorySection = () => {
  const categories = [
    { name: "Electrónica", icon: "💻", color: "from-blue-500 to-cyan-500" },
    { name: "Ropa & Moda", icon: "👕", color: "from-pink-500 to-rose-500" },
    { name: "Hogar", icon: "🏠", color: "from-orange-500 to-amber-500" },
    { name: "Deportes", icon: "⚽", color: "from-green-500 to-emerald-500" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explora nuestras categorías
          </h2>
          <p className="text-lg text-gray-600">
            Encuentra exactamente lo que buscas
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to="/productos"
              className="group bg-gradient-to-br bg-gray-50 hover:shadow-lg rounded-xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button asChild size="lg" variant="outline">
            <Link to="/productos">
              <Package className="w-5 h-5 mr-2" />
              Ver Todas las Categorías
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
