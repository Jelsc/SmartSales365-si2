import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'productos_service.dart';

/// Modelo simplificado de Producto para el carrito local
class Product {
  final int id;
  final String nombre;
  final String? descripcion;
  final double precio;
  final String? imagen;
  final int stock;
  final String? categoria;

  Product({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.precio,
    this.imagen,
    required this.stock,
    this.categoria,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      precio: (json['precio'] is double)
          ? json['precio']
          : double.parse(json['precio'].toString()),
      imagen: json['imagen'],
      stock: json['stock'] is int
          ? json['stock']
          : int.parse(json['stock'].toString()),
      categoria: json['categoria'],
    );
  }

  /// Convertir desde Producto (del servicio de productos)
  factory Product.fromProducto(Producto producto) {
    String? imagenUrl;
    if (producto.imagenes.isNotEmpty) {
      final imagenPrincipal = producto.imagenes.firstWhere(
        (img) => img.esPrincipal,
        orElse: () => producto.imagenes.first,
      );
      imagenUrl = imagenPrincipal.imagen;
    } else if (producto.imagen != null && producto.imagen!.isNotEmpty) {
      imagenUrl = producto.imagen;
    }

    return Product(
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precioFinal,
      imagen: imagenUrl,
      stock: producto.stock,
      categoria: producto.categoriaNombre,
    );
  }
}

/// Modelo de item del carrito
class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, required this.quantity});

  double get total => product.precio * quantity;
}

class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  static const String _cartKey = 'shopping_cart';

  List<CartItem> get items => _items;

  int get itemCount => _items.length;

  double get total => _items.fold(0.0, (sum, item) => sum + (item.total));

  int get totalQuantity => _items.fold(0, (sum, item) => sum + (item.quantity));

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

  /// Agregar Producto (del servicio) al carrito
  void addProducto(Producto producto, {int quantity = 1}) {
    final product = Product.fromProducto(producto);
    addProduct(product, quantity: quantity);
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
      // ignore: avoid_print
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
            quantity: item['quantity'] is int
                ? item['quantity']
                : int.parse(item['quantity'].toString()),
          );
        }).toList();

        notifyListeners();
      }
    } catch (e) {
      // ignore: avoid_print
      print('❌ Error al cargar carrito: $e');
    }
  }
}
