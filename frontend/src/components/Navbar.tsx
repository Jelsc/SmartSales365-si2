import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SmartSalesIcon from "./app-logo";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { NavUserHeader } from "./nav-user-header";
import { SearchBar } from "./SearchBar";

const navbarOptions = [
  { id: "inicio", name: "Inicio", href: "/" },
  { id: "productos", name: "Productos", href: "/productos" },
  { id: "ofertas", name: "Ofertas", href: "/ofertas" },
  { id: "servicio", name: "Servicio al Cliente", href: "#servicio" },
  { id: "contacto", name: "Contacto", href: "#contacto" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const { itemsCount } = useCart();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Center group: Logo + Search + Cart */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <SmartSalesIcon className="w-10 h-10" />
              <div className="hidden sm:block">
                <div className="text-blue-600 font-bold text-xl leading-none">SmartSales</div>
                <div className="text-blue-500 text-xs">365</div>
              </div>
            </Link>

            <div className="flex-1 max-w-2xl">
              <SearchBar />
            </div>

            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile: Logo only */}
          <Link to="/" className="md:hidden flex items-center gap-2 flex-shrink-0">
            <SmartSalesIcon className="w-10 h-10" />
            <div className="block">
              <div className="text-blue-600 font-bold text-xl leading-none">SmartSales</div>
              <div className="text-blue-500 text-xs">365</div>
            </div>
          </Link>

          {/* Right group: User actions - Desktop */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : isAuthenticated ? (
              <NavUserHeader />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Ingresa</Link>
                </Button>
                <Button asChild variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Link to="/register">Crea tu cuenta</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Search bar - Mobile */}
        <div className="md:hidden mt-3">
          <SearchBar placeholder="Buscar productos..." />
        </div>
      </div>

      {/* Secondary nav - Categories */}
      <nav className="hidden md:block bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 py-2 text-sm overflow-x-auto">
            {navbarOptions.map((opt) => (
              opt.href.startsWith('/') ? (
                <Link
                  key={opt.id}
                  to={opt.href}
                  className="text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors font-medium"
                >
                  {opt.name}
                </Link>
              ) : (
                <a
                  key={opt.id}
                  href={opt.href}
                  className="text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors font-medium"
                >
                  {opt.name}
                </a>
              )
            ))}
          </div>
        </div>
      </nav>
      
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
              <SmartSalesIcon className="w-6 h-6" />
              <span className="text-lg font-bold text-blue-700">SmartSales365</span>
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
          <nav className="flex flex-col p-6 space-y-2 flex-1 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navegación
            </h3>
            {navbarOptions.map((opt, index) => (
              opt.href.startsWith('/') ? (
                <Link
                  key={opt.id}
                  to={opt.href}
                  onClick={() => {
                    setActiveModule(opt.id);
                    setMenuOpen(false);
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
                </Link>
              ) : (
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
              )
            ))}
          </nav>

          {/* User section */}
          <div className="mt-auto p-6 border-t border-gray-100">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <NavUserHeader />
                <Link
                  to="/cart"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium text-blue-700">Mi Carrito</span>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    {itemsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {itemsCount}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
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
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-700">Ver Carrito</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
