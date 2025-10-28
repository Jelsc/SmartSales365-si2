import 'dart:io';
import 'package:http/http.dart' as http;

class IPDetection {
  static const String LOCALHOST_ANDROID = "http://10.0.2.2:8000";
  static const String LOCALHOST_IOS = "http://localhost:8000";
  static const String CLOUD_URL = "http://3.230.69.204:8000";
  
  static String? _cachedBaseUrl;
  
  /// Detecta automáticamente la URL base según el entorno
  static Future<String> getBaseUrl() async {
    // Si ya tenemos una URL en caché, la usamos
    if (_cachedBaseUrl != null) {
      print('🌐 Usando URL en caché: $_cachedBaseUrl');
      return _cachedBaseUrl!;
    }
    
    print('🔍 Iniciando detección automática de IP...');
    
    try {
      // Primero intentamos con localhost (para desarrollo)
      final localhostUrl = _getLocalhostUrl();
      print('🏠 Probando localhost: $localhostUrl');
      if (await _isLocalhostAvailable()) {
        _cachedBaseUrl = localhostUrl;
        print('✅ Localhost disponible, usando: $localhostUrl');
        return localhostUrl;
      }
      print('❌ Localhost no disponible');
      
      // Si localhost no está disponible, intentamos con la nube
      print('☁️ Probando nube: $CLOUD_URL');
      if (await _isCloudAvailable()) {
        _cachedBaseUrl = CLOUD_URL;
        print('✅ Nube disponible, usando: $CLOUD_URL');
        return CLOUD_URL;
      }
      print('❌ Nube no disponible');
      
      // Si nada funciona, usar localhost por defecto
      _cachedBaseUrl = localhostUrl;
      print('⚠️ Usando localhost por defecto: $localhostUrl');
      return localhostUrl;
      
    } catch (e) {
      // En caso de error, usar localhost por defecto
      final localhostUrl = _getLocalhostUrl();
      _cachedBaseUrl = localhostUrl;
      print('❌ Error en detección, usando localhost por defecto: $localhostUrl');
      print('Error: $e');
      return localhostUrl;
    }
  }
  
  /// Obtiene la URL de localhost según la plataforma
  static String _getLocalhostUrl() {
    if (Platform.isAndroid) {
      return LOCALHOST_ANDROID;
    } else if (Platform.isIOS) {
      return LOCALHOST_IOS;
    } else {
      return LOCALHOST_ANDROID; // Por defecto Android
    }
  }
  
  /// Verifica si la nube está disponible
  static Future<bool> _isCloudAvailable() async {
    try {
      // Usar el endpoint de login que sabemos que existe
      final response = await http.get(
        Uri.parse('$CLOUD_URL/api/auth/login/'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      // Cualquier respuesta (incluso 405 Method Not Allowed) indica que el servidor está disponible
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (e) {
      return false;
    }
  }
  
  /// Verifica si localhost está disponible
  static Future<bool> _isLocalhostAvailable() async {
    try {
      final localhostUrl = _getLocalhostUrl();
      final response = await http.get(
        Uri.parse('$localhostUrl/api/auth/login/'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 3));
      
      // Cualquier respuesta (incluso 405 Method Not Allowed) indica que el servidor está disponible
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (e) {
      return false;
    }
  }
  
  /// Fuerza la detección de nuevo (útil para cambios de red)
  static Future<String> forceDetection() async {
    _cachedBaseUrl = null;
    return await getBaseUrl();
  }

  /// Fuerza localhost (útil para desarrollo)
  static Future<String> forceLocalhost() async {
    final localhostUrl = _getLocalhostUrl();
    _cachedBaseUrl = localhostUrl;
    print('🏠 Forzando localhost: $localhostUrl');
    return localhostUrl;
  }
  
  /// Obtiene información del entorno actual
  static Future<Map<String, dynamic>> getEnvironmentInfo() async {
    final baseUrl = await getBaseUrl();
    final isCloud = baseUrl == CLOUD_URL;
    final isLocalhost = baseUrl.contains('localhost') || baseUrl.contains('10.0.2.2');
    
    return {
      'baseUrl': baseUrl,
      'isCloud': isCloud,
      'isLocalhost': isLocalhost,
      'platform': Platform.operatingSystem,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }
  
  /// Configura la URL de la nube (para actualizaciones dinámicas)
  static void setCloudUrl(String newCloudUrl) {
    // Esta función se puede usar para actualizar la URL de la nube
    // sin necesidad de recompilar la app
  }
}
