import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

/// Servicio para gestionar estadísticas del dashboard admin
class DashboardAdminService {
  final AuthService _authService = AuthService();

  /// Obtener estadísticas generales
  Future<ApiResponse<DashboardStats>> getEstadisticas() async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();

      final token = await _authService.getToken();
      if (token == null) {
        return ApiResponse(success: false, message: 'No autenticado');
      }

      // Obtener datos de múltiples endpoints
      final productosResponse = await _getCount(
        '$baseUrl/api/productos/',
        token,
      );
      final conductoresResponse = await _getCount(
        '$baseUrl/api/conductores/',
        token,
      );
      final personalResponse = await _getCount('$baseUrl/api/personal/', token);
      final usuariosResponse = await _getCount('$baseUrl/api/users/', token);
      final pagosResponse = await _getVentas(baseUrl, token);

      final stats = DashboardStats(
        totalProductos: productosResponse,
        totalConductores: conductoresResponse,
        totalPersonal: personalResponse,
        totalUsuarios: usuariosResponse,
        totalVentas: pagosResponse['count'] ?? 0,
        ventasHoy: pagosResponse['hoy'] ?? 0,
        ingresosTotal: pagosResponse['total'] ?? 0.0,
        ingresosMes: pagosResponse['mes'] ?? 0.0,
      );

      return ApiResponse(
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente',
      );
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  Future<int> _getCount(String url, String token) async {
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data.containsKey('count')) {
          return data['count'] as int;
        } else if (data is List) {
          return data.length;
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  Future<Map<String, dynamic>> _getVentas(String baseUrl, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/payments/pagos/'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> pagos = data['results'] ?? data;

        final now = DateTime.now();
        final hoy = pagos.where((p) {
          final fecha = DateTime.parse(p['created_at']);
          return fecha.year == now.year &&
              fecha.month == now.month &&
              fecha.day == now.day;
        }).length;

        final mes = pagos.where((p) {
          final fecha = DateTime.parse(p['created_at']);
          return fecha.year == now.year && fecha.month == now.month;
        }).length;

        double total = 0.0;
        double totalMes = 0.0;

        for (var pago in pagos) {
          final monto = (pago['monto'] ?? 0).toDouble();
          total += monto;

          final fecha = DateTime.parse(pago['created_at']);
          if (fecha.year == now.year && fecha.month == now.month) {
            totalMes += monto;
          }
        }

        return {
          'count': pagos.length,
          'hoy': hoy,
          'mes': mes,
          'total': total,
          'totalMes': totalMes,
        };
      }
      return {'count': 0, 'hoy': 0, 'mes': 0, 'total': 0.0, 'totalMes': 0.0};
    } catch (e) {
      return {'count': 0, 'hoy': 0, 'mes': 0, 'total': 0.0, 'totalMes': 0.0};
    }
  }

  /// Obtener productos con bajo stock
  Future<ApiResponse<List<ProductoBajoStock>>> getProductosBajoStock() async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/productos/?activo=true';

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

        // Filtrar productos con stock <= 10
        final productosBajoStock = results
            .where((p) => (p['stock'] ?? 0) <= 10)
            .map((json) => ProductoBajoStock.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: productosBajoStock,
          message: 'Productos con bajo stock obtenidos',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener productos',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Obtener actividades recientes
  Future<ApiResponse<List<ActividadReciente>>> getActividadesRecientes() async {
    try {
      final baseUrl = ApiConfig.getBaseUrl();
      final url = '$baseUrl/api/bitacora/?ordering=-fecha_hora&page_size=10';

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
        final actividades = results
            .map((json) => ActividadReciente.fromJson(json))
            .toList();

        return ApiResponse(
          success: true,
          data: actividades,
          message: 'Actividades recientes obtenidas',
        );
      } else {
        return ApiResponse(
          success: false,
          message: 'Error al obtener actividades',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}

/// Modelo de estadísticas del dashboard
class DashboardStats {
  final int totalProductos;
  final int totalConductores;
  final int totalPersonal;
  final int totalUsuarios;
  final int totalVentas;
  final int ventasHoy;
  final double ingresosTotal;
  final double ingresosMes;

  DashboardStats({
    required this.totalProductos,
    required this.totalConductores,
    required this.totalPersonal,
    required this.totalUsuarios,
    required this.totalVentas,
    required this.ventasHoy,
    required this.ingresosTotal,
    required this.ingresosMes,
  });
}

/// Modelo de producto con bajo stock
class ProductoBajoStock {
  final int id;
  final String nombre;
  final int stock;
  final String categoria;

  ProductoBajoStock({
    required this.id,
    required this.nombre,
    required this.stock,
    required this.categoria,
  });

  factory ProductoBajoStock.fromJson(Map<String, dynamic> json) {
    return ProductoBajoStock(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      stock: json['stock'] ?? 0,
      categoria: json['categoria_nombre'] ?? json['categoria'] ?? '',
    );
  }
}

/// Modelo de actividad reciente
class ActividadReciente {
  final String usuario;
  final String accion;
  final String descripcion;
  final DateTime fechaHora;
  final String modulo;

  ActividadReciente({
    required this.usuario,
    required this.accion,
    required this.descripcion,
    required this.fechaHora,
    required this.modulo,
  });

  factory ActividadReciente.fromJson(Map<String, dynamic> json) {
    return ActividadReciente(
      usuario: json['usuario'] ?? json['usuario_username'] ?? 'Sistema',
      accion: json['accion'] ?? '',
      descripcion: json['descripcion'] ?? '',
      fechaHora: json['fecha_hora'] != null
          ? DateTime.parse(json['fecha_hora'])
          : DateTime.now(),
      modulo: json['modulo'] ?? '',
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
