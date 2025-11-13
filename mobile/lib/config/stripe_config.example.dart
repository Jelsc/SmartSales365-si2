/// Archivo de ejemplo para configuración de Stripe
///
/// INSTRUCCIONES:
/// 1. Copia este archivo a stripe_config.dart
/// 2. Reemplaza 'TU_PUBLISHABLE_KEY_AQUI' con tu clave pública de Stripe
/// 3. El archivo stripe_config.dart está en .gitignore y NO se subirá al repositorio
///
/// NOTA: Si el backend está en la nube, la clave se obtendrá automáticamente
/// del backend al crear un pago. Esta configuración local es opcional pero recomendada.
///
/// Obtén tus claves en: https://dashboard.stripe.com/apikeys
class StripeConfig {
  // Clave pública de Stripe (publishable key)
  // Esta clave puede ser expuesta en el cliente
  // Formato: pk_test_... o pk_live_...
  // Si está vacía o es el placeholder, la clave se obtendrá del backend
  static const String publishableKey = 'TU_PUBLISHABLE_KEY_AQUI';

  // Validar que la clave esté configurada
  static bool get isConfigured {
    return publishableKey.isNotEmpty &&
        publishableKey != 'TU_PUBLISHABLE_KEY_AQUI' &&
        (publishableKey.startsWith('pk_test_') ||
            publishableKey.startsWith('pk_live_'));
  }

  // Clave dinámica del backend (se actualiza cuando se obtiene del servidor)
  static String? _backendPublishableKey;

  // Establecer la clave del backend
  static void setBackendKey(String key) {
    _backendPublishableKey = key;
  }

  // Obtener la clave con validación (prioriza la del backend si está disponible)
  static String getPublishableKey() {
    // Si hay una clave del backend, usarla (tiene prioridad)
    if (_backendPublishableKey != null && _backendPublishableKey!.isNotEmpty) {
      return _backendPublishableKey!;
    }

    // Si la clave local está configurada, usarla
    if (isConfigured) {
      return publishableKey;
    }

    // Si ninguna está configurada, lanzar excepción
    throw Exception(
      'Stripe no está configurado. La clave se obtendrá del backend al crear un pago.',
    );
  }

  // Verificar si hay alguna clave disponible (local o del backend)
  static bool hasAnyKey() {
    return (_backendPublishableKey != null && _backendPublishableKey!.isNotEmpty) ||
           isConfigured;
  }
}
