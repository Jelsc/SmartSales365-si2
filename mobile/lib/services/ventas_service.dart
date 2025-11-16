import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ItemPedido {
  final int id;
  final int producto;
  final String productoNombre;
  final String? productoImagen;
  final String nombreProducto;
  final String sku;
  final double precioUnitario;
  final int cantidad;
  final double subtotal;
  final Map<String, dynamic>? varianteInfo;

  ItemPedido({
    required this.id,
    required this.producto,
    required this.productoNombre,
    this.productoImagen,
    required this.nombreProducto,
    required this.sku,
    required this.precioUnitario,
    required this.cantidad,
    required this.subtotal,
    this.varianteInfo,
  });

  factory ItemPedido.fromJson(Map<String, dynamic> json) {
    return ItemPedido(
      id: json['id'] ?? 0,
      producto: json['producto'] ?? 0,
      productoNombre: json['producto_nombre'] ?? '',
      productoImagen: json['producto_imagen'],
      nombreProducto: json['nombre_producto'] ?? '',
      sku: json['sku'] ?? '',
      precioUnitario: _parseDecimal(json['precio_unitario']),
      cantidad: json['cantidad'] ?? 0,
      subtotal: _parseDecimal(json['subtotal']),
      varianteInfo: json['variante_info'],
    );
  }

  static double _parseDecimal(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

class DireccionEnvio {
  final int id;
  final String nombreCompleto;
  final String telefono;
  final String email;
  final String direccion;
  final String? referencia;
  final String ciudad;
  final String departamento;
  final String? codigoPostal;

  DireccionEnvio({
    required this.id,
    required this.nombreCompleto,
    required this.telefono,
    required this.email,
    required this.direccion,
    this.referencia,
    required this.ciudad,
    required this.departamento,
    this.codigoPostal,
  });

  factory DireccionEnvio.fromJson(Map<String, dynamic> json) {
    return DireccionEnvio(
      id: json['id'] ?? 0,
      nombreCompleto: json['nombre_completo'] ?? '',
      telefono: json['telefono'] ?? '',
      email: json['email'] ?? '',
      direccion: json['direccion'] ?? '',
      referencia: json['referencia'],
      ciudad: json['ciudad'] ?? '',
      departamento: json['departamento'] ?? '',
      codigoPostal: json['codigo_postal'],
    );
  }
}

class Pedido {
  final int id;
  final String numeroPedido;
  final int usuario;
  final String estado;
  final double subtotal;
  final double descuento;
  final double impuestos;
  final double costoEnvio;
  final double total;
  final String? notasCliente;
  final String? notasInternas;
  final List<ItemPedido>? items;
  final DireccionEnvio? direccionEnvio;
  final DateTime creado;
  final DateTime actualizado;
  final DateTime? pagadoEn;
  final DateTime? enviadoEn;
  final DateTime? entregadoEn;
  final int? totalItems;

  Pedido({
    required this.id,
    required this.numeroPedido,
    required this.usuario,
    required this.estado,
    required this.subtotal,
    required this.descuento,
    required this.impuestos,
    required this.costoEnvio,
    required this.total,
    this.notasCliente,
    this.notasInternas,
    this.items,
    this.direccionEnvio,
    required this.creado,
    required this.actualizado,
    this.pagadoEn,
    this.enviadoEn,
    this.entregadoEn,
    this.totalItems,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'] ?? 0,
      numeroPedido: json['numero_pedido'] ?? '',
      usuario: json['usuario'] ?? 0,
      estado: json['estado'] ?? 'PENDIENTE',
      subtotal: _parseDecimal(json['subtotal']),
      descuento: _parseDecimal(json['descuento']),
      impuestos: _parseDecimal(json['impuestos']),
      costoEnvio: _parseDecimal(json['costo_envio']),
      total: _parseDecimal(json['total']),
      notasCliente: json['notas_cliente'],
      notasInternas: json['notas_internas'],
      items: json['items'] != null
          ? (json['items'] as List).map((i) => ItemPedido.fromJson(i)).toList()
          : null,
      direccionEnvio: json['direccion_envio'] != null
          ? DireccionEnvio.fromJson(json['direccion_envio'])
          : null,
      creado: json['creado'] != null
          ? DateTime.parse(json['creado'])
          : DateTime.now(),
      actualizado: json['actualizado'] != null
          ? DateTime.parse(json['actualizado'])
          : DateTime.now(),
      pagadoEn: json['pagado_en'] != null
          ? DateTime.parse(json['pagado_en'])
          : null,
      enviadoEn: json['enviado_en'] != null
          ? DateTime.parse(json['enviado_en'])
          : null,
      entregadoEn: json['entregado_en'] != null
          ? DateTime.parse(json['entregado_en'])
          : null,
      totalItems: json['total_items'],
    );
  }

  static double _parseDecimal(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  String get estadoTexto {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'PAGADO':
        return 'Pagado';
      case 'PROCESANDO':
        return 'Procesando';
      case 'ENVIADO':
        return 'Enviado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      case 'REEMBOLSADO':
        return 'Reembolsado';
      default:
        return estado;
    }
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse.success(this.data) : success = true, error = null;

  ApiResponse.error(this.error) : success = false, data = null;

  String get message => error ?? 'Operación exitosa';
}

class VentasService {
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

  Future<ApiResponse<List<Pedido>>> getPedidos({
    String? estado,
    String? fechaInicio,
    String? fechaFin,
    int? usuarioId,
    String? busqueda,
  }) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final Map<String, String> queryParams = {};

      if (estado != null && estado.isNotEmpty) {
        queryParams['estado'] = estado;
      }
      if (fechaInicio != null && fechaInicio.isNotEmpty) {
        queryParams['fecha_inicio'] = fechaInicio;
      }
      if (fechaFin != null && fechaFin.isNotEmpty) {
        queryParams['fecha_fin'] = fechaFin;
      }
      if (usuarioId != null) {
        queryParams['usuario'] = usuarioId.toString();
      }
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final uri = Uri.parse(
        '$baseUrl/api/ventas/pedidos/',
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

        final pedidos = data.map((json) => Pedido.fromJson(json)).toList();
        return ApiResponse.success(pedidos);
      } else {
        return ApiResponse.error(
          'Error al cargar pedidos: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Pedido>> getPedido(int id) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/ventas/pedidos/$id/detalle/'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );
        return ApiResponse.success(Pedido.fromJson(responseData));
      } else {
        return ApiResponse.error(
          'Error al cargar pedido: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Pedido>> actualizarEstado(
    int id,
    String nuevoEstado,
  ) async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final response = await http.patch(
        Uri.parse('$baseUrl/api/ventas/pedidos/$id/actualizar_estado/'),
        headers: await _getHeaders(),
        body: json.encode({'estado': nuevoEstado}),
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(
          utf8.decode(response.bodyBytes),
        );
        return ApiResponse.success(Pedido.fromJson(responseData));
      } else {
        return ApiResponse.error(
          'Error al actualizar estado: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
