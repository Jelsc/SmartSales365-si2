import '../utils/http_helper.dart';

class Conductor {
  final int id;
  final String nombre;
  final String apellido;
  final String nombreCompleto;
  final String ci;
  final String? telefono;
  final String? email;
  final String nroLicencia;
  final String tipoLicencia;
  final DateTime? fechaVencLicencia;
  final String estado;
  final bool licenciaVencida;
  final bool puedConducir;
  final DateTime fechaCreacion;

  Conductor({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.nombreCompleto,
    required this.ci,
    this.telefono,
    this.email,
    required this.nroLicencia,
    required this.tipoLicencia,
    this.fechaVencLicencia,
    required this.estado,
    required this.licenciaVencida,
    required this.puedConducir,
    required this.fechaCreacion,
  });

  factory Conductor.fromJson(Map<String, dynamic> json) {
    return Conductor(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      nombreCompleto:
          json['nombre_completo'] ?? '${json['nombre']} ${json['apellido']}',
      ci: json['ci'] ?? '',
      telefono: json['telefono'],
      email: json['email'],
      nroLicencia: json['nro_licencia'] ?? '',
      tipoLicencia: json['tipo_licencia'] ?? '',
      fechaVencLicencia: json['fecha_venc_licencia'] != null
          ? DateTime.parse(json['fecha_venc_licencia'])
          : null,
      estado: json['estado'] ?? 'activo',
      licenciaVencida: json['licencia_vencida'] ?? false,
      puedConducir: json['puede_conducir'] ?? true,
      fechaCreacion: json['fecha_creacion'] != null
          ? DateTime.parse(json['fecha_creacion'])
          : DateTime.now(),
    );
  }
}

class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;

  ApiResponse({required this.success, this.message, this.data});
}

class ConductoresService {
  Future<ApiResponse<List<Conductor>>> getConductores({
    String? estado,
    String? tipoLicencia,
    String? busqueda,
  }) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: conductoresApi.list()
      // Frontend usa: /api/conductores/ con query params
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (tipoLicencia != null) queryParams['tipo_licencia'] = tipoLicencia;
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final queryString = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = queryString.isNotEmpty 
          ? '/api/conductores/?$queryString' 
          : '/api/conductores/';

      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      // Frontend espera formato paginado: { count, next, previous, results }
      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);

      if (response.success && response.data != null) {
        try {
          final data = response.data!;
          
          // Manejar formato paginado (igual que frontend)
          List<dynamic> results;
          if (data.containsKey('results')) {
            // Formato paginado estándar
            results = data['results'] as List<dynamic>;
            print('✅ Respuesta paginada: ${results.length} conductores (total: ${data['count'] ?? 'N/A'})');
          } else {
            results = [];
            print('⚠️ Formato de respuesta desconocido (no tiene results)');
          }

          final conductores = results
              .map((json) {
                try {
                  return Conductor.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando conductor: $e');
                  print('❌ JSON del conductor: $json');
                  return null;
                }
              })
              .whereType<Conductor>()
              .toList();
          
          print('✅ Conductores cargados: ${conductores.length}');
          if (conductores.isEmpty && results.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${results.length} conductores del API pero ninguno pudo parsearse');
          }
          return ApiResponse(
            success: true,
            data: conductores,
            message: 'Conductores obtenidos exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de conductores: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando conductores: $e',
          );
        }
      } else {
        print('❌ Error cargando conductores: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando conductores: $e');
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  Future<ApiResponse<Conductor>> getConductor(int id) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: conductoresApi.get(id)
      // Frontend usa: /api/conductores/${id}/
      final endpoint = '/api/conductores/$id/';
      
      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);

      if (response.success && response.data != null) {
        try {
          final conductor = Conductor.fromJson(response.data!);
          print('✅ Conductor cargado: ${conductor.nombre} ${conductor.apellido}');
          return ApiResponse(
            success: true,
            data: conductor,
            message: 'Conductor obtenido exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando conductor: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando conductor: $e',
          );
        }
      } else {
        print('❌ Error cargando conductor: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando conductor: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}
