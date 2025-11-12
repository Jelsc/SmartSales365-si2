import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import SmartSalesIcon from "./app-logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <SmartSalesIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">SmartSales365</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tu tienda en línea confiable. Encuentra los mejores productos con la mejor calidad y precio.
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
            <h4 className="text-lg font-semibold text-gray-900">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/ofertas" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Ofertas
                </Link>
              </li>
              <li>
                <a href="#servicio" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Servicio al Cliente
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#preguntas" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#envios" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Envíos y Devoluciones
                </a>
              </li>
              <li>
                <a href="#metodos-pago" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Métodos de Pago
                </a>
              </li>
              <li>
                <a href="#garantia" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Garantía
                </a>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-600">
                    Av. Principal #123<br />
                    La Paz, Bolivia
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href="tel:+59170000000" className="text-gray-600 hover:text-blue-600 transition-colors">
                  +591 7000-0000
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href="mailto:contacto@smartsales365.com" className="text-gray-600 hover:text-blue-600 transition-colors">
                  contacto@smartsales365.com
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-600">
                    Lun - Vie: 9:00 - 18:00<br />
                    Sáb: 9:00 - 13:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © {currentYear} SmartSales365. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#privacidad" className="text-gray-600 hover:text-blue-600 transition-colors">
                Política de Privacidad
              </a>
              <a href="#terminos" className="text-gray-600 hover:text-blue-600 transition-colors">
                Términos de Servicio
              </a>
              <a href="#cookies" className="text-gray-600 hover:text-blue-600 transition-colors">
                Política de Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
