import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'productos_service.dart';

/// Servicio para gestionar la comparación de productos
/// Permite agregar hasta 3 productos para comparar
class ComparacionService {
  static const String _key = 'productos_comparacion';
  static const int _maxProductos = 3;

  /// Obtiene los IDs de productos en comparación
  Future<List<int>> getProductosComparacion() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_key);
      if (jsonString == null) return [];
      final List<dynamic> ids = json.decode(jsonString);
      return ids.cast<int>();
    } catch (e) {
      print('Error obteniendo productos en comparación: $e');
      return [];
    }
  }

  /// Agrega un producto a la comparación
  /// Retorna true si se agregó, false si ya está lleno o ya existe
  Future<bool> agregarProducto(int productoId) async {
    try {
      final productos = await getProductosComparacion();

      // Verificar si ya existe
      if (productos.contains(productoId)) {
        return false;
      }

      // Verificar límite
      if (productos.length >= _maxProductos) {
        return false;
      }

      productos.add(productoId);
      await _guardarProductos(productos);
      return true;
    } catch (e) {
      print('Error agregando producto a comparación: $e');
      return false;
    }
  }

  /// Elimina un producto de la comparación
  Future<bool> eliminarProducto(int productoId) async {
    try {
      final productos = await getProductosComparacion();
      productos.remove(productoId);
      await _guardarProductos(productos);
      return true;
    } catch (e) {
      print('Error eliminando producto de comparación: $e');
      return false;
    }
  }

  /// Verifica si un producto está en comparación
  Future<bool> estaEnComparacion(int productoId) async {
    final productos = await getProductosComparacion();
    return productos.contains(productoId);
  }

  /// Limpia todos los productos de comparación
  Future<void> limpiarComparacion() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (e) {
      print('Error limpiando comparación: $e');
    }
  }

  /// Obtiene la cantidad de productos en comparación
  Future<int> getCantidad() async {
    final productos = await getProductosComparacion();
    return productos.length;
  }

  /// Verifica si se puede agregar más productos
  Future<bool> puedeAgregar() async {
    final cantidad = await getCantidad();
    return cantidad < _maxProductos;
  }

  /// Obtiene los productos completos para comparar
  Future<List<Producto>> getProductosCompletos(
    ProductosService productosService,
  ) async {
    try {
      final ids = await getProductosComparacion();
      if (ids.isEmpty) return [];

      final productos = <Producto>[];
      for (final id in ids) {
        try {
          final producto = await productosService.getProducto(id);
          productos.add(producto);
        } catch (e) {
          print('Error obteniendo producto $id: $e');
        }
      }
      return productos;
    } catch (e) {
      print('Error obteniendo productos completos: $e');
      return [];
    }
  }

  /// Guarda los productos en SharedPreferences
  Future<void> _guardarProductos(List<int> productos) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, json.encode(productos));
  }

  /// Stream para escuchar cambios en la comparación
  Stream<List<int>> get comparacionStream async* {
    while (true) {
      yield await getProductosComparacion();
      await Future.delayed(const Duration(milliseconds: 500));
    }
  }
}
