import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';

class Rol {
  final int id;
  final String nombre;
  final String descripcion;
  final bool esAdministrativo;
  final List<String> permisos;
  final DateTime fechaCreacion;
  final DateTime? fechaActualizacion;

  Rol({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.esAdministrativo,
    required this.permisos,
    required this.fechaCreacion,
    this.fechaActualizacion,
  });

  factory Rol.fromJson(Map<String, dynamic> json) {
    return Rol(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      esAdministrativo: json['es_administrativo'] ?? false,
      permisos:
          (json['permisos'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      fechaCreacion: json['fecha_creacion'] != null
          ? DateTime.parse(json['fecha_creacion'])
          : DateTime.now(),
      fechaActualizacion: json['fecha_actualizacion'] != null
          ? DateTime.parse(json['fecha_actualizacion'])
          : null,
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

class RolesService {
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

  Future<ApiResponse<List<Rol>>> getRoles({String? busqueda}) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final Map<String, String> queryParams = {};

      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final uri = Uri.parse(
        '$baseUrl/api/roles/',
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

        final roles = data.map((json) => Rol.fromJson(json)).toList();
        return ApiResponse.success(roles);
      } else {
        return ApiResponse.error(
          'Error al cargar roles: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Rol>> getRol(int id) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/roles/$id/'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );
        return ApiResponse.success(Rol.fromJson(responseData));
      } else {
        return ApiResponse.error('Error al cargar rol: ${response.statusCode}');
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
