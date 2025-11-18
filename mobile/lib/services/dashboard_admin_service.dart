import 'auth_service.dart';
import '../utils/http_helper.dart';

/// Servicio para gestionar estadísticas del dashboard admin
class DashboardAdminService {
  final AuthService _authService = AuthService();

  /// Obtener estadísticas generales
  /// USAR EL MISMO ENDPOINT QUE EL FRONTEND: /api/analytics/dashboard/metricas-generales/
  Future<ApiResponse<DashboardStats>> getEstadisticas() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Dashboard: No hay token de autenticación');
        return ApiResponse(success: false, message: 'No autenticado');
      }
      
      print('✅ Dashboard: Token encontrado (${token.length} caracteres)');
      print('🔵 Llamando endpoint (igual que frontend): /api/analytics/dashboard/metricas-generales/');

      // USAR EL MISMO ENDPOINT QUE EL FRONTEND
      final response = await HttpHelper.get<Map<String, dynamic>>(
        '/api/analytics/dashboard/metricas-generales/',
      );

      if (response.success && response.data != null) {
        try {
          final data = response.data!;
          
          print('✅ Dashboard: Datos recibidos del backend');
          print('   Total productos: ${data['total_productos'] ?? 0}');
          print('   Total conductores: ${data['total_conductores'] ?? 0}');
          print('   Total personal: ${data['total_personal'] ?? 0}');
          print('   Total usuarios: ${data['total_usuarios'] ?? 0}');
          print('   Total ventas: ${data['total_ventas'] ?? 0}');

          final stats = DashboardStats(
            totalProductos: data['total_productos'] ?? 0,
            totalConductores: data['total_conductores'] ?? 0,
            totalPersonal: data['total_personal'] ?? 0,
            totalUsuarios: data['total_usuarios'] ?? 0,
            totalVentas: data['total_ventas'] ?? 0,
            ventasHoy: data['ventas_hoy'] ?? 0,
            ingresosTotal: (data['ingresos_total'] ?? 0.0).toDouble(),
            ingresosMes: (data['ingresos_mes'] ?? 0.0).toDouble(),
          );

          return ApiResponse(
            success: true,
            data: stats,
            message: 'Estadísticas obtenidas correctamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando estadísticas: $e');
          print('❌ Stack trace: $stackTrace');
          print('❌ Data recibida: ${response.data}');
          return ApiResponse(
            success: false,
            message: 'Error parseando estadísticas: $e',
          );
        }
      } else {
        print('❌ Error obteniendo estadísticas: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción obteniendo estadísticas: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Obtener productos con bajo stock
  /// USAR EL MISMO ENDPOINT QUE EL FRONTEND: /api/analytics/dashboard/productos-bajo-stock/
  Future<ApiResponse<List<ProductoBajoStock>>> getProductosBajoStock() async {
    try {
      print('🔵 Llamando endpoint (igual que frontend): /api/analytics/dashboard/productos-bajo-stock/?umbral=10');
      
      // USAR EL MISMO ENDPOINT QUE EL FRONTEND
      final response = await HttpHelper.get<Map<String, dynamic>>(
        '/api/analytics/dashboard/productos-bajo-stock/?umbral=10',
      );

      if (response.success && response.data != null) {
        try {
          final data = response.data!;
          
          // El frontend devuelve: { productos: [...], total: number, umbral: number }
          List<dynamic> productosJson;
          if (data.containsKey('productos')) {
            productosJson = data['productos'] as List<dynamic>;
            print('✅ Respuesta: ${productosJson.length} productos bajo stock (total: ${data['total'] ?? 'N/A'})');
          } else {
            productosJson = [];
            print('⚠️ Formato de respuesta desconocido (no tiene productos)');
          }
          
          final productosBajoStock = productosJson
              .map((json) {
                try {
                  return ProductoBajoStock.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando producto bajo stock: $e');
                  print('❌ JSON: $json');
                  return null;
                }
              })
              .whereType<ProductoBajoStock>()
              .toList();

          print('✅ Productos bajo stock parseados: ${productosBajoStock.length}');
          return ApiResponse(
            success: true,
            data: productosBajoStock,
            message: 'Productos con bajo stock obtenidos',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando productos bajo stock: $e');
          print('❌ Stack trace: $stackTrace');
          print('❌ Data recibida: ${response.data}');
          return ApiResponse(
            success: false,
            message: 'Error parseando productos: $e',
          );
        }
      } else {
        print('⚠️ Error obteniendo productos bajo stock: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error al obtener productos',
        );
      }
    } catch (e) {
      print('❌ Excepción obteniendo productos bajo stock: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Obtener actividades recientes
  Future<ApiResponse<List<ActividadReciente>>> getActividadesRecientes() async {
    try {
      // Frontend puede usar formato paginado: { count, next, previous, results }
      final response = await HttpHelper.get<Map<String, dynamic>>(
        '/api/bitacora/',
        queryParams: {'ordering': '-fecha_hora', 'page_size': '10'},
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Manejar formato paginado
        List<dynamic> results;
        if (data.containsKey('results')) {
          // Formato paginado estándar
          results = data['results'] as List<dynamic>;
        } else {
          results = [];
          print('⚠️ Formato de respuesta desconocido (no tiene results)');
        }
        
        final actividades = results
            .map((json) => ActividadReciente.fromJson(json))
            .toList();

        print('✅ Actividades recientes: ${actividades.length}');
        return ApiResponse(
          success: true,
          data: actividades,
          message: 'Actividades recientes obtenidas',
        );
      } else {
        print('⚠️ Error obteniendo actividades: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error al obtener actividades',
        );
      }
    } catch (e) {
      print('❌ Excepción obteniendo actividades: $e');
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
    // El endpoint de analytics puede devolver categoria como objeto o string
    String categoriaNombre;
    if (json['categoria'] is Map) {
      final catObj = json['categoria'] as Map<String, dynamic>;
      categoriaNombre = catObj['nombre'] ?? '';
    } else {
      categoriaNombre = json['categoria_nombre'] ?? 
                       (json['categoria'] is String ? json['categoria'] : '') ?? 
                       '';
    }
    
    return ProductoBajoStock(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      stock: json['stock'] ?? json['stock_actual'] ?? 0,
      categoria: categoriaNombre,
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
  final String? message;
  final T? data;

  ApiResponse({required this.success, this.message, this.data});
}
