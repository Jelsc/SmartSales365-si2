import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de suscripción
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 3000);
  };

  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          <Mail className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Suscríbete a nuestro newsletter
          </h2>
          <p className="text-lg text-blue-100">
            Recibe ofertas exclusivas, nuevos productos y promociones especiales
          </p>
        </div>
        
        {subscribed ? (
          <div className="flex items-center justify-center gap-3 bg-green-500 rounded-xl py-4 px-6 text-white animate-in fade-in duration-500">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold">¡Gracias por suscribirte!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4"
            >
              Suscribirse
            </Button>
          </form>
        )}
        
        <p className="text-sm text-blue-200 mt-4">
          No compartimos tu información. Puedes darte de baja en cualquier momento.
        </p>
      </div>
    </section>
  );
}
