import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';

// Modelos
class ItemPedidoDetalle {
  final int id;
  final String nombreProducto;
  final String? sku;
  final double precioUnitario;
  final int cantidad;
  final double subtotal;

  // Alias para compatibilidad
  String get productoNombre => nombreProducto;

  ItemPedidoDetalle({
    required this.id,
    required this.nombreProducto,
    this.sku,
    required this.precioUnitario,
    required this.cantidad,
    required this.subtotal,
  });

  factory ItemPedidoDetalle.fromJson(Map<String, dynamic> json) {
    return ItemPedidoDetalle(
      id: json['id'],
      nombreProducto: json['nombre_producto'],
      sku: json['sku'],
      precioUnitario: double.parse(json['precio_unitario'].toString()),
      cantidad: json['cantidad'],
      subtotal: double.parse(json['subtotal'].toString()),
    );
  }
}

class DireccionEnvio {
  final int id;
  final String nombreCompleto;
  final String telefono;
  final String? email;
  final String direccion;
  final String? direccion2;
  final String ciudad;
  final String? departamento;
  final String codigoPostal;
  final String? pais;
  final String? referencia;

  DireccionEnvio({
    required this.id,
    required this.nombreCompleto,
    required this.telefono,
    this.email,
    required this.direccion,
    this.direccion2,
    required this.ciudad,
    this.departamento,
    required this.codigoPostal,
    this.pais,
    this.referencia,
  });

  factory DireccionEnvio.fromJson(Map<String, dynamic> json) {
    return DireccionEnvio(
      id: json['id'],
      nombreCompleto: json['nombre_completo'],
      telefono: json['telefono'],
      email: json['email'],
      direccion: json['direccion'],
      direccion2: json['direccion_2'],
      ciudad: json['ciudad'],
      departamento: json['departamento'],
      codigoPostal: json['codigo_postal'],
      pais: json['pais'],
      referencia: json['referencia'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nombre_completo': nombreCompleto,
      'telefono': telefono,
      if (email != null) 'email': email,
      'direccion': direccion,
      if (direccion2 != null) 'direccion_2': direccion2,
      'ciudad': ciudad,
      if (departamento != null) 'departamento': departamento,
      'codigo_postal': codigoPostal,
      if (pais != null) 'pais': pais,
      if (referencia != null) 'referencia': referencia,
    };
  }
}

class Pedido {
  final int id;
  final String numeroPedido;
  final int? usuario;
  final String estado;
  final double subtotal;
  final double descuento;
  final double impuestos;
  final double costoEnvio;
  final double total;
  final int? totalItems;
  final String? notasCliente;
  final String creado;
  final String actualizado;
  final String? pagadoEn;
  final String? enviadoEn;
  final String? entregadoEn;
  final List<ItemPedidoDetalle>? items;
  final DireccionEnvio? direccionEnvio;

  Pedido({
    required this.id,
    required this.numeroPedido,
    this.usuario,
    required this.estado,
    required this.subtotal,
    required this.descuento,
    required this.impuestos,
    required this.costoEnvio,
    required this.total,
    this.totalItems,
    this.notasCliente,
    required this.creado,
    required this.actualizado,
    this.pagadoEn,
    this.enviadoEn,
    this.entregadoEn,
    this.items,
    this.direccionEnvio,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'],
      numeroPedido: json['numero_pedido'],
      usuario: json['usuario'],
      estado: json['estado'],
      subtotal: double.parse(json['subtotal'].toString()),
      descuento: double.parse(json['descuento'].toString()),
      impuestos: double.parse(json['impuestos'].toString()),
      costoEnvio: double.parse(json['costo_envio'].toString()),
      total: double.parse(json['total'].toString()),
      totalItems: json['total_items'],
      notasCliente: json['notas_cliente'],
      creado: json['creado'],
      actualizado: json['actualizado'],
      pagadoEn: json['pagado_en'],
      enviadoEn: json['enviado_en'],
      entregadoEn: json['entregado_en'],
      items: json['items'] != null
          ? (json['items'] as List)
                .map((item) => ItemPedidoDetalle.fromJson(item))
                .toList()
          : null,
      direccionEnvio: json['direccion_envio'] != null
          ? DireccionEnvio.fromJson(json['direccion_envio'])
          : null,
    );
  }

  // Helper para obtener el color del estado
  String get estadoColor {
    switch (estado) {
      case 'PENDIENTE':
        return 'warning';
      case 'PAGADO':
      case 'PROCESANDO':
        return 'info';
      case 'ENVIADO':
        return 'primary';
      case 'ENTREGADO':
        return 'success';
      case 'CANCELADO':
      case 'REEMBOLSADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // Helper para obtener etiqueta legible del estado
  String get estadoLabel {
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

  // Alias para compatibilidad
  String get estadoTexto => estadoLabel;
}

class CrearPedidoRequest {
  final String? notasCliente;
  final DireccionEnvio direccionEnvio;

  CrearPedidoRequest({this.notasCliente, required this.direccionEnvio});

  Map<String, dynamic> toJson() {
    return {
      if (notasCliente != null) 'notas_cliente': notasCliente,
      'direccion_envio': direccionEnvio.toJson(),
    };
  }
}

class PedidosResponse {
  final int count;
  final String? next;
  final String? previous;
  final List<Pedido> results;

  PedidosResponse({
    required this.count,
    this.next,
    this.previous,
    required this.results,
  });

  factory PedidosResponse.fromJson(Map<String, dynamic> json) {
    return PedidosResponse(
      count: json['count'],
      next: json['next'],
      previous: json['previous'],
      results: (json['results'] as List)
          .map((p) => Pedido.fromJson(p))
          .toList(),
    );
  }
}

class PedidosService {
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

  // Obtener todos los pedidos (Admin) con filtros
  Future<PedidosResponse> getPedidos({
    String? estado,
    String? busqueda,
    int? usuario,
    String? fechaInicio,
    String? fechaFin,
    int page = 1,
  }) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final queryParams = <String, String>{
        'page': page.toString(),
        if (estado != null) 'estado': estado,
        if (busqueda != null && busqueda.isNotEmpty) 'search': busqueda,
        if (usuario != null) 'usuario': usuario.toString(),
        if (fechaInicio != null) 'fecha_inicio': fechaInicio,
        if (fechaFin != null) 'fecha_fin': fechaFin,
      };

      final uri = Uri.parse(
        '$baseUrl/api/ventas/pedidos/',
      ).replace(queryParameters: queryParams);

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return PedidosResponse.fromJson(data);
      } else {
        throw Exception('Error al cargar pedidos: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getPedidos: $e');
      rethrow;
    }
  }

  // Obtener mis pedidos
  Future<PedidosResponse> getMisPedidos({String? estado, int page = 1}) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final queryParams = <String, String>{
        'page': page.toString(),
        if (estado != null) 'estado': estado,
      };

      final uri = Uri.parse(
        '$baseUrl/api/ventas/pedidos/mis_pedidos/',
      ).replace(queryParameters: queryParams);

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return PedidosResponse.fromJson(data);
      } else {
        throw Exception('Error al cargar pedidos: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getMisPedidos: $e');
      rethrow;
    }
  }

  // Obtener detalle de un pedido
  Future<Pedido> getPedido(int pedidoId) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.get(
        Uri.parse('$baseUrl/api/ventas/pedidos/$pedidoId/detalle/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Pedido.fromJson(data);
      } else {
        throw Exception('Error al cargar pedido: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en getPedido: $e');
      rethrow;
    }
  }

  // Crear un nuevo pedido desde el carrito
  Future<Pedido> crearPedido(CrearPedidoRequest request) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.post(
        Uri.parse('$baseUrl/api/ventas/pedidos/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 201) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Pedido.fromJson(data['pedido']);
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final error = json.decode(decodedBody);
        throw Exception(error['error'] ?? 'Error al crear pedido');
      }
    } catch (e) {
      print('Error en crearPedido: $e');
      rethrow;
    }
  }

  // Cancelar un pedido
  Future<Pedido> cancelarPedido(int pedidoId, String motivo) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final body = {'motivo': motivo};

      final response = await http.post(
        Uri.parse('$baseUrl/api/ventas/pedidos/$pedidoId/cancelar/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Pedido.fromJson(data['pedido']);
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final error = json.decode(decodedBody);
        throw Exception(error['error'] ?? 'Error al cancelar pedido');
      }
    } catch (e) {
      print('Error en cancelarPedido: $e');
      rethrow;
    }
  }

  // Actualizar estado de un pedido (Solo Admin)
  Future<Pedido> actualizarEstado(
    int pedidoId,
    String nuevoEstado, {
    String? notasInternas,
  }) async {
    try {
      final baseUrl = await _getBaseUrl();
      final headers = await _getHeaders();

      final body = {
        'estado': nuevoEstado,
        if (notasInternas != null && notasInternas.isNotEmpty)
          'notas_internas': notasInternas,
      };

      final response = await http.patch(
        Uri.parse('$baseUrl/api/ventas/pedidos/$pedidoId/actualizar_estado/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);
        return Pedido.fromJson(data['pedido']);
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final error = json.decode(decodedBody);
        throw Exception(error['error'] ?? 'Error al actualizar estado');
      }
    } catch (e) {
      print('Error en actualizarEstado: $e');
      rethrow;
    }
  }
}
