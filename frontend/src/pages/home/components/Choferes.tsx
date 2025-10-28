// src/pages/home/Choferes.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Users, Bus } from "lucide-react";

export function Choferes() {
  return (
    <section id="choferes" className="py-20 px-6 bg-white">
      <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
        Nuestros Choferes
      </h3>
      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <Card className="shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                Conductores Capacitados
              </h4>
              <p className="text-muted-foreground">
                Profesionales con experiencia y responsabilidad garantizada.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <Bus className="w-10 h-10 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                Viajes Seguros
              </h4>
              <p className="text-muted-foreground">
                Comprometidos con tu seguridad y comodidad en cada viaje.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
