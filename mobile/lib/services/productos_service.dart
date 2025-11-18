import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';
import '../config/api_config.dart';

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

  String _getBaseUrl() {
    return ApiConfig.getBaseUrl();
  }

  // Exponer método para compartir
  String getBaseUrl() => _getBaseUrl();

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
      final baseUrl = _getBaseUrl();
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
      final baseUrl = _getBaseUrl();
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
      final baseUrl = _getBaseUrl();
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

  // Buscar producto por código de barras
  Future<Producto?> buscarPorCodigoBarras(String codigo) async {
    try {
      final response = await getProductos(search: codigo);
      if (response.results.isNotEmpty) {
        // Buscar coincidencia exacta en SKU o código de barras
        final producto = response.results.firstWhere(
          (p) => p.sku?.toLowerCase() == codigo.toLowerCase(),
          orElse: () => response.results.first,
        );
        return producto;
      }
      return null;
    } catch (e) {
      print('Error en buscarPorCodigoBarras: $e');
      return null;
    }
  }

  // Historial de búsquedas
  static const String _historialKey = 'historial_busquedas';
  static const int _maxHistorial = 10;

  Future<void> guardarBusqueda(String query) async {
    if (query.trim().isEmpty) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final historial = await getBusquedasRecientes();
      
      // Eliminar si ya existe
      historial.remove(query.trim());
      
      // Agregar al inicio
      historial.insert(0, query.trim());
      
      // Limitar tamaño
      if (historial.length > _maxHistorial) {
        historial.removeRange(_maxHistorial, historial.length);
      }
      
      await prefs.setStringList(_historialKey, historial);
    } catch (e) {
      print('Error guardando búsqueda: $e');
    }
  }

  Future<List<String>> getBusquedasRecientes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_historialKey) ?? [];
    } catch (e) {
      print('Error obteniendo historial: $e');
      return [];
    }
  }

  Future<void> limpiarHistorial() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_historialKey);
    } catch (e) {
      print('Error limpiando historial: $e');
    }
  }

  // Filtros guardados
  static const String _filtrosKey = 'filtros_guardados';
  static const int _maxFiltros = 5;

  Future<void> guardarFiltro({
    String? categoriaId,
    double? precioMin,
    double? precioMax,
    bool? enOferta,
    bool? destacado,
    String? ordenamiento,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final filtrosGuardados = await getFiltrosGuardados();

      final nuevoFiltro = {
        'categoriaId': categoriaId,
        'precioMin': precioMin,
        'precioMax': precioMax,
        'enOferta': enOferta,
        'destacado': destacado,
        'ordenamiento': ordenamiento,
        'nombre': _generarNombreFiltro(
          categoriaId: categoriaId,
          precioMin: precioMin,
          precioMax: precioMax,
          enOferta: enOferta,
          destacado: destacado,
        ),
        'fecha': DateTime.now().toIso8601String(),
      };

      // Eliminar si ya existe un filtro idéntico
      filtrosGuardados.removeWhere((f) => _sonFiltrosIguales(f, nuevoFiltro));

      // Agregar al inicio
      filtrosGuardados.insert(0, nuevoFiltro);

      // Limitar tamaño
      if (filtrosGuardados.length > _maxFiltros) {
        filtrosGuardados.removeRange(_maxFiltros, filtrosGuardados.length);
      }

      final filtrosJson = jsonEncode(filtrosGuardados);
      await prefs.setString(_filtrosKey, filtrosJson);
    } catch (e) {
      print('Error guardando filtro: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getFiltrosGuardados() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final filtrosJson = prefs.getString(_filtrosKey);
      if (filtrosJson == null) return [];

      final List<dynamic> filtrosList = jsonDecode(filtrosJson);
      return filtrosList.cast<Map<String, dynamic>>();
    } catch (e) {
      print('Error obteniendo filtros guardados: $e');
      return [];
    }
  }

  Future<void> eliminarFiltro(int index) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final filtrosGuardados = await getFiltrosGuardados();
      if (index >= 0 && index < filtrosGuardados.length) {
        filtrosGuardados.removeAt(index);
        final filtrosJson = jsonEncode(filtrosGuardados);
        await prefs.setString(_filtrosKey, filtrosJson);
      }
    } catch (e) {
      print('Error eliminando filtro: $e');
    }
  }

  Future<void> limpiarFiltrosGuardados() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_filtrosKey);
    } catch (e) {
      print('Error limpiando filtros guardados: $e');
    }
  }

  String _generarNombreFiltro({
    String? categoriaId,
    double? precioMin,
    double? precioMax,
    bool? enOferta,
    bool? destacado,
  }) {
    final partes = <String>[];

    if (categoriaId != null) {
      final categoria = _categoriasCache.firstWhere(
        (c) => c.id.toString() == categoriaId,
        orElse: () => Categoria(
          id: int.parse(categoriaId),
          nombre: 'Categoría',
          slug: '',
          activa: true,
          orden: 0,
          productosCount: 0,
        ),
      );
      partes.add(categoria.nombre);
    }

    if (precioMin != null || precioMax != null) {
      if (precioMin != null && precioMax != null) {
        partes.add('Bs. ${precioMin.toStringAsFixed(0)}-${precioMax.toStringAsFixed(0)}');
      } else if (precioMin != null) {
        partes.add('Desde Bs. ${precioMin.toStringAsFixed(0)}');
      } else {
        partes.add('Hasta Bs. ${precioMax!.toStringAsFixed(0)}');
      }
    }

    if (enOferta == true) partes.add('Ofertas');
    if (destacado == true) partes.add('Destacados');

    return partes.isEmpty ? 'Filtro personalizado' : partes.join(' • ');
  }

  bool _sonFiltrosIguales(Map<String, dynamic> f1, Map<String, dynamic> f2) {
    return f1['categoriaId'] == f2['categoriaId'] &&
        f1['precioMin'] == f2['precioMin'] &&
        f1['precioMax'] == f2['precioMax'] &&
        f1['enOferta'] == f2['enOferta'] &&
        f1['destacado'] == f2['destacado'] &&
        f1['ordenamiento'] == f2['ordenamiento'];
  }

  // Cache temporal de categorías para generar nombres
  static List<Categoria> _categoriasCache = [];
  static void setCategoriasCache(List<Categoria> categorias) {
    _categoriasCache = categorias;
  }
}
