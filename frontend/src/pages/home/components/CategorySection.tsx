import { Link } from "react-router-dom";
import { Laptop, Shirt, Home, Heart, Book, Utensils, Smartphone, Gamepad2 } from "lucide-react";

const categories = [
  { id: 1, name: "Electrónica", icon: Laptop, color: "bg-blue-100 text-blue-600", href: "/categoria/electronica" },
  { id: 2, name: "Moda", icon: Shirt, color: "bg-pink-100 text-pink-600", href: "/categoria/moda" },
  { id: 3, name: "Hogar", icon: Home, color: "bg-green-100 text-green-600", href: "/categoria/hogar" },
  { id: 4, name: "Belleza", icon: Heart, color: "bg-red-100 text-red-600", href: "/categoria/belleza" },
  { id: 5, name: "Libros", icon: Book, color: "bg-yellow-100 text-yellow-600", href: "/categoria/libros" },
  { id: 6, name: "Alimentos", icon: Utensils, color: "bg-orange-100 text-orange-600", href: "/categoria/alimentos" },
  { id: 7, name: "Celulares", icon: Smartphone, color: "bg-purple-100 text-purple-600", href: "/categoria/celulares" },
  { id: 8, name: "Gaming", icon: Gamepad2, color: "bg-indigo-100 text-indigo-600", href: "/categoria/gaming" },
];

export function CategorySection() {
  return (
    <section id="productos" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explora por Categorías
          </h2>
          <p className="text-lg text-gray-600">
            Encuentra lo que buscas en nuestras categorías principales
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.href}
                className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`${category.color} w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
