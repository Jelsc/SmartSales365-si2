import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

/// Helper centralizado para peticiones HTTP con manejo de errores y logging
class HttpHelper {
  /// Obtiene el token de autenticación desde SharedPreferences
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  /// Obtiene los headers con autenticación
  static Future<Map<String, String>> getHeaders() async {
    final token = await _getToken();

    // Verificar si hay token y loguear para debug
    if (token == null || token.isEmpty) {
      print('⚠️ ADVERTENCIA: No se encontró token de autenticación');
      print(
        '⚠️ La petición se realizará sin autenticación (puede fallar con 401)',
      );
    } else {
      print(
        '✅ Token encontrado: ${token.substring(0, 20)}... (${token.length} caracteres)',
      );
    }

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  /// Realiza una petición GET con manejo de errores mejorado
  static Future<HttpResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(dynamic)? parser,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final uri = Uri.parse(
        '$baseUrl$endpoint',
      ).replace(queryParameters: queryParams);

      print('🔵 GET: $uri');
      final headers = await getHeaders();

      // Verificar headers antes de enviar
      print('📤 Headers: ${headers.keys.toList()}');
      if (headers.containsKey('Authorization')) {
        print('✅ Header Authorization presente');
      } else {
        print(
          '❌ Header Authorization NO presente - La petición fallará con 401',
        );
      }

      final response = await http.get(uri, headers: headers);

      print('📥 Status: ${response.statusCode}');
      print('📥 Response length: ${response.bodyBytes.length} bytes');

      if (response.statusCode == 200) {
        try {
          final bodyText = utf8.decode(response.bodyBytes);
          print(
            '📄 Response body (first 500 chars): ${bodyText.length > 500 ? bodyText.substring(0, 500) : bodyText}',
          );

          final data = jsonDecode(bodyText);

          // Si hay un parser personalizado, usarlo
          if (parser != null) {
            final parsed = parser(data);
            return HttpResponse<T>.success(parsed);
          }

          // Procesar la respuesta según su formato
          // Para respuestas paginadas de DRF (tiene 'results' y 'count'):
          // - Si T es Map<String, dynamic>, devolver el objeto completo (servicios extraen results)
          // - Si T es List, extraer solo results automáticamente
          dynamic result;
          
          if (data is Map) {
            // Respuesta paginada de DRF (formato estándar: { count, next, previous, results })
            if (data.containsKey('results') && data.containsKey('count')) {
              // Verificar si el tipo esperado es List para extraer results automáticamente
              final typeString = T.toString();
              final isListType = typeString.contains('List');
              
              if (isListType) {
                // Tipo esperado es List, extraer results automáticamente
                result = data['results'];
                print(
                  '✅ Respuesta paginada (results extraídos para List): ${(result as List).length} items (total: ${data['count']})',
                );
              } else {
                // Tipo esperado es Map u otro, devolver el objeto completo
                result = data;
                print(
                  '✅ Respuesta paginada completa devuelta (Map): ${(data['results'] as List).length} items (total: ${data['count']})',
                );
              }
            } else if (data.containsKey('results')) {
              // Tiene 'results' pero no 'count', extraer solo results
              result = data['results'];
              print(
                '✅ Respuesta con results (extraído): ${(result as List).length} items',
              );
            } else if (data.containsKey('data')) {
              // Respuesta con wrapper 'data'
              result = data['data'];
              print(
                '✅ Datos en wrapper "data": ${result is List ? result.length : 1} items',
              );
            } else {
              // El objeto completo es el resultado
              result = data;
              print('✅ Objeto completo como resultado');
            }
          } else if (data is List) {
            result = data;
            print('✅ Lista directa: ${result.length} items');
          } else {
            result = data;
            print('✅ Otro formato: ${result.runtimeType}');
          }

          return HttpResponse<T>.success(result as T);
        } catch (e) {
          print('❌ Error parseando JSON: $e');
          print(
            '❌ Response body: ${response.body.substring(0, response.body.length > 500 ? 500 : response.body.length)}',
          );
          return HttpResponse<T>.error('Error parseando respuesta: $e');
        }
      } else if (response.statusCode == 401) {
        print('❌ 401 Unauthorized - Token inválido o expirado');
        return HttpResponse<T>.error(
          'Sesión expirada. Por favor inicia sesión nuevamente.',
        );
      } else if (response.statusCode == 403) {
        print('❌ 403 Forbidden - Sin permisos');
        return HttpResponse<T>.error(
          'No tienes permisos para acceder a este recurso.',
        );
      } else if (response.statusCode == 404) {
        print('❌ 404 Not Found - Endpoint no existe');
        return HttpResponse<T>.error('Recurso no encontrado.');
      } else {
        String errorMessage = 'Error ${response.statusCode}';
        try {
          final errorData = jsonDecode(utf8.decode(response.bodyBytes));
          errorMessage =
              errorData['detail'] ??
              errorData['message'] ??
              errorData['error'] ??
              errorMessage;
        } catch (_) {
          if (response.body.isNotEmpty) {
            errorMessage = response.body.substring(
              0,
              response.body.length > 200 ? 200 : response.body.length,
            );
          }
        }
        print('❌ Error HTTP ${response.statusCode}: $errorMessage');
        return HttpResponse<T>.error(errorMessage);
      }
    } catch (e) {
      print('❌ Excepción en GET $endpoint: $e');
      return HttpResponse<T>.error('Error de conexión: $e');
    }
  }

  /// Realiza una petición POST
  static Future<HttpResponse<T>> post<T>(
    String endpoint,
    Map<String, dynamic> body, {
    T Function(dynamic)? parser,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = await getHeaders();

      print('🟢 POST: $uri');
      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        if (parser != null) {
          return HttpResponse<T>.success(parser(data));
        }
        return HttpResponse<T>.success(data as T);
      } else {
        return _handleErrorResponse<T>(response);
      }
    } catch (e) {
      print('❌ Excepción en POST $endpoint: $e');
      return HttpResponse<T>.error('Error de conexión: $e');
    }
  }

  /// Realiza una petición PATCH
  static Future<HttpResponse<T>> patch<T>(
    String endpoint,
    Map<String, dynamic> body, {
    T Function(dynamic)? parser,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = await getHeaders();

      print('🟡 PATCH: $uri');
      final response = await http.patch(
        uri,
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        if (parser != null) {
          return HttpResponse<T>.success(parser(data));
        }
        return HttpResponse<T>.success(data as T);
      } else {
        return _handleErrorResponse<T>(response);
      }
    } catch (e) {
      print('❌ Excepción en PATCH $endpoint: $e');
      return HttpResponse<T>.error('Error de conexión: $e');
    }
  }

  /// Realiza una petición DELETE
  static Future<HttpResponse<void>> delete(String endpoint) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = await getHeaders();

      print('🔴 DELETE: $uri');
      final response = await http.delete(uri, headers: headers);

      if (response.statusCode == 204 || response.statusCode == 200) {
        return HttpResponse<void>.success(null);
      } else {
        return _handleErrorResponse<void>(response);
      }
    } catch (e) {
      print('❌ Excepción en DELETE $endpoint: $e');
      return HttpResponse<void>.error('Error de conexión: $e');
    }
  }

  /// Maneja respuestas de error
  static HttpResponse<T> _handleErrorResponse<T>(http.Response response) {
    String errorMessage = 'Error ${response.statusCode}';
    try {
      final errorData = jsonDecode(utf8.decode(response.bodyBytes));
      errorMessage =
          errorData['detail'] ??
          errorData['message'] ??
          errorData['error'] ??
          errorMessage;
    } catch (_) {
      if (response.body.isNotEmpty) {
        errorMessage = response.body.substring(
          0,
          response.body.length > 200 ? 200 : response.body.length,
        );
      }
    }
    print('❌ Error HTTP ${response.statusCode}: $errorMessage');
    return HttpResponse<T>.error(errorMessage);
  }
}

/// Respuesta HTTP genérica
class HttpResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  HttpResponse.success(this.data) : success = true, error = null;
  HttpResponse.error(this.error) : success = false, data = null;
}
