import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../services/payment_service.dart';

class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  static const String _cartKey = 'shopping_cart';

  List<CartItem> get items => _items;

  int get itemCount => _items.length;

  double get total => _items.fold(0.0, (sum, item) => sum + item.total);

  int get totalQuantity => _items.fold(0, (sum, item) => sum + item.quantity);

  CartProvider() {
    _loadCart();
  }

  /// Agregar producto al carrito
  void addProduct(Product product, {int quantity = 1}) {
    final index = _items.indexWhere((item) => item.product.id == product.id);

    if (index >= 0) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }

    _saveCart();
    notifyListeners();
  }

  /// Remover producto del carrito
  void removeProduct(int productId) {
    _items.removeWhere((item) => item.product.id == productId);
    _saveCart();
    notifyListeners();
  }

  /// Actualizar cantidad
  void updateQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }

    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      _items[index].quantity = quantity;
      _saveCart();
      notifyListeners();
    }
  }

  /// Limpiar carrito
  void clear() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  /// Guardar carrito en SharedPreferences
  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = _items
          .map(
            (item) => {
              'product': {
                'id': item.product.id,
                'nombre': item.product.nombre,
                'descripcion': item.product.descripcion,
                'precio': item.product.precio,
                'imagen': item.product.imagen,
                'stock': item.product.stock,
                'categoria': item.product.categoria,
              },
              'quantity': item.quantity,
            },
          )
          .toList();

      await prefs.setString(_cartKey, jsonEncode(cartJson));
    } catch (e) {
      print('❌ Error al guardar carrito: $e');
    }
  }

  /// Cargar carrito desde SharedPreferences
  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartString = prefs.getString(_cartKey);

      if (cartString != null) {
        final List<dynamic> cartJson = jsonDecode(cartString);
        _items = cartJson.map((item) {
          return CartItem(
            product: Product.fromJson(item['product']),
            quantity: item['quantity'],
          );
        }).toList();

        notifyListeners();
      }
    } catch (e) {
      print('❌ Error al cargar carrito: $e');
    }
  }
}
