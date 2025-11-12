import { Truck, Shield, CreditCard } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Truck,
      title: "Envío Rápido",
      description: "Entrega en 24-48 horas en toda Bolivia. Seguimiento en tiempo real de tu pedido.",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Protección total en tus compras. Garantía de satisfacción o te devolvemos tu dinero.",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      icon: CreditCard,
      title: "Pago Flexible",
      description: "Múltiples métodos de pago: tarjetas, transferencias, QR y pago contra entrega.",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué comprar con nosotros?
          </h2>
          <p className="text-lg text-gray-600">
            Ofrecemos la mejor experiencia de compra en línea
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
