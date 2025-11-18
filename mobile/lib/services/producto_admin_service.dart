import '../utils/http_helper.dart';

/// Servicio para gestionar productos desde el panel admin
class ProductoAdminService {

  /// Obtener todos los productos
  Future<ApiResponse<List<Producto>>> getProductos({
    String? categoria,
    bool? activo,
    bool? destacado,
    String? busqueda,
  }) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: productosService.getAll()
      // Frontend usa: /api/productos/ con query params y espera formato paginado
      final queryParams = <String, String>{};
      if (categoria != null) queryParams['categoria'] = categoria;
      if (activo != null) queryParams['activo'] = activo.toString();
      if (destacado != null) queryParams['destacado'] = destacado.toString();
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final queryString = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = queryString.isNotEmpty 
          ? '/api/productos/?$queryString' 
          : '/api/productos/';

      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      // Frontend espera formato paginado: { count, next, previous, results }
      final response = await HttpHelper.get<Map<String, dynamic>>(
        endpoint,
      );

      if (response.success && response.data != null) {
        try {
          final data = response.data!;
          
          print('📦 Data recibida (keys): ${data.keys.toList()}');
          print('📦 Data completa (primeros 500 chars): ${data.toString().substring(0, data.toString().length > 500 ? 500 : data.toString().length)}');
          
          // Manejar formato paginado (igual que frontend)
          List<dynamic> results;
          if (data.containsKey('results')) {
            // Formato paginado estándar
            results = data['results'] as List<dynamic>;
            print('✅ Respuesta paginada: ${results.length} productos (total: ${data['count'] ?? 'N/A'})');
            
            if (results.isNotEmpty) {
              print('📦 Primer producto (raw): ${results[0]}');
            }
          } else if (data is List) {
            // Si es una lista directa (no paginada)
            results = data as List<dynamic>;
            print('✅ Respuesta directa (lista): ${results.length} productos');
            
            if (results.isNotEmpty) {
              print('📦 Primer producto (raw): ${results[0]}');
            }
          } else {
            results = [];
            print('⚠️ Formato de respuesta desconocido (no tiene results ni es lista)');
            print('⚠️ Tipo de data: ${data.runtimeType}');
          }

          final productos = <Producto>[];
          for (var i = 0; i < results.length; i++) {
            try {
              final json = results[i];
              print('🔄 Parseando producto ${i + 1}/${results.length}...');
              final producto = Producto.fromJson(json);
              productos.add(producto);
              print('✅ Producto ${i + 1} parseado: ${producto.nombre}');
            } catch (e, stackTrace) {
              print('❌ Error parseando producto ${i + 1}: $e');
              print('❌ Stack trace: $stackTrace');
              print('❌ JSON del producto: ${results[i]}');
            }
          }

          print('✅ Productos parseados exitosamente: ${productos.length} de ${results.length}');
          if (productos.isEmpty && results.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${results.length} productos del API pero ninguno pudo parsearse');
            print('⚠️ Revisar el primer producto (raw): ${results[0]}');
          }
          
          return ApiResponse(
            success: true,
            data: productos,
            message: 'Productos obtenidos correctamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de productos: $e');
          print('❌ Stack trace: $stackTrace');
          print('❌ Data recibida: ${response.data}');
          return ApiResponse(
            success: false,
            message: 'Error parseando productos: $e',
          );
        }
      } else {
        print('❌ Error cargando productos: ${response.error}');
        print('❌ Response success: ${response.success}');
        print('❌ Response data: ${response.data}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando productos: $e');
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  /// Obtener un producto por ID
  Future<ApiResponse<Producto>> getProducto(int id) async {
    try {
      final response = await HttpHelper.get<Map<String, dynamic>>(
        '/api/productos/$id/',
      );

      if (response.success && response.data != null) {
        try {
          final producto = Producto.fromJson(response.data!);
          print('✅ Producto cargado: ${producto.nombre}');
          return ApiResponse(
            success: true,
            data: producto,
            message: 'Producto obtenido correctamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando producto: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando producto: $e',
          );
        }
      } else {
        print('❌ Error cargando producto: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando producto: $e');
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
      final body = {
        'nombre': nombre,
        'descripcion': descripcion,
        'precio': precio,
        'stock': stock,
        'categoria': categoriaId,
        'imagen': imagen ?? '',
        'activo': activo,
        'destacado': destacado,
      };

      final response = await HttpHelper.post<Map<String, dynamic>>(
        '/api/productos/',
        body,
        parser: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        try {
          final producto = Producto.fromJson(response.data!);
          print('✅ Producto creado: ${producto.nombre}');
          return ApiResponse(
            success: true,
            data: producto,
            message: 'Producto creado exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando producto creado: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando producto: $e',
          );
        }
      } else {
        print('❌ Error creando producto: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error al crear producto',
        );
      }
    } catch (e) {
      print('❌ Excepción creando producto: $e');
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
      final body = <String, dynamic>{};
      if (nombre != null) body['nombre'] = nombre;
      if (descripcion != null) body['descripcion'] = descripcion;
      if (precio != null) body['precio'] = precio;
      if (stock != null) body['stock'] = stock;
      if (categoriaId != null) body['categoria'] = categoriaId;
      if (imagen != null) body['imagen'] = imagen;
      if (activo != null) body['activo'] = activo;
      if (destacado != null) body['destacado'] = destacado;

      final response = await HttpHelper.patch<Map<String, dynamic>>(
        '/api/productos/$id/',
        body,
        parser: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        try {
          final producto = Producto.fromJson(response.data!);
          print('✅ Producto actualizado: ${producto.nombre}');
          return ApiResponse(
            success: true,
            data: producto,
            message: 'Producto actualizado exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando producto actualizado: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando producto: $e',
          );
        }
      } else {
        print('❌ Error actualizando producto: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error al actualizar producto',
        );
      }
    } catch (e) {
      print('❌ Excepción actualizando producto: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Eliminar un producto
  Future<ApiResponse<void>> eliminarProducto(int id) async {
    try {
      final response = await HttpHelper.delete('/api/productos/$id/');

      if (response.success) {
        print('✅ Producto eliminado: ID $id');
        return ApiResponse(
          success: true,
          message: 'Producto eliminado exitosamente',
        );
      } else {
        print('❌ Error eliminando producto: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error al eliminar producto',
        );
      }
    } catch (e) {
      print('❌ Excepción eliminando producto: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }

  /// Obtener categorías disponibles
  Future<ApiResponse<List<Categoria>>> getCategorias() async {
    try {
      final response = await HttpHelper.get<List<dynamic>>('/api/categorias/');

      if (response.success && response.data != null) {
        try {
          final categorias = response.data!
              .map((json) {
                try {
                  return Categoria.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando categoría: $e');
                  print('❌ JSON de la categoría: $json');
                  return null;
                }
              })
              .whereType<Categoria>()
              .toList();

          print('✅ Categorías cargadas: ${categorias.length}');
          if (categorias.isEmpty && response.data!.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${response.data!.length} categorías del API pero ninguna pudo parsearse');
          }
          return ApiResponse(
            success: true,
            data: categorias,
            message: 'Categorías obtenidas correctamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de categorías: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando categorías: $e',
          );
        }
      } else {
        print('❌ Error cargando categorías: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando categorías: $e');
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
    try {
      // El backend devuelve 'descripcion_corta' en el ProductoListSerializer
      // También devuelve 'creado' en lugar de 'created_at'
      final descripcion = json['descripcion_corta'] ?? 
                          json['descripcion'] ?? 
                          '';
      
      // Manejar fecha: puede venir como 'creado' o 'created_at'
      DateTime createdAt;
      if (json['creado'] != null) {
        try {
          createdAt = DateTime.parse(json['creado']);
        } catch (e) {
          print('⚠️ Error parseando fecha "creado": $e');
          createdAt = DateTime.now();
        }
      } else if (json['created_at'] != null) {
        try {
          createdAt = DateTime.parse(json['created_at']);
        } catch (e) {
          print('⚠️ Error parseando fecha "created_at": $e');
          createdAt = DateTime.now();
        }
      } else {
        createdAt = DateTime.now();
      }
      
      // Manejar imagen: puede venir como 'imagen' o 'imagen_principal'
      final imagen = json['imagen_principal'] ?? 
                     json['imagen'] ?? 
                     null;
      
      // Manejar categoria: puede ser un objeto o un ID
      String categoriaNombre = '';
      int categoriaIdValue = 0;
      
      if (json['categoria'] != null) {
        if (json['categoria'] is Map) {
          // Si categoria es un objeto
          final catObj = json['categoria'] as Map<String, dynamic>;
          categoriaNombre = catObj['nombre']?.toString() ?? '';
          categoriaIdValue = catObj['id'] is int 
              ? catObj['id'] as int 
              : (catObj['id'] is String ? int.tryParse(catObj['id']) ?? 0 : 0);
        } else if (json['categoria'] is String) {
          categoriaNombre = json['categoria'] as String;
          categoriaIdValue = json['categoria_id'] is int 
              ? json['categoria_id'] as int 
              : (json['categoria_id'] is String ? int.tryParse(json['categoria_id']) ?? 0 : 0);
        } else if (json['categoria'] is int) {
          categoriaIdValue = json['categoria'] as int;
          categoriaNombre = json['categoria_nombre']?.toString() ?? '';
        }
      } else {
        // Si no hay categoria en el objeto principal, buscar en otros lugares
        categoriaNombre = json['categoria_nombre']?.toString() ?? '';
        categoriaIdValue = json['categoria_id'] is int 
            ? json['categoria_id'] as int 
            : (json['categoria_id'] is String ? int.tryParse(json['categoria_id']) ?? 0 : 0);
      }
      
      // Validar campos requeridos
      if (json['id'] == null) {
        throw Exception('Campo "id" es requerido pero no está presente');
      }
      if (json['nombre'] == null || json['nombre'].toString().isEmpty) {
        throw Exception('Campo "nombre" es requerido pero no está presente o está vacío');
      }
      
      return Producto(
        id: json['id'] is int ? json['id'] as int : int.tryParse(json['id'].toString()) ?? 0,
        nombre: json['nombre']?.toString() ?? '',
        descripcion: descripcion,
        precio: json['precio'] != null 
            ? (json['precio'] is double 
                ? json['precio'] as double 
                : (json['precio'] is int 
                    ? (json['precio'] as int).toDouble() 
                    : double.tryParse(json['precio'].toString()) ?? 0.0))
            : 0.0,
        imagen: imagen?.toString(),
        stock: json['stock'] is int 
            ? json['stock'] as int 
            : (json['stock'] is String ? int.tryParse(json['stock']) ?? 0 : 0),
        categoria: categoriaNombre,
        categoriaId: categoriaIdValue,
        activo: json['activo'] is bool 
            ? json['activo'] as bool 
            : (json['activo']?.toString().toLowerCase() == 'true' ? true : (json['activo'] != null && json['activo'] != false)),
        destacado: json['destacado'] is bool 
            ? json['destacado'] as bool 
            : (json['destacado']?.toString().toLowerCase() == 'true' ? true : false),
        disponible: (json['stock'] is int 
            ? json['stock'] as int 
            : (json['stock'] is String ? int.tryParse(json['stock']) ?? 0 : 0)) > 0,
        createdAt: createdAt,
      );
    } catch (e, stackTrace) {
      print('❌ Error en Producto.fromJson: $e');
      print('❌ Stack trace: $stackTrace');
      print('❌ JSON recibido: $json');
      rethrow;
    }
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
  final String? message;
  final T? data;

  ApiResponse({required this.success, this.message, this.data});
}
