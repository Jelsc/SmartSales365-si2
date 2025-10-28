import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SmartSalesIcon from "@/components/app-logo";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { GoogleLoginButton } from "@/components/google-login-button";
import { getApiBaseUrl } from "@/lib/api";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Bell,
  CreditCard,
  Users,
  Smartphone,
} from "lucide-react";

interface RegisterFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  telefono: string;
  ci: string;
  password1: string;
  password2: string;
  acceptTerms: boolean;
}

interface FormErrors extends Partial<RegisterFormData> {
  general?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, clearError } = useAuth();
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();

  // Función de registro usando el endpoint móvil
  const registerMobile = async (userData: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
    telefono: string;
    ci: string;
  }) => {
    const response = await fetch(
      `${getApiBaseUrl()}/api/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw { data };
    }

    return data;
  };
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    ci: "",
    password1: "",
    password2: "",
    acceptTerms: false,
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

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Limpiar error global
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username =
        "El nombre de usuario debe tener al menos 3 caracteres";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!/^[\+]?[0-9\s\-\(\)]{7,15}$/.test(formData.telefono)) {
      newErrors.telefono = "Formato de teléfono inválido";
    }

    if (!formData.ci.trim()) {
      newErrors.ci = "La cédula de identidad es requerida";
    } else if (!/^[0-9]{7,10}$/.test(formData.ci.replace(/\s/g, ""))) {
      newErrors.ci = "La cédula debe contener entre 7 y 10 dígitos";
    }

    if (!formData.password1) {
      newErrors.password1 = "La contraseña es requerida";
    } else if (formData.password1.length < 8) {
      newErrors.password1 = "La contraseña debe tener al menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password1)) {
      newErrors.password1 =
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número";
    }

    if (formData.password1 !== formData.password2) {
      newErrors.password2 = "Las contraseñas no coinciden";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones" as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await registerMobile({
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password1,
        password_confirm: formData.password2,
        telefono: formData.telefono,
        ci: formData.ci,
      });

      // Redirigir a la página de verificación por código
      navigate("/code-verification", {
        state: {
          email: formData.email,
          username: formData.username,
          user_id: response.user_id,
        },
      });
    } catch (err: any) {
      console.error("Error en registro:", err);

      // Manejar errores específicos de validación
      if (err?.data) {
        const errorData = err.data;

        // Mostrar errores de campos específicos
        if (errorData.username) {
          setErrors((prev) => ({ ...prev, username: errorData.username[0] }));
        }
        if (errorData.email) {
          setErrors((prev) => ({ ...prev, email: errorData.email[0] }));
        }
        if (errorData.ci) {
          setErrors((prev) => ({ ...prev, ci: errorData.ci[0] }));
        }
        if (errorData.password1) {
          setErrors((prev) => ({ ...prev, password1: errorData.password1[0] }));
        }
        if (errorData.password2) {
          setErrors((prev) => ({ ...prev, password2: errorData.password2[0] }));
        }
        if (errorData.non_field_errors) {
          setErrors((prev) => ({
            ...prev,
            general: errorData.non_field_errors[0],
          }));
        }
      }

      // El error se maneja en el contexto
    } finally {
      setIsSubmitting(false);
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
            <div className="flex items-center space-x-4">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Register Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Crear cuenta
                </h2>
                <p className="text-gray-600">
                  Únete a nuestra comunidad de viajeros
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Messages */}
                {(error || errors.general) && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      {error || errors.general}
                    </p>
                  </div>
                )}

                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre de usuario
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="juanperez"
                    disabled={isSubmitting}
                    required
                    className={`px-4 py-3 transition-colors ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre
                    </label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      disabled={isSubmitting}
                      required
                      className={`px-4 py-3 transition-colors ${
                        errors.first_name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Apellido
                    </label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Pérez"
                      disabled={isSubmitting}
                      required
                      className={`px-4 py-3 transition-colors ${
                        errors.last_name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>

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
                    disabled={isSubmitting}
                    required
                    className={`px-4 py-3 transition-colors ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Teléfono
                  </label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+591 700-00000"
                    disabled={isSubmitting}
                    required
                    className={`px-4 py-3 transition-colors ${
                      errors.telefono ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.telefono && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.telefono}
                    </p>
                  )}
                </div>

                {/* CI Field */}
                <div>
                  <label
                    htmlFor="ci"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cédula de Identidad
                  </label>
                  <Input
                    id="ci"
                    name="ci"
                    type="text"
                    value={formData.ci}
                    onChange={handleInputChange}
                    placeholder="1234567"
                    disabled={isSubmitting}
                    required
                    className={`px-4 py-3 transition-colors ${
                      errors.ci ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.ci && (
                    <p className="text-red-500 text-sm mt-1">{errors.ci}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password1"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password1"
                      name="password1"
                      type={showPassword ? "text" : "password"}
                      value={formData.password1}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                      className={`px-4 py-3 pr-10 transition-colors ${
                        errors.password1 ? "border-red-500" : "border-gray-300"
                      }`}
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
                  {errors.password1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password1}
                    </p>
                  )}
                  <label
                    htmlFor="password2"
                    className="block text-sm text-gray-500 mb-1"
                  >
                    la contraseña debe tener al menos 8 caracteres, incluyendo
                    una mayúscula, una minúscula y un número.
                  </label>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="password2"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password2"
                      name="password2"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.password2}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                      className={`px-4 py-3 pr-10 transition-colors ${
                        errors.password2 ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center p-0"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {errors.password2 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password2}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="flex items-start">
                    <Input
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Acepto los{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-500">
                        términos y condiciones
                      </a>{" "}
                      y la{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-500">
                        política de privacidad
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.acceptTerms}
                    </p>
                  )}
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando cuenta...
                    </div>
                  ) : (
                    "Crear cuenta"
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

                {/* Google Login Button */}
                <GoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={isSubmitting}
                  className="py-3 px-4 font-medium"
                />

                {/* Sign In Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                  </span>
                  <Link
                    to="/login"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Beneficios de registrarte
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Gestión de pasajes y reprogramaciones.
                  </span>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Guarda pasajeros frecuentes.
                  </span>
                </div>
                <div className="flex items-start">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Alertas de embarque y cambios.
                  </span>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Pagos guardados y facturas.
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-4">
                  La mensajería y envío de paquetes está disponible solo en la
                  App Móvil.
                </p>
                <div className="flex items-center justify-center">
                  <Button className="flex items-center justify-center px-4 py-3 h-12 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
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
