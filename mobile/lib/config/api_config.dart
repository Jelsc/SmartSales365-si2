import 'api_url.dart';

/// Configuración centralizada de la API
///
/// Este servicio maneja la URL base del backend y proporciona
/// métodos para construir URLs completas de recursos.
class ApiConfig {
  /// Obtiene la URL base del backend
  ///
  /// Usa la IP configurada en api_url.dart
  static String getBaseUrl() {
    return ApiUrl.baseUrl;
  }

  /// Construye una URL completa para un endpoint
  ///
  /// Args:
  ///   endpoint: Ruta del endpoint (ej: '/api/productos/')
  ///
  /// Returns:
  ///   URL completa (ej: 'http://192.168.0.143:8000/api/productos/')
  static String buildUrl(String endpoint) {
    final baseUrl = getBaseUrl();
    // Asegurar que el endpoint comience con /
    final normalizedEndpoint = endpoint.startsWith('/')
        ? endpoint
        : '/$endpoint';
    // Asegurar que la baseUrl no termine con /
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    return '$normalizedBaseUrl$normalizedEndpoint';
  }

  /// Construye una URL completa para una imagen o recurso estático
  ///
  /// Si la URL ya es absoluta (comienza con http:// o https://), la retorna tal cual.
  /// Si es relativa, la construye usando la base URL.
  ///
  /// Args:
  ///   imagePath: Ruta de la imagen (relativa o absoluta)
  ///
  /// Returns:
  ///   URL completa de la imagen
  static String buildImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return '';
    }

    // Si ya es una URL absoluta, retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Si es relativa, construir la URL completa
    final baseUrl = getBaseUrl();
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;

    // Asegurar que el path comience con /
    final normalizedPath = imagePath.startsWith('/')
        ? imagePath
        : '/$imagePath';

    return '$normalizedBaseUrl$normalizedPath';
  }
}
