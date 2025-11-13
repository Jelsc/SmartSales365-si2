import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class Categoria {
  final int id;
  final String nombre;
  final String? descripcion;
  final bool activa;
  final DateTime fechaCreacion;
  final DateTime? fechaActualizacion;

  Categoria({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.activa,
    required this.fechaCreacion,
    this.fechaActualizacion,
  });

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      activa: json['activa'] ?? true,
      fechaCreacion: json['creado'] != null
          ? DateTime.parse(json['creado'])
          : DateTime.now(),
      fechaActualizacion: json['actualizado'] != null
          ? DateTime.parse(json['actualizado'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'nombre': nombre, 'descripcion': descripcion, 'activa': activa};
  }
}

class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;

  ApiResponse({required this.success, this.message, this.data});
}

class CategoriasService {
  String _getBaseUrl() {
    final baseUrl = ApiConfig.getBaseUrl();
    return '$baseUrl/api/categorias';
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

  // Obtener todas las categorías
  Future<ApiResponse<List<Categoria>>> getCategorias({
    bool? activa,
    String? busqueda,
  }) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();

      // Construir query params
      final queryParams = <String, String>{};
      if (activa != null) queryParams['activa'] = activa.toString();
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

        // El backend puede devolver una lista directamente o un objeto con 'results'
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

        final categorias = data
            .map((json) => Categoria.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: categorias,
          message: 'Categorías obtenidas exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener categorías: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  // Obtener una categoría por ID
  Future<ApiResponse<Categoria>> getCategoria(int id) async {
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
          data: Categoria.fromJson(data),
          message: 'Categoría obtenida exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener categoría: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  // Crear una nueva categoría
  Future<ApiResponse<Categoria>> createCategoria(Categoria categoria) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/'),
        headers: headers,
        body: json.encode(categoria.toJson()),
      );

      if (response.statusCode == 201) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: true,
          data: Categoria.fromJson(data),
          message: 'Categoría creada exitosamente',
        );
      } else {
        final errorData = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: false,
          message: 'Error al crear categoría: ${errorData.toString()}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  // Actualizar una categoría
  Future<ApiResponse<Categoria>> updateCategoria(
    int id,
    Categoria categoria,
  ) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/$id/'),
        headers: headers,
        body: json.encode(categoria.toJson()),
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: true,
          data: Categoria.fromJson(data),
          message: 'Categoría actualizada exitosamente',
        );
      } else {
        final errorData = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: false,
          message: 'Error al actualizar categoría: ${errorData.toString()}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  // Eliminar una categoría
  Future<ApiResponse<void>> deleteCategoria(int id) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/$id/'),
        headers: headers,
      );

      if (response.statusCode == 204) {
        return ApiResponse(
          success: true,
          message: 'Categoría eliminada exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al eliminar categoría: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  // Activar/Desactivar categoría
  Future<ApiResponse<Categoria>> toggleActivaCategoria(
    int id,
    bool activa,
  ) async {
    try {
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/$id/'),
        headers: headers,
        body: json.encode({'activa': activa}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: true,
          data: Categoria.fromJson(data),
          message: activa ? 'Categoría activada' : 'Categoría desactivada',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al cambiar estado: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }
}
