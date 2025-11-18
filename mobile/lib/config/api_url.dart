/// Configuración de la URL del backend
///
/// IMPORTANTE: Este archivo contiene la IP del servidor.
/// NO debe ser incluido en el control de versiones.
///
/// Para configurar:
/// 1. Copia este archivo a api_url.dart
/// 2. Reemplaza 'TU_IP_AQUI' con tu IP real
///
/// Entornos:
/// - Local: http://192.168.0.XXX (tu IP local)
/// - Azure: http://TU_IP_PUBLICA_AZURE
/// - Producción: http://TU_DOMINIO
class ApiUrl {
  // IP del servidor backend
  // Cambia esta IP según tu entorno:
  // - Local: http://TU_IP_LOCAL
  // - Azure: http://TU_IP_AZURE
  // - Producción: http://TU_DOMINIO
  static const String serverIP = '57.154.17.34';
  static const String port = '8000';

  /// URL base del backend
  static String get baseUrl => 'http://$serverIP:$port';
}
