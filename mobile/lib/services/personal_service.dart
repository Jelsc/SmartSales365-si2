import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class Personal {
  final int id;
  final String nombre;
  final String apellido;
  final String nombreCompleto;
  final String ci;
  final String? telefono;
  final String? email;
  final String codigoEmpleado;
  final String? cargo;
  final DateTime? fechaIngreso;
  final String estado;
  final DateTime fechaCreacion;

  Personal({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.nombreCompleto,
    required this.ci,
    this.telefono,
    this.email,
    required this.codigoEmpleado,
    this.cargo,
    this.fechaIngreso,
    required this.estado,
    required this.fechaCreacion,
  });

  factory Personal.fromJson(Map<String, dynamic> json) {
    return Personal(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      nombreCompleto:
          json['nombre_completo'] ?? '${json['nombre']} ${json['apellido']}',
      ci: json['ci'] ?? '',
      telefono: json['telefono'],
      email: json['email'],
      codigoEmpleado: json['codigo_empleado'] ?? '',
      cargo: json['cargo'],
      fechaIngreso: json['fecha_ingreso'] != null
          ? DateTime.parse(json['fecha_ingreso'])
          : null,
      estado: json['estado'] ?? 'activo',
      fechaCreacion: json['fecha_creacion'] != null
          ? DateTime.parse(json['fecha_creacion'])
          : DateTime.now(),
    );
  }
}

class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;

  ApiResponse({required this.success, this.message, this.data});
}

class PersonalService {
  String _getBaseUrl() {
    final baseUrl = ApiConfig.getBaseUrl();
    return '$baseUrl/api/personal';
  }

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

  Future<ApiResponse<List<Personal>>> getPersonal({
    String? estado,
    String? busqueda,
  }) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();

      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (busqueda != null && busqueda.isNotEmpty)
        queryParams['search'] = busqueda;

      final uri = Uri.parse(
        baseUrl,
      ).replace(queryParameters: queryParams.isEmpty ? null : queryParams);

      final response = await http.get(uri, headers: headers);

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
          return ApiResponse(
            success: false,
            message: 'Formato de respuesta inesperado',
          );
        }

        final personal = data.map((json) => Personal.fromJson(json)).toList();

        return ApiResponse(
          success: true,
          data: personal,
          message: 'Personal obtenido exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener personal: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  Future<ApiResponse<Personal>> getPersonalById(int id) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/$id/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: true,
          data: Personal.fromJson(data),
          message: 'Personal obtenido exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener personal',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}
