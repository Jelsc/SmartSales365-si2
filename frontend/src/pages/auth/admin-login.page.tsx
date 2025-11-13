import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminLoginFormData {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, isAuthenticated, isAdmin, isLoading, error, clearError } =
    useAuth();
  const [formData, setFormData] = useState<AdminLoginFormData>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado como admin
  useEffect(() => {
    if (isAuthenticated && isAdmin && !isLoading) {
      navigate("/panel/home");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
      await adminLogin(formData.username, formData.password);
      // La redirección se maneja en el useEffect
    } catch (error) {
      console.error("Error en login de admin:", error);
      // El error se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => navigate("/");

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Botón de volver arriba a la izquierda */}
        <div className="mb-2">
          <Button
            variant="ghost"
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> 
            <span className="text-sm font-medium">Volver al inicio</span>
          </Button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Acceso administrador
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Usuario o Correo Electrónico
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="admin"
              disabled={isSubmitting}
              required
              className="px-4 py-3"
            />
          </div>
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
                disabled={isSubmitting}
                required
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
          </div>
          <Button
            type="submit"
            className="w-full py-3 px-4 font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
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
        </form>
      </div>
    </div>
  );
}
