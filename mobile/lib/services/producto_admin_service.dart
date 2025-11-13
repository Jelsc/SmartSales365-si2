import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

/// Servicio para gestionar productos desde el panel admin
class ProductoAdminService {
  final AuthService _authService = AuthService();

  /// Obtener todos los productos
  Future<ApiResponse<List<Producto>>> getProductos({
    String? categoria,
    bool? activo,
    bool? destacado,
    String? busqueda,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      var url = '$baseUrl/api/productos/';

      // Agregar parámetros de filtro
      final params = <String, String>{};
      if (categoria != null) params['categoria'] = categoria;
      if (activo != null) params['activo'] = activo.toString();
      if (destacado != null) params['destacado'] = destacado.toString();
      if (busqueda != null && busqueda.isNotEmpty) params['search'] = busqueda;

      if (params.isNotEmpty) {
        url += '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}';
      }

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> results = data['results'] ?? data;
        final productos = results
            .map((json) => Producto.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: productos,
          message: 'Productos obtenidos correctamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener productos: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  /// Obtener un producto por ID
  Future<ApiResponse<Producto>> getProducto(int id) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/productos/$id/';

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ApiResponse(
          success: true,
          data: Producto.fromJson(data),
          message: 'Producto obtenido correctamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener producto',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Crear un nuevo producto
  Future<ApiResponse<Producto>> crearProducto({
    required String nombre,
    required String descripcion,
    required double precio,
    required int stock,
    required int categoriaId,
    String? imagen,
    bool activo = true,
    bool destacado = false,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/productos/';

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      final body = jsonEncode({
        'nombre': nombre,
        'descripcion': descripcion,
        'precio': precio,
        'stock': stock,
        'categoria': categoriaId,
        'imagen': imagen ?? '',
        'activo': activo,
        'destacado': destacado,
      });

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: body,
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return ApiResponse(
          success: true,
          data: Producto.fromJson(data),
          message: 'Producto creado exitosamente',
        );
      } else {
        final error = jsonDecode(response.body);
        return ApiResponse(
          success: false,
          message: error['detail'] ?? 'Error al crear producto',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Actualizar un producto existente
  Future<ApiResponse<Producto>> actualizarProducto({
    required int id,
    String? nombre,
    String? descripcion,
    double? precio,
    int? stock,
    int? categoriaId,
    String? imagen,
    bool? activo,
    bool? destacado,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/productos/$id/';

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      final body = <String, dynamic>{};
      if (nombre != null) body['nombre'] = nombre;
      if (descripcion != null) body['descripcion'] = descripcion;
      if (precio != null) body['precio'] = precio;
      if (stock != null) body['stock'] = stock;
      if (categoriaId != null) body['categoria'] = categoriaId;
      if (imagen != null) body['imagen'] = imagen;
      if (activo != null) body['activo'] = activo;
      if (destacado != null) body['destacado'] = destacado;

      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ApiResponse(
          success: true,
          data: Producto.fromJson(data),
          message: 'Producto actualizado exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al actualizar producto',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Eliminar un producto
  Future<ApiResponse<void>> eliminarProducto(int id) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/productos/$id/';

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      final response = await http.delete(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 204) {
        return ApiResponse(
          success: true,
          message: 'Producto eliminado exitosamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al eliminar producto',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Obtener categorías disponibles
  Future<ApiResponse<List<Categoria>>> getCategorias() async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/categorias/';

      final token = await _authService.getToken();

      final response = await http.get(
        Uri.parse(url),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> results = data['results'] ?? data;
        final categorias = results
            .map((json) => Categoria.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: categorias,
          message: 'Categorías obtenidas correctamente',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener categorías',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}

/// Modelo de Producto para admin
class Producto {
  final int id;
  final String nombre;
  final String descripcion;
  final double precio;
  final String? imagen;
  final int stock;
  final String categoria;
  final int categoriaId;
  final bool activo;
  final bool destacado;
  final bool disponible;
  final DateTime createdAt;

  Producto({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.precio,
    this.imagen,
    required this.stock,
    required this.categoria,
    required this.categoriaId,
    this.activo = true,
    this.destacado = false,
    this.disponible = true,
    required this.createdAt,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      precio: (json['precio'] ?? 0).toDouble(),
      imagen: json['imagen'],
      stock: json['stock'] ?? 0,
      categoria: json['categoria_nombre'] ?? json['categoria'] ?? '',
      categoriaId: json['categoria_id'] ?? json['categoria'] ?? 0,
      activo: json['activo'] ?? true,
      destacado: json['destacado'] ?? false,
      disponible: json['disponible'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
}

/// Modelo de Categoría
class Categoria {
  final int id;
  final String nombre;
  final String? descripcion;
  final bool activo;
  final int productosCount;

  Categoria({
    required this.id,
    required this.nombre,
    this.descripcion,
    this.activo = true,
    this.productosCount = 0,
  });

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      activo: json['activo'] ?? true,
      productosCount: json['productos_count'] ?? 0,
    );
  }
}

/// Respuesta genérica de API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;

  ApiResponse({required this.success, this.data, this.message});
}
