import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'auth_service.dart';
import '../config/stripe_config.dart';
import '../config/api_config.dart';

/// Servicio de Pagos con Stripe
class PaymentService {
  final AuthService _authService = AuthService();
  static final PaymentService _instance = PaymentService._internal();

  factory PaymentService() => _instance;

  PaymentService._internal();

  /// Obtener la URL base del backend
  String _getBaseUrl() {
    return ApiConfig.getBaseUrl();
  }

  /// Inicializar Stripe
  /// 
  /// Si la clave local no está configurada, Stripe se inicializará
  /// con la clave del backend cuando se cree el primer payment intent.
  Future<void> initializeStripe() async {
    try {
      // Intentar obtener la clave local, pero no fallar si no está configurada
      final publishableKey = StripeConfig.getPublishableKey();
      if (publishableKey.isNotEmpty) {
        Stripe.publishableKey = publishableKey;
        await Stripe.instance.applySettings();
        print('✅ Stripe inicializado correctamente con clave local');
      } else {
        print('⚠️ Stripe no se inicializó: la clave se obtendrá del backend al crear un pago');
      }
    } catch (e) {
      print('⚠️ Stripe no se inicializó: $e');
      print('⚠️ La clave se obtendrá del backend al crear un pago');
      // No relanzar la excepción, permitir que se inicialice después
    }
  }

  /// Inicializar o actualizar Stripe con una clave del backend
  Future<void> initializeStripeWithKey(String publishableKey) async {
    try {
      // Guardar la clave del backend en la configuración
      StripeConfig.setBackendKey(publishableKey);
      
      // Inicializar Stripe con la clave del backend
      Stripe.publishableKey = publishableKey;
      await Stripe.instance.applySettings();
      print('✅ Stripe inicializado/actualizado con clave del backend');
    } catch (e) {
      print('❌ Error al inicializar Stripe con clave del backend: $e');
      rethrow;
    }
  }

  /// Crear un Payment Intent para un pedido
  ///
  /// Args:
  ///   pedidoId: ID del pedido creado
  ///
  /// Returns:
  ///   Map con 'client_secret', 'payment_intent_id', etc.
  Future<Map<String, dynamic>> crearPaymentIntent(int pedidoId) async {
    try {
      final baseUrl = _getBaseUrl();
      final url = Uri.parse('$baseUrl/api/pagos/crear_payment_intent/');

      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No hay token de autenticación');
      }

      print('[PAYMENT] Creando payment intent para pedido $pedidoId');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'pedido_id': pedidoId}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        print(
          '[PAYMENT] ✅ Payment intent creado: ${data['payment_intent_id']}',
        );

        // Obtener y usar la clave del backend (tiene prioridad)
        final backendPublishableKey = data['publishable_key'];
        if (backendPublishableKey != null && backendPublishableKey.isNotEmpty) {
          // Inicializar o actualizar Stripe con la clave del backend
          try {
            await initializeStripeWithKey(backendPublishableKey);
          } catch (e) {
            print('[PAYMENT] ⚠️ No se pudo actualizar Stripe con la clave del backend: $e');
          }
        }

        return {
          'client_secret': data['client_secret'],
          'payment_intent_id': data['payment_intent_id'],
          'transaccion_id': data['transaccion_id'],
          'amount': data['amount'],
          'currency': data['currency'],
          'publishable_key': data['publishable_key'],
        };
      } else {
        final error = jsonDecode(utf8.decode(response.bodyBytes));
        print('[PAYMENT] ❌ Error al crear payment intent: ${error['error']}');
        throw Exception(error['error'] ?? 'Error al crear payment intent');
      }
    } catch (e) {
      print('❌ Error en crearPaymentIntent: $e');
      rethrow;
    }
  }

  /// Confirmar un pago exitoso en el backend
  ///
  /// Args:
  ///   paymentIntentId: ID del Payment Intent de Stripe
  ///
  /// Returns:
  ///   true si el pago fue confirmado exitosamente
  Future<bool> confirmarPago(String paymentIntentId) async {
    try {
      final baseUrl = _getBaseUrl();
      final url = Uri.parse('$baseUrl/api/pagos/confirmar_pago/');

      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No hay token de autenticación');
      }

      print('[PAYMENT] Confirmando pago: $paymentIntentId');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'payment_intent_id': paymentIntentId}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        print('[PAYMENT] ✅ Pago confirmado: ${data['message']}');
        return data['success'] == true && data['status'] == 'succeeded';
      } else {
        final error = jsonDecode(utf8.decode(response.bodyBytes));
        print('[PAYMENT] ❌ Error al confirmar pago: ${error['error']}');
        throw Exception(error['error'] ?? 'Error al confirmar pago');
      }
    } catch (e) {
      print('❌ Error en confirmarPago: $e');
      rethrow;
    }
  }

  /// Procesar pago completo con Stripe Payment Sheet
  ///
  /// Este método maneja todo el flujo:
  /// 1. Inicializa el Payment Sheet con el client secret
  /// 2. Presenta el formulario de pago
  /// 3. Confirma el pago con Stripe
  ///
  /// Args:
  ///   clientSecret: Client secret del Payment Intent
  ///   pedidoId: ID del pedido (para logging)
  ///
  /// Returns:
  ///   paymentIntentId si el pago fue exitoso, null si fue cancelado
  Future<String?> procesarPagoConPaymentSheet({
    required String clientSecret,
    required int pedidoId,
  }) async {
    try {
      print('[PAYMENT] Inicializando Payment Sheet para pedido $pedidoId');

      // 1. Inicializar Payment Sheet
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

      print('[PAYMENT] Presentando Payment Sheet');

      // 2. Presentar Payment Sheet
      await Stripe.instance.presentPaymentSheet();

      // 3. Si llegamos aquí, el pago fue exitoso
      // Extraer payment_intent_id del client_secret
      final parts = clientSecret.split('_secret_');
      final paymentIntentId = parts[0];

      print('[PAYMENT] ✅ Pago exitoso: $paymentIntentId');
      _showToast('✅ Pago procesado exitosamente');

      return paymentIntentId;
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        print('[PAYMENT] Pago cancelado por el usuario');
        _showToast('Pago cancelado');
        return null;
      } else {
        print('[PAYMENT] ❌ Error de Stripe: ${e.error.message}');
        _showToast('Error: ${e.error.message ?? "Error desconocido"}');
        throw Exception(e.error.message ?? 'Error al procesar pago');
      }
    } catch (e) {
      print('❌ Error en procesarPagoConPaymentSheet: $e');
      _showToast('Error al procesar pago');
      rethrow;
    }
  }

  /// Obtener historial de pagos del usuario
  Future<List<PaymentHistory>> getPaymentHistory() async {
    try {
      final baseUrl = _getBaseUrl();
      final url = Uri.parse('$baseUrl/api/pagos/');

      final token = await _authService.getToken();
      if (token == null) {
        return [];
      }

      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));

        // El endpoint de pagos puede retornar lista directa o paginada
        final List<dynamic> results;
        if (data is List) {
          results = data;
        } else if (data is Map && data['results'] != null) {
          results = data['results'];
        } else {
          results = [];
        }

        return results.map((json) => PaymentHistory.fromJson(json)).toList();
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
