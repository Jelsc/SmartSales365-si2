import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ReportesService {
  /// Genera un reporte dinámico mediante comando de voz o texto
  ///
  /// Returns:
  /// - Map con 'tipo': 'archivo' o 'json'
  /// - Si es archivo: 'path': ruta local del archivo descargado
  /// - Si es json: 'datos': List con los datos del reporte
  Future<Map<String, dynamic>> generarReporte({
    required String prompt,
    String modo = 'voz',
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) {
        throw Exception('No hay token de autenticación');
      }

      final baseUrl = ApiConfig.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/reportes/generar/');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'prompt': prompt, 'modo': modo}),
      );

      if (response.statusCode == 201) {
        // Respuesta JSON (formato json)
        final data = jsonDecode(response.body);
        return {
          'tipo': 'json',
          'datos': data['datos'],
          'parametros': data['parametros'],
          'reporte_id': data['reporte_id'],
        };
      } else if (response.statusCode == 200) {
        // Respuesta archivo (PDF o Excel)
        final contentType = response.headers['content-type'] ?? '';
        final contentDisposition =
            response.headers['content-disposition'] ?? '';

        // Extraer nombre de archivo
        String fileName = 'reporte';
        if (contentDisposition.contains('filename=')) {
          final regex = RegExp(r'filename="?([^"]+)"?');
          final match = regex.firstMatch(contentDisposition);
          if (match != null) {
            fileName = match.group(1)!;
          }
        } else {
          // Determinar extensión por content-type
          if (contentType.contains('pdf')) {
            fileName = 'reporte_${DateTime.now().millisecondsSinceEpoch}.pdf';
          } else if (contentType.contains('spreadsheet') ||
              contentType.contains('excel')) {
            fileName = 'reporte_${DateTime.now().millisecondsSinceEpoch}.xlsx';
          }
        }

        // Guardar archivo localmente
        final directory = await getApplicationDocumentsDirectory();
        final filePath = '${directory.path}/$fileName';
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);

        return {
          'tipo': 'archivo',
          'path': filePath,
          'fileName': fileName,
          'contentType': contentType,
        };
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Error al generar reporte');
      }
    } catch (e) {
      print('Error en generarReporte: $e');
      rethrow;
    }
  }

  /// Obtiene el historial de reportes generados por el usuario
  Future<List<Map<String, dynamic>>> obtenerHistorial() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) {
        throw Exception('No hay token de autenticación');
      }

      final baseUrl = ApiConfig.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/reportes/historial/');

      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['reportes']);
      } else {
        throw Exception('Error al obtener historial');
      }
    } catch (e) {
      print('Error en obtenerHistorial: $e');
      rethrow;
    }
  }
}
