import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'http_helper.dart';

/// Utilidad de diagnóstico para depurar problemas de conexión y autenticación
class DiagnosticoDebug {
  /// Ejecuta un diagnóstico completo del sistema
  static Future<Map<String, dynamic>> ejecutarDiagnosticoCompleto() async {
    final resultados = <String, dynamic>{};
    
    print('\n🔍 === DIAGNÓSTICO COMPLETO ===\n');
    
    // 1. Verificar configuración de URL
    resultados['configuracion_url'] = await _diagnosticarConfiguracionUrl();
    
    // 2. Verificar token almacenado
    resultados['token'] = await _diagnosticarToken();
    
    // 3. Verificar conexión con el backend
    resultados['conexion'] = await _diagnosticarConexion();
    
    // 4. Verificar autenticación
    resultados['autenticacion'] = await _diagnosticarAutenticacion();
    
    // 5. Probar endpoint específico
    resultados['endpoint_admin_users'] = await _diagnosticarEndpointAdminUsers();
    
    // Imprimir resumen
    _imprimirResumen(resultados);
    
    return resultados;
  }
  
  static Future<Map<String, dynamic>> _diagnosticarConfiguracionUrl() async {
    print('📡 1. Configuración de URL');
    final baseUrl = ApiConfig.getBaseUrl();
    print('   Base URL: $baseUrl');
    
    return {
      'base_url': baseUrl,
      'status': 'ok',
    };
  }
  
  static Future<Map<String, dynamic>> _diagnosticarToken() async {
    print('\n🔑 2. Verificación de Token');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    final refreshToken = prefs.getString('refresh_token');
    
    if (token == null || token.isEmpty) {
      print('   ❌ NO HAY TOKEN ALMACENADO');
      print('   ⚠️ Necesitas hacer login primero');
      return {
        'tiene_token': false,
        'token_length': 0,
        'status': 'error',
        'mensaje': 'No hay token almacenado',
      };
    }
    
    print('   ✅ Token encontrado');
    print('   Token (primeros 20 chars): ${token.substring(0, 20)}...');
    print('   Longitud del token: ${token.length}');
    print('   Refresh token: ${refreshToken != null ? "Sí" : "No"}');
    
    // Verificar formato del token (JWT tiene 3 partes separadas por punto)
    final partes = token.split('.');
    if (partes.length != 3) {
      print('   ⚠️ ADVERTENCIA: El token no tiene el formato JWT correcto');
      return {
        'tiene_token': true,
        'token_length': token.length,
        'formato_jwt': false,
        'status': 'warning',
        'mensaje': 'Token encontrado pero formato incorrecto',
      };
    }
    
    return {
      'tiene_token': true,
      'token_length': token.length,
      'formato_jwt': true,
      'status': 'ok',
    };
  }
  
  static Future<Map<String, dynamic>> _diagnosticarConexion() async {
    print('\n🌐 3. Verificación de Conexión');
    final baseUrl = ApiConfig.getBaseUrl();
    
    try {
      // Intentar hacer una petición simple sin autenticación
      final response = await HttpHelper.get<dynamic>('/api/auth/user-info/');
      
      if (response.success) {
        print('   ✅ Conexión exitosa con el backend');
        return {
          'status': 'ok',
          'mensaje': 'Conexión exitosa',
        };
      } else {
        print('   ⚠️ Respuesta del servidor: ${response.error}');
        return {
          'status': response.error?.contains('401') == true ? 'auth_required' : 'error',
          'mensaje': response.error ?? 'Error desconocido',
        };
      }
    } catch (e) {
      print('   ❌ ERROR DE CONEXIÓN: $e');
      print('   ⚠️ Verifica que:');
      print('      - El backend esté corriendo');
      print('      - La IP sea correcta ($baseUrl)');
      print('      - El dispositivo móvil esté en la misma red');
      print('      - No haya firewall bloqueando la conexión');
      return {
        'status': 'error',
        'mensaje': 'Error de conexión: $e',
      };
    }
  }
  
  static Future<Map<String, dynamic>> _diagnosticarAutenticacion() async {
    print('\n🔐 4. Verificación de Autenticación');
    
    try {
      final headers = await HttpHelper.getHeaders();
      
      if (!headers.containsKey('Authorization')) {
        print('   ❌ NO HAY HEADER DE AUTORIZACIÓN');
        print('   ⚠️ El token no se está enviando en las peticiones');
        return {
          'status': 'error',
          'mensaje': 'No hay header Authorization',
        };
      }
      
      final authHeader = headers['Authorization'] ?? '';
      print('   ✅ Header Authorization presente');
      print('   Authorization: ${authHeader.substring(0, 30)}...');
      
      // Probar con un endpoint que requiera autenticación
      final response = await HttpHelper.get<dynamic>('/api/auth/user-info/');
      
      if (response.success) {
        print('   ✅ Autenticación exitosa');
        return {
          'status': 'ok',
          'mensaje': 'Autenticación exitosa',
        };
      } else {
        if (response.error?.contains('401') == true || 
            response.error?.contains('Unauthorized') == true ||
            response.error?.contains('credenciales') == true) {
          print('   ❌ TOKEN INVÁLIDO O EXPIRADO');
          print('   ⚠️ Necesitas hacer login nuevamente');
          return {
            'status': 'error',
            'mensaje': 'Token inválido o expirado',
          };
        }
        print('   ⚠️ Error: ${response.error}');
        return {
          'status': 'error',
          'mensaje': response.error ?? 'Error desconocido',
        };
      }
    } catch (e) {
      print('   ❌ Error verificando autenticación: $e');
      return {
        'status': 'error',
        'mensaje': 'Error: $e',
      };
    }
  }
  
  static Future<Map<String, dynamic>> _diagnosticarEndpointAdminUsers() async {
    print('\n👥 5. Prueba de Endpoint /api/admin/users/');
    
    try {
      final endpoint = '/api/admin/users/';
      print('   Llamando: $endpoint');
      
      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);
      
      if (response.success && response.data != null) {
        final data = response.data!;
        
        if (data.containsKey('results')) {
          final results = data['results'] as List<dynamic>;
          print('   ✅ Respuesta exitosa');
          print('   Total usuarios: ${data['count'] ?? 'N/A'}');
          print('   Usuarios en esta página: ${results.length}');
          
          if (results.isNotEmpty) {
            print('   Primer usuario: ${results[0]}');
          }
          
          return {
            'status': 'ok',
            'count': data['count'] ?? 0,
            'results_count': results.length,
            'mensaje': 'Datos recibidos correctamente',
          };
        } else {
          print('   ⚠️ Respuesta no tiene formato paginado esperado');
          print('   Datos recibidos: $data');
          return {
            'status': 'warning',
            'mensaje': 'Formato de respuesta inesperado',
            'data': data,
          };
        }
      } else {
        print('   ❌ Error en la petición: ${response.error}');
        return {
          'status': 'error',
          'mensaje': response.error ?? 'Error desconocido',
        };
      }
    } catch (e) {
      print('   ❌ Excepción: $e');
      return {
        'status': 'error',
        'mensaje': 'Error: $e',
      };
    }
  }
  
  static void _imprimirResumen(Map<String, dynamic> resultados) {
    print('\n📊 === RESUMEN DEL DIAGNÓSTICO ===\n');
    
    final configUrl = resultados['configuracion_url'] as Map<String, dynamic>;
    print('URL Base: ${configUrl['base_url']}');
    
    final token = resultados['token'] as Map<String, dynamic>;
    if (token['tiene_token'] == true) {
      print('Token: ✅ Presente (${token['token_length']} caracteres)');
    } else {
      print('Token: ❌ NO ENCONTRADO - HAZ LOGIN PRIMERO');
    }
    
    final conexion = resultados['conexion'] as Map<String, dynamic>;
    if (conexion['status'] == 'ok') {
      print('Conexión: ✅ OK');
    } else {
      print('Conexión: ❌ ${conexion['mensaje']}');
    }
    
    final auth = resultados['autenticacion'] as Map<String, dynamic>;
    if (auth['status'] == 'ok') {
      print('Autenticación: ✅ OK');
    } else {
      print('Autenticación: ❌ ${auth['mensaje']}');
    }
    
    final endpoint = resultados['endpoint_admin_users'] as Map<String, dynamic>;
    if (endpoint['status'] == 'ok') {
      print('Endpoint /api/admin/users/: ✅ OK (${endpoint['results_count']} usuarios)');
    } else {
      print('Endpoint /api/admin/users/: ❌ ${endpoint['mensaje']}');
    }
    
    print('\n🔍 === FIN DEL DIAGNÓSTICO ===\n');
  }
}

