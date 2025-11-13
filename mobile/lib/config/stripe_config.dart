/// Configuración de Stripe
///
/// IMPORTANTE: Este archivo contiene credenciales sensibles.
/// NO debe ser incluido en el control de versiones.
///
/// Para configurar:
/// 1. Copia stripe_config.example.dart a stripe_config.dart
/// 2. Reemplaza las claves de ejemplo con tus credenciales reales
///
/// NOTA: Si el backend está en la nube, la clave se obtendrá automáticamente
/// del backend al crear un pago. Esta configuración local es opcional pero recomendada.
class StripeConfig {
  // Clave pública de Stripe (publishable key)
  // Esta clave puede ser expuesta en el cliente
  // Formato: pk_test_... o pk_live_...
  // IMPORTANTE: Esta clave DEBE coincidir con STRIPE_PUBLIC_KEY del backend (.env)
  // Obtén la clave del backend: backend/.env -> STRIPE_PUBLIC_KEY
  // Si está vacía, la clave se obtendrá del backend automáticamente
  static const String publishableKey = '';

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
    print('✅ Clave de Stripe del backend configurada');
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

    // Si ninguna está configurada, NO lanzar excepción
    // En su lugar, retornar un string vacío y dejar que el backend lo maneje
    print('⚠️ Stripe no está configurado localmente. La clave se obtendrá del backend.');
    return '';
  }

  // Verificar si hay alguna clave disponible (local o del backend)
  static bool hasAnyKey() {
    return (_backendPublishableKey != null && _backendPublishableKey!.isNotEmpty) ||
           isConfigured;
  }
}

