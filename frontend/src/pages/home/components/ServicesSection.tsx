import { Truck, Shield, CreditCard, Headphones } from "lucide-react";

const services = [
  {
    id: 1,
    icon: Truck,
    title: "Envío Gratis",
    description: "En compras mayores a Bs 200",
    color: "text-blue-600 bg-blue-100"
  },
  {
    id: 2,
    icon: Shield,
    title: "Compra Segura",
    description: "Protección en todas tus compras",
    color: "text-green-600 bg-green-100"
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Múltiples Pagos",
    description: "Tarjetas, QR y efectivo",
    color: "text-purple-600 bg-purple-100"
  },
  {
    id: 4,
    icon: Headphones,
    title: "Soporte 24/7",
    description: "Te ayudamos cuando lo necesites",
    color: "text-orange-600 bg-orange-100"
  },
];

export function ServicesSection() {
  return (
    <section id="servicio" className="py-16 bg-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className={`${service.color} w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
