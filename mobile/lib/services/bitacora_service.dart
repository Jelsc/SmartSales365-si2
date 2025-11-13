import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';

class RegistroBitacora {
  final int id;
  final DateTime fechaHora;
  final String accion;
  final String descripcion;
  final String? ip;
  final String usuarioUsername;
  final String usuarioNombreCompleto;
  final String usuarioRol;

  RegistroBitacora({
    required this.id,
    required this.fechaHora,
    required this.accion,
    required this.descripcion,
    this.ip,
    required this.usuarioUsername,
    required this.usuarioNombreCompleto,
    required this.usuarioRol,
  });

  factory RegistroBitacora.fromJson(Map<String, dynamic> json) {
    final usuario = json['usuario'] as Map<String, dynamic>? ?? {};
    final firstName = usuario['first_name'] ?? '';
    final lastName = usuario['last_name'] ?? '';
    final nombreCompleto = '$firstName $lastName'.trim();

    return RegistroBitacora(
      id: json['id'] ?? 0,
      fechaHora: json['fecha_hora'] != null
          ? DateTime.parse(json['fecha_hora'])
          : DateTime.now(),
      accion: json['accion'] ?? '',
      descripcion: json['descripcion'] ?? '',
      ip: json['ip'],
      usuarioUsername: usuario['username'] ?? 'Sistema',
      usuarioNombreCompleto: nombreCompleto.isEmpty
          ? usuario['username'] ?? 'Sistema'
          : nombreCompleto,
      usuarioRol: usuario['rol'] ?? 'N/A',
    );
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse.success(this.data) : success = true, error = null;

  ApiResponse.error(this.error) : success = false, data = null;
}

class BitacoraService {
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<ApiResponse<List<RegistroBitacora>>> getBitacora({
    String? busqueda,
    String? rol,
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final Map<String, String> queryParams = {};

      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }
      if (rol != null && rol.isNotEmpty) {
        queryParams['rol'] = rol;
      }

      final uri = Uri.parse(
        '$baseUrl/api/bitacora/',
      ).replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final response = await http.get(uri, headers: await _getHeaders());

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );

        List<dynamic> data;
        if (responseData is List) {
          data = responseData;
        } else if (responseData is Map && responseData.containsKey('results')) {
          data = responseData['results'] as List;
        } else {
          data = [];
        }

        final registros = data
            .map((json) => RegistroBitacora.fromJson(json))
            .toList();
        return ApiResponse.success(registros);
      } else {
        return ApiResponse.error(
          'Error al cargar bitácora: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<RegistroBitacora>> getRegistro(int id) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/bitacora/$id/'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );
        return ApiResponse.success(RegistroBitacora.fromJson(responseData));
      } else {
        return ApiResponse.error(
          'Error al cargar registro: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
