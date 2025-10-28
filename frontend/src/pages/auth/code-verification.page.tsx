import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface LocationState {
  email: string;
  username: string;
  user_id: number;
}

const CodeVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, username, user_id } = (location.state as LocationState) || {};

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const hasSentInitialCode = useRef(false);
  const isSendingCode = useRef(false);

  // Redirigir si no hay datos de email
  useEffect(() => {
    if (!email || !username) {
      navigate("/register");
    }
  }, [email, username, navigate]);

  // NO enviar código automáticamente - solo cuando el usuario haga clic en "Reenviar"
  // El código ya se envió durante el registro

  // Countdown para reenvío
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const sendVerificationCode = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/resend-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Código de verificación enviado exitosamente");
        setError(null);
        setResendCountdown(60); // 60 segundos de espera
      } else {
        setError(data.error || "Error al enviar código");
        setSuccess(null);

        // Si es error de rate limiting, ajustar el countdown
        if (response.status === 429 && data.error) {
          // Extraer tiempo de espera del mensaje si está disponible
          const waitMatch = data.error.match(/(\d+) segundos/);
          if (waitMatch) {
            setResendCountdown(parseInt(waitMatch[1]));
          } else {
            setResendCountdown(60);
          }
        }
      }
    } catch (err) {
      setError("Error de conexión");
      setSuccess(null);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError("Por favor ingresa el código");
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/verify/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id, code }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("¡Email verificado exitosamente!");
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Cuenta verificada exitosamente. Ya puedes iniciar sesión.",
            },
          });
        }, 2000);
      } else {
        setError(data.error || "Código incorrecto");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCountdown > 0) return;

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/resend-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Código reenviado exitosamente");
        setResendCountdown(60);
      } else {
        setError(data.error || "Error al reenviar código");

        // Si es error de rate limiting, ajustar el countdown
        if (response.status === 429 && data.error) {
          const waitMatch = data.error.match(/(\d+) segundos/);
          if (waitMatch) {
            setResendCountdown(parseInt(waitMatch[1]));
          } else {
            setResendCountdown(60);
          }
        }
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  if (!email || !username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Verificación de Email
          </CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos que enviamos a tu correo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del usuario */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>Hola {username}</strong>
            </p>
            <p className="text-sm text-green-600 mt-1">
              Se envió un código de verificación a tu email durante el registro:
            </p>
            <p className="text-sm font-semibold text-green-800 mt-1">{email}</p>
          </div>

          {/* Campo de código */}
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="code"
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="123456"
                className="pl-10 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Ingresa el código de 6 dígitos que recibiste por email
            </p>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de verificar */}
          <Button
            onClick={verifyCode}
            disabled={isLoading || code.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Verificando...
              </>
            ) : (
              "Verificar Código"
            )}
          </Button>

          {/* Botón de reenviar */}
          <Button
            onClick={resendCode}
            disabled={resendCountdown > 0 || isResending}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isResending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                Reenviando...
              </>
            ) : resendCountdown > 0 ? (
              `Reenviar código en ${resendCountdown}s`
            ) : (
              "Reenviar Código"
            )}
          </Button>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              Información importante
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• El código expira en 15 minutos</li>
              <li>• Revisa tu carpeta de spam si no recibes el email</li>
              <li>• No compartas este código con nadie</li>
            </ul>
          </div>

          {/* Botón para volver al registro */}
          <Button
            onClick={() => navigate("/register")}
            variant="ghost"
            className="w-full text-gray-600"
          >
            Volver al registro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeVerificationPage;
