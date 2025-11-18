import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class RecordatoriosService {
  static final RecordatoriosService _instance = RecordatoriosService._internal();
  factory RecordatoriosService() => _instance;
  RecordatoriosService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  bool _inicializado = false;

  static const String _recordatoriosKey = 'recordatorios_pedidos';

  Future<void> inicializar() async {
    if (_inicializado) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _inicializado = true;
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Puede navegar a pedidos si es necesario
  }

  Future<void> programarRecordatorios(List<Map<String, dynamic>> pedidosPendientes) async {
    if (!_inicializado) await inicializar();

    // Cancelar recordatorios anteriores
    await cancelarTodosRecordatorios();

    // Programar nuevos recordatorios
    for (final pedido in pedidosPendientes) {
      final pedidoId = pedido['id'] as int;
      final numeroPedido = pedido['numero_pedido'] as String? ?? 'N/A';
      final estado = pedido['estado'] as String? ?? 'PENDIENTE';

      // Solo recordar pedidos pendientes o en proceso
      if (estado == 'PENDIENTE' || estado == 'CONFIRMADO' || estado == 'EN_PROCESO') {
        await _programarRecordatorioDiario(pedidoId, numeroPedido);
      }
    }

    // Guardar lista de recordatorios activos
    await _guardarRecordatoriosActivos(pedidosPendientes);
  }

  Future<void> _programarRecordatorioDiario(int pedidoId, String numeroPedido) async {
    const androidDetails = AndroidNotificationDetails(
      'recordatorios_pedidos',
      'Recordatorios de Pedidos',
      channelDescription: 'Notificaciones para recordar pedidos pendientes',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
    );

    const iosDetails = DarwinNotificationDetails();

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Programar recordatorio diario
    await _notifications.periodicallyShow(
      pedidoId,
      'Recordatorio de Pedido',
      'Tienes un pedido pendiente: #$numeroPedido',
      RepeatInterval.daily,
      notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
  }

  Future<void> cancelarRecordatorio(int pedidoId) async {
    await _notifications.cancel(pedidoId);
    await _actualizarRecordatoriosActivos(pedidoId);
  }

  Future<void> cancelarTodosRecordatorios() async {
    await _notifications.cancelAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recordatoriosKey);
  }

  Future<void> _guardarRecordatoriosActivos(List<Map<String, dynamic>> pedidos) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final pedidosJson = jsonEncode(pedidos);
      await prefs.setString(_recordatoriosKey, pedidosJson);
    } catch (e) {
      print('Error guardando recordatorios activos: $e');
    }
  }

  Future<void> _actualizarRecordatoriosActivos(int pedidoId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final pedidosJson = prefs.getString(_recordatoriosKey);
      if (pedidosJson == null) return;

      final List<dynamic> pedidosList = jsonDecode(pedidosJson);
      pedidosList.removeWhere((p) => p['id'] == pedidoId);

      if (pedidosList.isEmpty) {
        await prefs.remove(_recordatoriosKey);
      } else {
        await prefs.setString(_recordatoriosKey, jsonEncode(pedidosList));
      }
    } catch (e) {
      print('Error actualizando recordatorios activos: $e');
    }
  }

  Future<List<int>> getRecordatoriosActivos() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final pedidosJson = prefs.getString(_recordatoriosKey);
      if (pedidosJson == null) return [];

      final List<dynamic> pedidosList = jsonDecode(pedidosJson);
      return pedidosList.map((p) => p['id'] as int).toList();
    } catch (e) {
      print('Error obteniendo recordatorios activos: $e');
      return [];
    }
  }
}

