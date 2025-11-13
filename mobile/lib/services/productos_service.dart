import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';

// Modelos
class Categoria {
  final int id;
  final String nombre;
  final String slug;
  final String? descripcion;
  final String? imagen;
  final bool activa;
  final int orden;
  final int productosCount;

  Categoria({
    required this.id,
    required this.nombre,
    required this.slug,
    this.descripcion,
    this.imagen,
    required this.activa,
    required this.orden,
    required this.productosCount,
  });

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id'],
      nombre: json['nombre'],
      slug: json['slug'],
      descripcion: json['descripcion'],
      imagen: json['imagen'],
      activa: json['activa'] ?? true,
      orden: json['orden'] ?? 0,
      productosCount: json['productos_count'] ?? 0,
    );
  }
}

class ProductoImagen {
  final int id;
  final String imagen;
  final String? alt;
  final int orden;
  final bool esPrincipal;

  ProductoImagen({
    required this.id,
    required this.imagen,
    this.alt,
    required this.orden,
    required this.esPrincipal,
  });

  factory ProductoImagen.fromJson(Map<String, dynamic> json) {
    return ProductoImagen(
      id: json['id'],
      imagen: json['imagen'],
      alt: json['alt'],
      orden: json['orden'] ?? 0,
      esPrincipal: json['es_principal'] ?? false,
    );
  }
}

class Producto {
  final int id;
  final String nombre;
  final String slug;
  final String? descripcion;
  final String? descripcionCorta;
  final String? imagen;
  final int categoriaId;
  final String? categoriaNombre;
  final double precio;
  final bool enOferta;
  final double? precioOferta;
  final double precioFinal;
  final int? descuentoPorcentaje;
  final int stock;
  final int stockMinimo;
  final String? sku;
  final String? marca;
  final String? modelo;
  final bool activo;
  final bool destacado;
  final int vistas;
  final int ventas;
  final List<ProductoImagen> imagenes;

  Producto({
    required this.id,
    required this.nombre,
    required this.slug,
    this.descripcion,
    this.descripcionCorta,
    this.imagen,
    required this.categoriaId,
    this.categoriaNombre,
    required this.precio,
    required this.enOferta,
    this.precioOferta,
    required this.precioFinal,
    this.descuentoPorcentaje,
    required this.stock,
    required this.stockMinimo,
    this.sku,
    this.marca,
    this.modelo,
    required this.activo,
    required this.destacado,
    required this.vistas,
    required this.ventas,
    required this.imagenes,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'],
      nombre: json['nombre'],
      slug: json['slug'],
      descripcion: json['descripcion'],
      descripcionCorta: json['descripcion_corta'],
      imagen: json['imagen'],
      categoriaId: json['categoria'] is Map
          ? json['categoria']['id']
          : json['categoria'],
      categoriaNombre: json['categoria'] is Map
          ? json['categoria']['nombre']
          : null,
      precio: double.parse(json['precio'].toString()),
      enOferta: json['en_oferta'] ?? false,
      precioOferta: json['precio_oferta'] != null
          ? double.parse(json['precio_oferta'].toString())
          : null,
      precioFinal: double.parse(json['precio_final'].toString()),
      descuentoPorcentaje: json['descuento_porcentaje'],
      stock: json['stock'] ?? 0,
      stockMinimo: json['stock_minimo'] ?? 5,
      sku: json['sku'],
      marca: json['marca'],
      modelo: json['modelo'],
      activo: json['activo'] ?? true,
      destacado: json['destacado'] ?? false,
      vistas: json['vistas'] ?? 0,
      ventas: json['ventas'] ?? 0,
      imagenes: json['imagenes'] != null
          ? (json['imagenes'] as List)
                .map((img) => ProductoImagen.fromJson(img))
                .toList()
          : [],
    );
  }
}

class ProductosResponse {
  final int count;
  final String? next;
  final String? previous;
  final List<Producto> results;

  ProductosResponse({
    required this.count,
    this.next,
    this.previous,
    required this.results,
  });

  factory ProductosResponse.fromJson(Map<String, dynamic> json) {
    return ProductosResponse(
      count: json['count'],
      next: json['next'],
      previous: json['previous'],
      results: (json['results'] as List)
          .map((p) => Producto.fromJson(p))
          .toList(),
    );
  }
}

class ProductosService {
  final AuthService _authService = AuthService();

  Future<String> _getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('api_url') ?? 'http://localhost:8000';
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Listar productos con filtros
  Future<ProductosResponse> getProductos({
    int page = 1,
    String? search,
    String? categoriaId,
    double? precioMin,
    double? precioMax,
    bool? enOferta,
    bool? destacado,
    String? ordenamiento,
  }) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      // Construir query parameters
      final queryParams = <String, String>{
        'page': page.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (categoriaId != null) 'categoria': categoriaId,
        if (precioMin != null) 'precio_min': precioMin.toString(),
        if (precioMax != null) 'precio_max': precioMax.toString(),
        if (enOferta != null) 'en_oferta': enOferta.toString(),
        if (destacado != null) 'destacado': destacado.toString(),
        if (ordenamiento != null) 'ordering': ordenamiento,
      };

      final uri = Uri.parse(
        '$baseUrl/api/productos/',
      ).replace(queryParameters: queryParams);

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return ProductosResponse.fromJson(data);
      } else {
        throw Exception('Error al cargar productos: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getProductos: $e');
      rethrow;
    }
  }

  // Obtener un producto por ID
  Future<Producto> getProducto(int id) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.get(
        Uri.parse('$baseUrl/api/productos/$id/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Producto.fromJson(data);
      } else {
        throw Exception('Error al cargar producto: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getProducto: $e');
      rethrow;
    }
  }

  // Obtener productos destacados
  Future<List<Producto>> getProductosDestacados({int limit = 10}) async {
    try {
      final response = await getProductos(
        destacado: true,
        ordenamiento: '-vistas',
      );
      return response.results.take(limit).toList();
    } catch (e) {
      print('Error en getProductosDestacados: $e');
      rethrow;
    }
  }

  // Obtener productos en oferta
  Future<List<Producto>> getProductosEnOferta({int limit = 10}) async {
    try {
      final response = await getProductos(
        enOferta: true,
        ordenamiento: '-descuento_porcentaje',
      );
      return response.results.take(limit).toList();
    } catch (e) {
      print('Error en getProductosEnOferta: $e');
      rethrow;
    }
  }

  // Obtener categorías
  Future<List<Categoria>> getCategorias() async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.get(
        Uri.parse('$baseUrl/api/categorias/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);

        // El backend devuelve con paginación, extraer results
        final List resultsList = data is Map ? (data['results'] ?? []) : data;
        return resultsList.map((cat) => Categoria.fromJson(cat)).toList();
      } else {
        throw Exception('Error al cargar categorías: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getCategorias: $e');
      rethrow;
    }
  }

  // Buscar productos
  Future<List<Producto>> buscarProductos(String query) async {
    try {
      final response = await getProductos(search: query);
      return response.results;
    } catch (e) {
      print('Error en buscarProductos: $e');
      rethrow;
    }
  }
}
