import '../config/api_config.dart';

/// Helper para manejar URLs de imágenes
///
/// Este helper asegura que las URLs de imágenes siempre sean absolutas
/// y estén correctamente formateadas.
class ImageHelper {
  /// Construye una URL completa para una imagen
  ///
  /// Si la URL ya es absoluta (comienza con http:// o https://), la retorna tal cual.
  /// Si es relativa, la construye usando la base URL del backend.
  ///
  /// Args:
  ///   imageUrl: URL de la imagen (puede ser absoluta o relativa)
  ///
  /// Returns:
  ///   URL completa de la imagen
  static String buildImageUrl(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) {
      return '';
    }

    // Si ya es una URL absoluta, retornarla tal cual
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Si es relativa, construir la URL completa usando ApiConfig
    return ApiConfig.buildImageUrl(imageUrl);
  }

  /// Construye múltiples URLs de imágenes
  ///
  /// Útil para procesar listas de imágenes de productos
  static List<String> buildImageUrls(List<String?> imageUrls) {
    final List<String> urls = [];
    for (final url in imageUrls) {
      final fullUrl = buildImageUrl(url);
      if (fullUrl.isNotEmpty) {
        urls.add(fullUrl);
      }
    }
    return urls;
  }

  /// Verifica si una URL es válida para mostrar una imagen
  static bool isValidImageUrl(String? url) {
    if (url == null || url.isEmpty) {
      return false;
    }
    return url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/');
  }
}
