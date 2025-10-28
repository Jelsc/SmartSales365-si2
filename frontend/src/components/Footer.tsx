import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import AppLogo from "./app-logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-[#ffffff] via-blue-200 to-blue-300 text-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <AppLogo className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600">MoviFleet</h3>
            </div>
            <p className="text-black text-sm leading-relaxed">
              Tu solución integral de transporte. Conectamos personas y lugares con 
              seguridad, comodidad y eficiencia.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-blue-600">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#inicio" className="text-black hover:text-blue-600 transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#servicios" className="text-black hover:text-blue-600 transition-colors">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#rutas" className="text-black hover:text-blue-600 transition-colors">
                  Rutas
                </a>
              </li>
              <li>
                <a href="#tarifas" className="text-black hover:text-blue-600 transition-colors">
                  Tarifas
                </a>
              </li>
              <li>
                <a href="#nosotros" className="text-black hover:text-blue-600 transition-colors">
                  Nosotros
                </a>
              </li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-blue-600">Nuestros Servicios</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-black">Transporte Nacional</li>
              <li className="text-black">Transporte Urbano</li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-blue-600">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-black">
                    Av. Principal #123<br />
                    La Paz, Bolivia
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href="tel:+59170000000" className="text-black hover:text-blue-600 transition-colors">
                  +591 7000-0000
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href="mailto:contacto@transmovil.com" className="text-black hover:text-blue-600 transition-colors">
                  contacto@transmovil.com
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-black">
                    Lun - Vie: 6:00 - 22:00<br />
                    Sáb - Dom: 7:00 - 21:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-blue-300/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-black">
              © {currentYear} TransMovil. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#privacidad" className="text-black hover:text-blue-600 transition-colors">
                Política de Privacidad
              </a>
              <a href="#terminos" className="text-black hover:text-blue-600 transition-colors">
                Términos de Servicio
              </a>
              <a href="#cookies" className="text-black hover:text-blue-600 transition-colors">
                Política de Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
