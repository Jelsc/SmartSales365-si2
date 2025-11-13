import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class Conductor {
  final int id;
  final String nombre;
  final String apellido;
  final String nombreCompleto;
  final String ci;
  final String? telefono;
  final String? email;
  final String nroLicencia;
  final String tipoLicencia;
  final DateTime? fechaVencLicencia;
  final String estado;
  final bool licenciaVencida;
  final bool puedConducir;
  final DateTime fechaCreacion;

  Conductor({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.nombreCompleto,
    required this.ci,
    this.telefono,
    this.email,
    required this.nroLicencia,
    required this.tipoLicencia,
    this.fechaVencLicencia,
    required this.estado,
    required this.licenciaVencida,
    required this.puedConducir,
    required this.fechaCreacion,
  });

  factory Conductor.fromJson(Map<String, dynamic> json) {
    return Conductor(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      nombreCompleto:
          json['nombre_completo'] ?? '${json['nombre']} ${json['apellido']}',
      ci: json['ci'] ?? '',
      telefono: json['telefono'],
      email: json['email'],
      nroLicencia: json['nro_licencia'] ?? '',
      tipoLicencia: json['tipo_licencia'] ?? '',
      fechaVencLicencia: json['fecha_venc_licencia'] != null
          ? DateTime.parse(json['fecha_venc_licencia'])
          : null,
      estado: json['estado'] ?? 'activo',
      licenciaVencida: json['licencia_vencida'] ?? false,
      puedConducir: json['puede_conducir'] ?? true,
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

class ConductoresService {
  String _getBaseUrl() {
    final baseUrl = ApiConfig.getBaseUrl();
    return '$baseUrl/api/conductores';
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

  Future<ApiResponse<List<Conductor>>> getConductores({
    String? estado,
    String? tipoLicencia,
    String? busqueda,
  }) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();

      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (tipoLicencia != null) queryParams['tipo_licencia'] = tipoLicencia;
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

        final conductores = data
            .map((json) => Conductor.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: conductores,
          message: 'Conductores obtenidos exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener conductores: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  Future<ApiResponse<Conductor>> getConductor(int id) async {
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
          data: Conductor.fromJson(data),
          message: 'Conductor obtenido exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener conductor',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}
