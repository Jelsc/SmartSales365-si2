import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// Servicio centralizado para gestión de notificaciones push
/// Maneja FCM (Firebase Cloud Messaging) y notificaciones locales
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Stream para notificaciones en tiempo real
  final _notificationController = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get notificationStream =>
      _notificationController.stream;

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Inicializa el servicio de notificaciones
  Future<void> initialize() async {
    print('🔔 Inicializando NotificationService...');

    try {
      // 1. Solicitar permisos
      await _requestPermissions();

      // 2. Configurar notificaciones locales
      await _initializeLocalNotifications();

      // 3. Obtener y guardar token FCM
      await _getFCMToken();

      // 4. Configurar handlers de mensajes
      _setupMessageHandlers();

      print('✅ NotificationService inicializado correctamente');
    } catch (e) {
      print('❌ Error inicializando NotificationService: $e');
    }
  }

  /// Solicita permisos de notificaciones al usuario
  Future<void> _requestPermissions() async {
    print('📋 Solicitando permisos de notificaciones...');

    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print('✅ Permisos otorgados: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Usuario autorizó notificaciones');
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print('⚠️ Usuario autorizó notificaciones provisionales');
    } else {
      print('❌ Usuario denegó notificaciones');
    }
  }

  /// Inicializa el plugin de notificaciones locales
  Future<void> _initializeLocalNotifications() async {
    print('📱 Configurando notificaciones locales...');

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    print('✅ Notificaciones locales configuradas');
  }

  /// Obtiene el token FCM y lo guarda localmente
  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      print('🔑 FCM Token obtenido: $_fcmToken');

      if (_fcmToken != null) {
        await _saveTokenLocally(_fcmToken!);
      }

      // Escuchar cambios en el token
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 FCM Token renovado: $newToken');
        _fcmToken = newToken;
        _saveTokenLocally(newToken);
      });
    } catch (e) {
      print('❌ Error obteniendo FCM token: $e');
    }
  }

  /// Guarda el token FCM en SharedPreferences
  Future<void> _saveTokenLocally(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
      print('💾 Token FCM guardado localmente');
    } catch (e) {
      print('❌ Error guardando token: $e');
    }
  }

  /// Configura los handlers para diferentes estados de mensajes
  void _setupMessageHandlers() {
    print('⚙️ Configurando handlers de mensajes...');

    // Mensaje recibido cuando app está en foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Mensaje recibido cuando app está en background y se toca la notificación
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Mensaje recibido cuando app está terminada y se abre desde notificación
    _checkInitialMessage();

    print('✅ Handlers configurados');
  }

  /// Maneja mensajes cuando la app está en primer plano
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('📨 Mensaje recibido en foreground:');
    print('   Título: ${message.notification?.title}');
    print('   Cuerpo: ${message.notification?.body}');
    print('   Data: ${message.data}');

    // Mostrar notificación local
    await _showLocalNotification(message);

    // Emitir al stream para que la UI pueda reaccionar
    _notificationController.add(message);

    // Mostrar toast
    Fluttertoast.showToast(
      msg: message.notification?.title ?? 'Nueva notificación',
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.TOP,
      backgroundColor: Colors.blue,
      textColor: Colors.white,
    );
  }

  /// Maneja mensajes cuando la app se abre desde una notificación en background
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('📲 App abierta desde notificación:');
    print('   Título: ${message.notification?.title}');
    print('   Data: ${message.data}');

    // Emitir al stream
    _notificationController.add(message);

    // Aquí puedes navegar a una pantalla específica según message.data
    _handleNotificationNavigation(message);
  }

  /// Verifica si hay un mensaje inicial cuando la app se abre desde cerrada
  Future<void> _checkInitialMessage() async {
    final message = await _firebaseMessaging.getInitialMessage();
    if (message != null) {
      print('🚀 App abierta desde notificación (app cerrada):');
      print('   Título: ${message.notification?.title}');
      _notificationController.add(message);
      _handleNotificationNavigation(message);
    }
  }

  /// Muestra una notificación local (método público para uso externo)
  Future<void> showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'smartsales365_channel',
      'SmartSales365 Notifications',
      channelDescription: 'Notificaciones de SmartSales365',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: data?.toString(),
    );
  }

  /// Muestra una notificación local desde un RemoteMessage
  Future<void> _showLocalNotification(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'smartsales365_channel',
      'SmartSales365 Notifications',
      channelDescription: 'Notificaciones de SmartSales365',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'SmartSales365',
      message.notification?.body ?? '',
      details,
      payload: message.data.toString(),
    );
  }

  /// Maneja cuando se toca una notificación local
  void _onNotificationTapped(NotificationResponse response) {
    print('👆 Notificación tocada: ${response.payload}');
    // Aquí puedes implementar navegación basada en el payload
  }

  /// Maneja la navegación según el tipo de notificación
  void _handleNotificationNavigation(RemoteMessage message) {
    final tipo = message.data['tipo'];
    print('🧭 Navegando según tipo: $tipo');

    // TODO: Implementar navegación según el tipo de notificación
    // Ejemplos:
    // - 'nuevo_pedido' -> Navegar a pantalla de pedidos
    // - 'promocion' -> Navegar a pantalla de promociones
    // - 'mensaje' -> Navegar a chat
  }

  /// Envía el token FCM al backend
  Future<bool> sendTokenToBackend(String apiUrl, String authToken) async {
    if (_fcmToken == null) {
      print('❌ No hay token FCM disponible');
      return false;
    }

    try {
      print('📤 Enviando token FCM al backend...');

      final response = await http.post(
        Uri.parse('$apiUrl/api/notifications/tokens/register/'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': _fcmToken,
          'device_type': 'android', // TODO: Detectar iOS/Android dinámicamente
          'device_name': 'Mobile Device', // TODO: Obtener nombre real del dispositivo
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Token FCM registrado exitosamente en el backend');
        return true;
      } else {
        print('❌ Error registrando token: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error enviando token al backend: $e');
      return false;
    }
  }

  /// Cancela la suscripción a un topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      print('✅ Suscrito al topic: $topic');
    } catch (e) {
      print('❌ Error suscribiéndose al topic: $e');
    }
  }

  /// Se desuscribe de un topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      print('✅ Desuscrito del topic: $topic');
    } catch (e) {
      print('❌ Error desuscribiéndose del topic: $e');
    }
  }

  /// Limpia recursos
  void dispose() {
    _notificationController.close();
  }
}

/// Handler para mensajes en background (debe ser función top-level)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('🌙 Mensaje recibido en background:');
  print('   Título: ${message.notification?.title}');
  print('   Cuerpo: ${message.notification?.body}');
  print('   Data: ${message.data}');
}
