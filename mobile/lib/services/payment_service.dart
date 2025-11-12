import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../utils/ip_detection.dart';
import 'auth_service.dart';

/// Configuración de Stripe
class StripeConfig {
  static const String publishableKey =
      'pk_test_51SSQmsGpuPRRIbhhquQKbu1zpoB4ynBMtsOVcs1KLzQdipziFJBFMh0bMdoAMscIrZoEOsrGrF5U85OQ1KvZ4LoA00XERcs2cP';
}

/// Modelo de Producto
class Product {
  final int id;
  final String nombre;
  final String descripcion;
  final double precio;
  final String? imagen;
  final int stock;
  final String categoria;

  Product({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.precio,
    this.imagen,
    required this.stock,
    required this.categoria,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      precio: (json['precio'] ?? 0).toDouble(),
      imagen: json['imagen'],
      stock: json['stock'] ?? 0,
      categoria: json['categoria'] ?? '',
    );
  }
}

/// Item del carrito
class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get total => product.precio * quantity;

  Map<String, dynamic> toJson() {
    return {
      'product_id': product.id,
      'product_name': product.nombre,
      'quantity': quantity,
      'price': product.precio,
      'total': total,
    };
  }
}

/// Modelo de respuesta de pago
class PaymentResponse {
  final bool success;
  final String? sessionId;
  final String? checkoutUrl;
  final String? error;
  final String? message;

  PaymentResponse({
    required this.success,
    this.sessionId,
    this.checkoutUrl,
    this.error,
    this.message,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      success: json['success'] ?? false,
      sessionId: json['session_id'],
      checkoutUrl: json['checkout_url'],
      error: json['error'],
      message: json['message'],
    );
  }
}

/// Servicio de Pagos con Stripe
class PaymentService {
  final AuthService _authService = AuthService();
  static final PaymentService _instance = PaymentService._internal();

  factory PaymentService() => _instance;

  PaymentService._internal();

  /// Inicializar Stripe
  Future<void> initializeStripe() async {
    try {
      Stripe.publishableKey = StripeConfig.publishableKey;
      await Stripe.instance.applySettings();
      print('✅ Stripe inicializado correctamente');
    } catch (e) {
      print('❌ Error al inicializar Stripe: $e');
    }
  }

  /// Crear sesión de pago con Stripe Checkout
  Future<PaymentResponse> createCheckoutSession({
    required List<CartItem> items,
    String? descripcion,
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/payments/create-checkout-session/');

      final token = await _authService.getToken();
      if (token == null) {
        return PaymentResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      // Preparar items para el backend
      final itemsJson = items
          .map(
            (item) => {
              'product_id': item.product.id,
              'product_name': item.product.nombre,
              'quantity': item.quantity,
              'price': item.product.precio,
            },
          )
          .toList();

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'items': itemsJson,
          'descripcion': descripcion ?? 'Compra en SmartSales365',
          'success_url': 'smartsales365://payment-success',
          'cancel_url': 'smartsales365://payment-cancel',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return PaymentResponse.fromJson(data);
      } else {
        final error = jsonDecode(response.body);
        return PaymentResponse(
          success: false,
          error: error['error'] ?? 'Error al crear sesión de pago',
        );
      }
    } catch (e) {
      print('❌ Error en createCheckoutSession: $e');
      return PaymentResponse(success: false, error: 'Error de conexión: $e');
    }
  }

  /// Procesar pago con Payment Intent (flujo nativo)
  Future<bool> processPayment({
    required List<CartItem> items,
    required BuildContext context,
    String? descripcion,
  }) async {
    try {
      // 1. Crear Payment Intent en el backend
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/payments/create-payment-intent/');

      final token = await _authService.getToken();
      if (token == null) {
        _showToast('Error: No autenticado');
        return false;
      }

      final total = items.fold(0.0, (sum, item) => sum + item.total);

      final itemsJson = items.map((item) => item.toJson()).toList();

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'amount': total,
          'items': itemsJson,
          'descripcion': descripcion ?? 'Compra en SmartSales365',
        }),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        final error = jsonDecode(response.body);
        _showToast('Error: ${error['error'] ?? 'Error al procesar pago'}');
        return false;
      }

      final data = jsonDecode(response.body);
      final clientSecret = data['client_secret'];

      if (clientSecret == null) {
        _showToast('Error: No se pudo obtener client secret');
        return false;
      }

      // 2. Inicializar Payment Sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'SmartSales365',
          style: ThemeMode.light,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(primary: Colors.blue),
          ),
        ),
      );

      // 3. Presentar Payment Sheet
      await Stripe.instance.presentPaymentSheet();

      // 4. Pago exitoso
      _showToast('✅ Pago procesado exitosamente');
      return true;
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        _showToast('Pago cancelado');
      } else {
        _showToast('Error: ${e.error.message ?? "Error desconocido"}');
      }
      return false;
    } catch (e) {
      print('❌ Error en processPayment: $e');
      _showToast('Error al procesar pago: $e');
      return false;
    }
  }

  /// Obtener historial de pagos del usuario
  Future<List<PaymentHistory>> getPaymentHistory() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/payments/my-payments/');

      final token = await _authService.getToken();
      if (token == null) {
        return [];
      }

      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => PaymentHistory.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      print('❌ Error al obtener historial: $e');
      return [];
    }
  }

  void _showToast(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.black87,
      textColor: Colors.white,
    );
  }
}

/// Modelo de historial de pagos
class PaymentHistory {
  final int id;
  final String metodoPago;
  final double monto;
  final String moneda;
  final String estado;
  final String? descripcion;
  final DateTime fechaCreacion;
  final String? stripePaymentIntentId;

  PaymentHistory({
    required this.id,
    required this.metodoPago,
    required this.monto,
    required this.moneda,
    required this.estado,
    this.descripcion,
    required this.fechaCreacion,
    this.stripePaymentIntentId,
  });

  factory PaymentHistory.fromJson(Map<String, dynamic> json) {
    return PaymentHistory(
      id: json['id'],
      metodoPago: json['metodo_pago'] ?? 'Desconocido',
      monto: (json['monto'] ?? 0).toDouble(),
      moneda: json['moneda'] ?? 'BOB',
      estado: json['estado'] ?? 'pendiente',
      descripcion: json['descripcion'],
      fechaCreacion: DateTime.parse(json['fecha_creacion']),
      stripePaymentIntentId: json['stripe_payment_intent_id'],
    );
  }

  String get estadoDisplay {
    switch (estado.toLowerCase()) {
      case 'completado':
        return '✅ Completado';
      case 'pendiente':
        return '⏳ Pendiente';
      case 'fallido':
        return '❌ Fallido';
      case 'cancelado':
        return '🚫 Cancelado';
      default:
        return estado;
    }
  }

  Color get estadoColor {
    switch (estado.toLowerCase()) {
      case 'completado':
        return Colors.green;
      case 'pendiente':
        return Colors.orange;
      case 'fallido':
        return Colors.red;
      case 'cancelado':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}
