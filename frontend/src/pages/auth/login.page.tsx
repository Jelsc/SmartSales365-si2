import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Calendar,
  Bell,
  CreditCard,
  Users,
  Smartphone,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import SmartSalesIcon from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { GoogleLoginButton } from "@/components/google-login-button";
import toast from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      // La redirección se maneja en el useEffect
    } catch (error) {
      console.error("Error en login:", error);
      // El error se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // El botón de Google manejará la autenticación
      // Esta función se puede usar para lógica adicional si es necesario
    } catch (error) {
      console.error("Error en Google login:", error);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <SmartSalesIcon className="w-7 h-7" />
              <span className="text-lg font-bold text-blue-700">SmartSales365</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={goBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button
                asChild
                variant="default"
                className="min-w-[110px] bg-blue-600 hover:bg-blue-700"
              >
                <Link to="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Login Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Inicia sesión
                </h2>
                <p className="text-gray-600">
                  Accede a tus reservas, métodos de pago y notificaciones.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@example.com"
                    required
                    disabled={isSubmitting}
                    className="px-4 py-3"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      className="px-4 py-3 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Mínimo 8 caracteres.
                  </p>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <Input
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Recordarme
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 font-medium bg-blue-500 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Ingresando...
                    </div>
                  ) : (
                    <>
                      <LogIn className="mr-2" /> Ingresar
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      o continúa con
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="flex flex-col gap-3">
                  <GoogleLoginButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isSubmitting}
                    className="py-3 px-4 font-medium"
                  />
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    ¿No tienes cuenta?{" "}
                  </span>
                  <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    Crear cuenta
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                ¿Por qué iniciar sesión?
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Ver y descargar tus pasajes.
                  </span>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Reprograma o cancela viajes.
                  </span>
                </div>
                <div className="flex items-start">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Recibe alertas de embarque en tiempo real.
                  </span>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Usa métodos de pago guardados.
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-4">
                  La mensajería y envío de paquetes está disponible solo en la
                  App Móvil.
                </p>
                <div className="flex items-center justify-center">
                  <Button className="flex items-center justify-center px-4 py-3 h-12 bg-black text-white rounded-lg hover:bg-gray-800">
                    <Smartphone className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-xs">Disponible en</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
