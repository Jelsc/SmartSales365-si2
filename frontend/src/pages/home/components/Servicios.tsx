import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Package, Map } from "lucide-react";

export function Servicios() {
  return (
    <section id="servicios" className="py-20 bg-white px-6">
      <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
        Nuestros Servicios
      </h3>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Ticket className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              Compra de Pasajes
            </h4>
            <p className="text-muted-foreground">
              Reserva y compra tus boletos fácilmente desde cualquier lugar.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              Envío de Encomiendas
            </h4>
            <p className="text-muted-foreground">
              Envía paquetes de forma rápida, confiable y segura.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Map className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              Gestión de Rutas
            </h4>
            <p className="text-muted-foreground">
              Consulta y organiza las rutas de la flota en tiempo real.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
