import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';

// Modelos
class ProductoDetalle {
  final int id;
  final String nombre;
  final String? descripcion;
  final double precio;
  final double? precioOferta;
  final String? imagen;
  final int stock;

  ProductoDetalle({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.precio,
    this.precioOferta,
    this.imagen,
    required this.stock,
  });

  factory ProductoDetalle.fromJson(Map<String, dynamic> json) {
    return ProductoDetalle(
      id: json['id'],
      nombre: json['nombre'],
      descripcion: json['descripcion'],
      precio: double.parse(json['precio'].toString()),
      precioOferta: json['precio_oferta'] != null
          ? double.parse(json['precio_oferta'].toString())
          : null,
      imagen: json['imagen'],
      stock: json['stock'] ?? 0,
    );
  }
}

class ItemCarrito {
  final int id;
  final int producto;
  final ProductoDetalle productoDetalle;
  final int? variante;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final String agregado;

  ItemCarrito({
    required this.id,
    required this.producto,
    required this.productoDetalle,
    this.variante,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    required this.agregado,
  });

  factory ItemCarrito.fromJson(Map<String, dynamic> json) {
    return ItemCarrito(
      id: json['id'],
      producto: json['producto'],
      productoDetalle: ProductoDetalle.fromJson(json['producto_detalle']),
      variante: json['variante'],
      cantidad: json['cantidad'],
      precioUnitario: double.parse(json['precio_unitario'].toString()),
      subtotal: double.parse(json['subtotal'].toString()),
      agregado: json['agregado'],
    );
  }
}

class Carrito {
  final int id;
  final List<ItemCarrito> items;
  final double total;
  final int totalItems;
  final double subtotal;
  final String creado;
  final String actualizado;

  Carrito({
    required this.id,
    required this.items,
    required this.total,
    required this.totalItems,
    required this.subtotal,
    required this.creado,
    required this.actualizado,
  });

  factory Carrito.fromJson(Map<String, dynamic> json) {
    return Carrito(
      id: json['id'],
      items: (json['items'] as List)
          .map((item) => ItemCarrito.fromJson(item))
          .toList(),
      total: double.parse(json['total'].toString()),
      totalItems: json['total_items'] ?? 0,
      subtotal: double.parse(json['subtotal'].toString()),
      creado: json['creado'],
      actualizado: json['actualizado'],
    );
  }
}

class CarritoService {
  final AuthService _authService = AuthService();

  Future<String> _getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('api_url') ?? 'http://localhost:8000';
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    if (token == null) {
      throw Exception('Usuario no autenticado');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Obtener el carrito actual
  Future<Carrito> obtenerCarrito() async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.get(
        Uri.parse('$baseUrl/api/carrito/mi_carrito/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Carrito.fromJson(data);
      } else {
        throw Exception('Error al obtener carrito: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en obtenerCarrito: $e');
      rethrow;
    }
  }

  // Agregar item al carrito
  Future<Carrito> agregarItem(
    int productoId,
    int cantidad, {
    int? varianteId,
  }) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final body = {
        'producto_id': productoId,
        'cantidad': cantidad,
        if (varianteId != null) 'variante_id': varianteId,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/carrito/agregar_item/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Carrito.fromJson(data);
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final error = json.decode(decodedBody);
        throw Exception(error['error'] ?? 'Error al agregar al carrito');
      }
    } catch (e) {
      print('Error en agregarItem: $e');
      rethrow;
    }
  }

  // Actualizar cantidad de un item
  Future<Carrito> actualizarItem(int itemId, int cantidad) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final body = {'cantidad': cantidad};

      final response = await http.patch(
        Uri.parse('$baseUrl/api/carrito/actualizar_item/$itemId/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Carrito.fromJson(data['carrito']);
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final error = json.decode(decodedBody);
        throw Exception(error['error'] ?? 'Error al actualizar item');
      }
    } catch (e) {
      print('Error en actualizarItem: $e');
      rethrow;
    }
  }

  // Eliminar item del carrito
  Future<Carrito> eliminarItem(int itemId) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.delete(
        Uri.parse('$baseUrl/api/carrito/eliminar_item/$itemId/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Carrito.fromJson(data['carrito']);
      } else {
        throw Exception('Error al eliminar item: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en eliminarItem: $e');
      rethrow;
    }
  }

  // Vaciar carrito
  Future<Carrito> vaciarCarrito() async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.post(
        Uri.parse('$baseUrl/api/carrito/vaciar/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Carrito.fromJson(data['carrito']);
      } else {
        throw Exception('Error al vaciar carrito: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en vaciarCarrito: $e');
      rethrow;
    }
  }
}
