import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import '../config/api_config.dart';

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
      id: json['id'] ?? 0,
      nombreProducto: json['nombre_producto'] ?? '',
      sku: json['sku'],
      precioUnitario: json['precio_unitario'] != null
          ? double.parse(json['precio_unitario'].toString())
          : 0.0,
      cantidad: json['cantidad'] ?? 0,
      subtotal: json['subtotal'] != null
          ? double.parse(json['subtotal'].toString())
          : 0.0,
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
      id: json['id'] ?? 0,
      nombreCompleto: json['nombre_completo'] ?? '',
      telefono: json['telefono'] ?? '',
      email: json['email'],
      direccion: json['direccion'] ?? '',
      direccion2: json['direccion_2'],
      ciudad: json['ciudad'] ?? '',
      departamento: json['departamento'],
      codigoPostal: json['codigo_postal'] ?? '',
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
      id: json['id'] ?? 0,
      numeroPedido: json['numero_pedido'] ?? '',
      usuario: json['usuario'],
      estado: json['estado'] ?? 'PENDIENTE',
      subtotal: json['subtotal'] != null
          ? double.parse(json['subtotal'].toString())
          : 0.0,
      descuento: json['descuento'] != null
          ? double.parse(json['descuento'].toString())
          : 0.0,
      impuestos: json['impuestos'] != null
          ? double.parse(json['impuestos'].toString())
          : 0.0,
      costoEnvio: json['costo_envio'] != null
          ? double.parse(json['costo_envio'].toString())
          : 0.0,
      total: json['total'] != null
          ? double.parse(json['total'].toString())
          : 0.0,
      totalItems: json['total_items'],
      notasCliente: json['notas_cliente'],
      creado: json['creado'] ?? DateTime.now().toIso8601String(),
      actualizado: json['actualizado'] ?? DateTime.now().toIso8601String(),
      pagadoEn: json['pagado_en'],
      enviadoEn: json['enviado_en'],
      entregadoEn: json['entregado_en'],
      items: json['items'] != null && json['items'] is List
          ? (json['items'] as List)
                .map(
                  (item) =>
                      ItemPedidoDetalle.fromJson(item as Map<String, dynamic>),
                )
                .toList()
          : null,
      direccionEnvio:
          json['direccion_envio'] != null &&
              json['direccion_envio'] is Map<String, dynamic>
          ? DireccionEnvio.fromJson(
              json['direccion_envio'] as Map<String, dynamic>,
            )
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
      'direccion': direccionEnvio
          .toJson(), // Backend espera 'direccion', no 'direccion_envio'
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
    try {
      // Validar que 'results' existe y es una lista
      if (!json.containsKey('results')) {
        print('[PEDIDOS] ⚠️ La respuesta no contiene "results"');
        return PedidosResponse(
          count: json['count'] ?? 0,
          next: json['next'],
          previous: json['previous'],
          results: [],
        );
      }

      final resultsList = json['results'];
      if (resultsList is! List) {
        print(
          '[PEDIDOS] ⚠️ "results" no es una lista, es: ${resultsList.runtimeType}',
        );
        return PedidosResponse(
          count: json['count'] ?? 0,
          next: json['next'],
          previous: json['previous'],
          results: [],
        );
      }

      final pedidos = <Pedido>[];
      for (var i = 0; i < resultsList.length; i++) {
        try {
          final pedidoJson = resultsList[i] as Map<String, dynamic>;
          pedidos.add(Pedido.fromJson(pedidoJson));
        } catch (e) {
          print('[PEDIDOS] ⚠️ Error parseando pedido $i: $e');
          // Continuar con los demás pedidos
        }
      }

      return PedidosResponse(
        count: json['count'] ?? pedidos.length,
        next: json['next'],
        previous: json['previous'],
        results: pedidos,
      );
    } catch (e) {
      print('[PEDIDOS] ❌ Error en PedidosResponse.fromJson: $e');
      rethrow;
    }
  }
}

class PedidosService {
  final AuthService _authService = AuthService();

  String _getBaseUrl() {
    return ApiConfig.getBaseUrl();
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
      final baseUrl = _getBaseUrl();
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
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();

      final queryParams = <String, String>{
        'page': page.toString(),
        if (estado != null) 'estado': estado,
      };

      final uri = Uri.parse(
        '$baseUrl/api/ventas/pedidos/mis_pedidos/',
      ).replace(queryParameters: queryParams);

      print('[PEDIDOS] Obteniendo mis pedidos desde: $uri');
      print('[PEDIDOS] Headers: ${headers.keys}');

      final response = await http
          .get(uri, headers: headers)
          .timeout(
            const Duration(seconds: 15),
            onTimeout: () {
              throw Exception('Tiempo de espera agotado al cargar pedidos');
            },
          );

      print('[PEDIDOS] Status code: ${response.statusCode}');
      print('[PEDIDOS] Response body length: ${response.bodyBytes.length}');

      if (response.statusCode == 200) {
        final decodedBody = utf8.decode(response.bodyBytes);
        print(
          '[PEDIDOS] Response body: ${decodedBody.substring(0, decodedBody.length > 500 ? 500 : decodedBody.length)}...',
        );

        final data = json.decode(decodedBody);

        // Validar que la respuesta tenga el formato esperado
        if (data is! Map<String, dynamic>) {
          throw Exception(
            'La respuesta del servidor no tiene el formato esperado',
          );
        }

        // Verificar si hay resultados
        if (!data.containsKey('results')) {
          print(
            '[PEDIDOS] ⚠️ La respuesta no contiene "results", estructura: ${data.keys}',
          );
          // Si no hay 'results', puede ser que el backend devuelva directamente una lista
          if (data.containsKey('count') && data['count'] == 0) {
            print('[PEDIDOS] No hay pedidos (count = 0)');
            return PedidosResponse(count: 0, results: []);
          }
          // Intentar parsear como lista directa
          if (data is List) {
            print('[PEDIDOS] La respuesta es una lista directa');
            return PedidosResponse(
              count: (data as List).length,
              results: (data as List)
                  .map((p) => Pedido.fromJson(p as Map<String, dynamic>))
                  .toList(),
            );
          }
          throw Exception('Formato de respuesta inesperado del servidor');
        }

        final responseObj = PedidosResponse.fromJson(data);
        print(
          '[PEDIDOS] ✅ Pedidos cargados: ${responseObj.count} total, ${responseObj.results.length} en esta página',
        );
        return responseObj;
      } else if (response.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor, inicia sesión nuevamente');
      } else if (response.statusCode == 403) {
        throw Exception('No tienes permisos para ver pedidos');
      } else if (response.statusCode == 404) {
        throw Exception('El endpoint de pedidos no fue encontrado');
      } else {
        final decodedBody = utf8.decode(response.bodyBytes);
        final errorData = json.decode(decodedBody);
        final errorMessage =
            errorData['detail'] ??
            errorData['error'] ??
            errorData['message'] ??
            'Error al cargar pedidos: ${response.statusCode}';
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('[PEDIDOS] ❌ Error en getMisPedidos: $e');
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener detalle de un pedido
  Future<Pedido> getPedido(int pedidoId) async {
    try {
      final baseUrl = _getBaseUrl();
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
      final baseUrl = _getBaseUrl();
      final headers = await _getHeaders();

      final response = await http.post(
        Uri.parse('$baseUrl/api/ventas/pedidos/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 201) {
        final decodedBody = utf8.decode(response.bodyBytes);
        final data = json.decode(decodedBody);

        // El backend devuelve datos básicos del pedido, necesitamos obtener el detalle completo
        // El serializer devuelve: {id, numero_pedido, estado, total, subtotal, items_count}
        final pedidoId = data['id'];
        if (pedidoId != null) {
          // Obtener el detalle completo del pedido
          print('[PEDIDOS] Obteniendo detalle completo del pedido $pedidoId');
          return await getPedido(pedidoId);
        } else {
          throw Exception('No se recibió el ID del pedido creado');
        }
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
      final baseUrl = _getBaseUrl();
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
      final baseUrl = _getBaseUrl();
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
