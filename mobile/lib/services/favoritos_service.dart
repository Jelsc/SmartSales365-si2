import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Servicio para gestionar favoritos localmente usando SharedPreferences
class FavoritosService {
  static const String _key = 'smartsales_favoritos';

  // Obtener lista de IDs de productos favoritos
  Future<List<int>> getFavoritos() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? stored = prefs.getString(_key);

      if (stored == null) return [];

      final List<dynamic> decoded = json.decode(stored);
      return decoded.map((id) => id as int).toList();
    } catch (e) {
      print('Error al leer favoritos: $e');
      return [];
    }
  }

  // Guardar lista de favoritos
  Future<void> _saveFavoritos(List<int> productIds) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, json.encode(productIds));
    } catch (e) {
      print('Error al guardar favoritos: $e');
    }
  }

  // Verificar si un producto está en favoritos
  Future<bool> isFavorito(int productId) async {
    final favoritos = await getFavoritos();
    return favoritos.contains(productId);
  }

  // Agregar producto a favoritos
  Future<void> agregarFavorito(int productId) async {
    final favoritos = await getFavoritos();

    if (!favoritos.contains(productId)) {
      favoritos.add(productId);
      await _saveFavoritos(favoritos);
    }
  }

  // Eliminar producto de favoritos
  Future<void> eliminarFavorito(int productId) async {
    final favoritos = await getFavoritos();
    final filtered = favoritos.where((id) => id != productId).toList();

    if (filtered.length != favoritos.length) {
      await _saveFavoritos(filtered);
    }
  }

  // Alternar estado de favorito
  // Retorna true si se agregó, false si se eliminó
  Future<bool> toggleFavorito(int productId) async {
    if (await isFavorito(productId)) {
      await eliminarFavorito(productId);
      return false;
    } else {
      await agregarFavorito(productId);
      return true;
    }
  }

  // Limpiar todos los favoritos
  Future<void> limpiarFavoritos() async {
    await _saveFavoritos([]);
  }

  // Obtener cantidad de favoritos
  Future<int> contarFavoritos() async {
    final favoritos = await getFavoritos();
    return favoritos.length;
  }
}
