import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TransporteIcon from "./app-logo";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NavUserHeader } from "./nav-user-header";

const navbarOptions = [
  { id: "servicios", name: "Servicios", href: "#servicios" },
  { id: "rutas", name: "Rutas", href: "#rutas" },
  { id: "choferes", name: "Choferes", href: "#choferes" },
  { id: "contacto", name: "Contacto", href: "#contacto" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <header className="flex justify-between items-center px-4 md:px-10 py-2 md:py-3 shadow-md bg-white sticky top-0 z-50">
      <h1 className="text-sm font-bold text-blue-700 flex items-center gap-1 md:gap-2">
        <TransporteIcon className="w-8 h-8 md:w-10 md:h-10" />
        <span className="text-lg md:text-xl leading-none">MoviFleet</span>
      </h1>
      {/* Desktop nav */}
      <nav className="space-x-0 hidden md:flex flex-row md:space-x-6 gap-2 md:gap-0">
        {navbarOptions.map((opt) => (
          <a
            key={opt.id}
            href={opt.href}
            className="hover:text-blue-600 px-2 py-1 md:px-0 md:py-0"
          >
            {opt.name}
          </a>
        ))}
      </nav>
      {/* Desktop buttons */}
      <div className="hidden md:flex items-center space-x-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        ) : isAuthenticated ? (
          <NavUserHeader />
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-900 hover:border-gray-400 transition-colors w-full md:w-auto"
            >
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button
              asChild
              variant="default"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
            >
              <Link to="/register">Registrarse</Link>
            </Button>
          </>
        )}
      </div>
      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <div className="relative w-5 h-5">
            <span 
              className={`absolute block h-0.5 w-5 bg-gray-700 transition-all duration-300 ease-in-out ${
                menuOpen ? 'rotate-45 top-2' : 'top-1'
              }`}
            />
            <span 
              className={`absolute block h-0.5 w-5 bg-gray-700 transition-all duration-300 ease-in-out top-2 ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span 
              className={`absolute block h-0.5 w-5 bg-gray-700 transition-all duration-300 ease-in-out ${
                menuOpen ? '-rotate-45 top-2' : 'top-3'
              }`}
            />
          </div>
        </Button>
      </div>
      
      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
          menuOpen 
            ? 'bg-black/50 backdrop-blur-sm opacity-100' 
            : 'bg-transparent backdrop-blur-0 opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 w-80 h-full bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
            menuOpen 
              ? 'translate-x-0' 
              : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TransporteIcon className="w-6 h-6" />
              <span className="text-lg font-bold text-blue-700">MoviFleet</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col p-6 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navegación
            </h3>
            {navbarOptions.map((opt, index) => (
              <button
                key={opt.id}
                onClick={() => {
                  setActiveModule(opt.id);
                  setMenuOpen(false);
                  window.location.href = opt.href;
                }}
                className={`group flex items-center px-4 py-3 text-base rounded-xl text-left transition-all duration-200 ${
                  activeModule === opt.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: menuOpen ? 'slideInRight 0.3s ease-out forwards' : 'none'
                }}
              >
                <span className="font-medium">{opt.name}</span>
                <div className={`ml-auto w-2 h-2 rounded-full transition-colors ${
                  activeModule === opt.id ? 'bg-blue-600' : 'bg-transparent'
                }`} />
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="mt-auto p-6 border-t border-gray-100">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : isAuthenticated ? (
              <NavUserHeader />
            ) : (
              <div className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full py-3 text-gray-700 border border-gray-300 rounded-xl hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    Crear Cuenta
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
