import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class Usuario {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String nombreCompleto;
  final String? telefono;
  final String? ci;
  final bool isActive;
  final bool isStaff;
  final bool puedeAccederAdmin;
  final bool esAdministrativo;
  final bool esCliente;
  final String? rolNombre;
  final String? rolDescripcion;
  final DateTime dateJoined;

  Usuario({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.nombreCompleto,
    this.telefono,
    this.ci,
    required this.isActive,
    required this.isStaff,
    required this.puedeAccederAdmin,
    required this.esAdministrativo,
    required this.esCliente,
    this.rolNombre,
    this.rolDescripcion,
    required this.dateJoined,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    final rol = json['rol'] as Map<String, dynamic>?;
    return Usuario(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      nombreCompleto: '${json['first_name']} ${json['last_name']}'.trim(),
      telefono: json['telefono'],
      ci: json['ci'],
      isActive: json['is_active'] ?? true,
      isStaff: json['is_staff'] ?? false,
      puedeAccederAdmin: json['puede_acceder_admin'] ?? false,
      esAdministrativo: json['es_administrativo'] ?? false,
      esCliente: json['es_cliente'] ?? false,
      rolNombre: rol?['nombre'],
      rolDescripcion: rol?['descripcion'],
      dateJoined: json['date_joined'] != null
          ? DateTime.parse(json['date_joined'])
          : DateTime.now(),
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

class UsuariosService {
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

  Future<ApiResponse<List<Usuario>>> getUsuarios({String? busqueda}) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final Map<String, String> queryParams = {};

      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final uri = Uri.parse(
        '$baseUrl/api/users/',
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

        final usuarios = data.map((json) => Usuario.fromJson(json)).toList();
        return ApiResponse.success(usuarios);
      } else {
        return ApiResponse.error(
          'Error al cargar usuarios: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Usuario>> getUsuario(int id) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/$id/'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );
        return ApiResponse.success(Usuario.fromJson(responseData));
      } else {
        return ApiResponse.error(
          'Error al cargar usuario: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
