/// Configuración de la URL del backend
/// 
/// Edita esta IP cuando cambies de entorno (local, Azure, etc.)
class ApiUrl {
  // IP del servidor backend
  // Cambia esta IP según tu entorno:
  // - Local: http://192.168.0.143
  // - Azure: http://TU_IP_AZURE
  static const String serverIP = '192.168.0.143';
  static const String port = '8000';
  
  /// URL base del backend
  static String get baseUrl => 'http://$serverIP:$port';
}

