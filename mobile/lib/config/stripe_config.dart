/// Configuración de Stripe
///
/// IMPORTANTE: Este archivo contiene credenciales sensibles.
/// NO debe ser incluido en el control de versiones.
///
/// Para configurar:
/// 1. Copia stripe_config.example.dart a stripe_config.dart
/// 2. Reemplaza las claves de ejemplo con tus credenciales reales
class StripeConfig {
  // Clave pública de Stripe (publishable key)
  // Esta clave puede ser expuesta en el cliente
  // Formato: pk_test_... o pk_live_...
  // IMPORTANTE: Esta clave DEBE coincidir con STRIPE_PUBLIC_KEY del backend (.env)
  // Obtén la clave del backend: backend/.env -> STRIPE_PUBLIC_KEY
  static const String publishableKey = 'xd';

  // Validar que la clave esté configurada
  static bool get isConfigured {
    return publishableKey.isNotEmpty &&
        publishableKey != 'xd' &&
        (publishableKey.startsWith('pk_test_') ||
            publishableKey.startsWith('pk_live_'));
  }

  // Obtener la clave con validación
  static String getPublishableKey() {
    if (!isConfigured) {
      throw Exception(
        'Stripe no está configurado. Por favor configura tu publishable key en lib/config/stripe_config.dart',
      );
    }
    return publishableKey;
  }
}
