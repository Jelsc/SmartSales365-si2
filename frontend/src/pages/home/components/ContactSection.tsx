import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";

export const ContactSection = () => {
  return (
    <section id="contacto" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ¿Tienes alguna pregunta?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus dudas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
            <a href="tel:+59170000000">
              <Headphones className="w-5 h-5 mr-2" />
              Llamar Ahora
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="mailto:contacto@smartsales365.com">
              Enviar Email
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
