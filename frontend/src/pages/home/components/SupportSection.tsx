import { Button } from "@/components/ui/button";
import { Headphones, Package } from "lucide-react";

export const SupportSection = () => {
  return (
    <section id="servicio" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Atención al cliente
          </h2>
          <p className="text-lg text-gray-600">
            Estamos aquí para ayudarte
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
            <p className="text-gray-600 mb-4">
              Nuestro equipo está disponible para resolver todas tus dudas en cualquier momento.
            </p>
            <Button asChild variant="outline">
              <a href="#contacto">Contactar Soporte</a>
            </Button>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Devoluciones Fáciles</h3>
            <p className="text-gray-600 mb-4">
              30 días para devolver tu producto si no estás satisfecho. Sin preguntas.
            </p>
            <Button asChild variant="outline">
              <a href="#envios">Ver Política</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
