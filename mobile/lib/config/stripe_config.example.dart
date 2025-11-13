/// Archivo de ejemplo para configuración de Stripe
///
/// INSTRUCCIONES:
/// 1. Copia este archivo a stripe_config.dart
/// 2. Reemplaza 'TU_PUBLISHABLE_KEY_AQUI' con tu clave pública de Stripe
/// 3. El archivo stripe_config.dart está en .gitignore y NO se subirá al repositorio
///
/// Obtén tus claves en: https://dashboard.stripe.com/apikeys
class StripeConfig {
  // Clave pública de Stripe (publishable key)
  // Esta clave puede ser expuesta en el cliente
  // Formato: pk_test_... o pk_live_...
  static const String publishableKey = 'TU_PUBLISHABLE_KEY_AQUI';

  // Validar que la clave esté configurada
  static bool get isConfigured {
    return publishableKey.isNotEmpty &&
        publishableKey != 'TU_PUBLISHABLE_KEY_AQUI' &&
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
