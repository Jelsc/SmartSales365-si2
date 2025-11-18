import '../utils/http_helper.dart';

class Personal {
  final int id;
  final String nombre;
  final String apellido;
  final String nombreCompleto;
  final String ci;
  final String? telefono;
  final String? email;
  final String codigoEmpleado;
  final String? cargo;
  final DateTime? fechaIngreso;
  final String estado;
  final DateTime fechaCreacion;

  Personal({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.nombreCompleto,
    required this.ci,
    this.telefono,
    this.email,
    required this.codigoEmpleado,
    this.cargo,
    this.fechaIngreso,
    required this.estado,
    required this.fechaCreacion,
  });

  factory Personal.fromJson(Map<String, dynamic> json) {
    return Personal(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      nombreCompleto:
          json['nombre_completo'] ?? '${json['nombre']} ${json['apellido']}',
      ci: json['ci'] ?? '',
      telefono: json['telefono'],
      email: json['email'],
      codigoEmpleado: json['codigo_empleado'] ?? '',
      cargo: json['cargo'],
      fechaIngreso: json['fecha_ingreso'] != null
          ? DateTime.parse(json['fecha_ingreso'])
          : null,
      estado: json['estado'] ?? 'activo',
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

class PersonalService {
  Future<ApiResponse<List<Personal>>> getPersonal({
    String? estado,
    String? busqueda,
  }) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: personalApi.list()
      // Frontend usa: /api/personal/ con query params
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final queryString = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = queryString.isNotEmpty 
          ? '/api/personal/?$queryString' 
          : '/api/personal/';

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
            print('✅ Respuesta paginada: ${results.length} personal (total: ${data['count'] ?? 'N/A'})');
          } else {
            results = [];
            print('⚠️ Formato de respuesta desconocido (no tiene results)');
          }

          final personal = results
              .map((json) {
                try {
                  return Personal.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando personal: $e');
                  print('❌ JSON del personal: $json');
                  return null;
                }
              })
              .whereType<Personal>()
              .toList();
          
          print('✅ Personal cargado: ${personal.length}');
          if (personal.isEmpty && results.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${results.length} personal del API pero ninguno pudo parsearse');
          }
          return ApiResponse(
            success: true,
            data: personal,
            message: 'Personal obtenido exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de personal: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando personal: $e',
          );
        }
      } else {
        print('❌ Error cargando personal: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando personal: $e');
      return ApiResponse(success: false, message: 'Error de conexión: $e');
    }
  }

  Future<ApiResponse<Personal>> getPersonalById(int id) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: personalApi.get(id)
      // Frontend usa: /api/personal/${id}/
      final endpoint = '/api/personal/$id/';
      
      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);

      if (response.success && response.data != null) {
        try {
          final personal = Personal.fromJson(response.data!);
          print('✅ Personal cargado: ${personal.nombre} ${personal.apellido}');
          return ApiResponse(
            success: true,
            data: personal,
            message: 'Personal obtenido exitosamente',
          );
        } catch (e, stackTrace) {
          print('❌ Error parseando personal: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse(
            success: false,
            message: 'Error parseando personal: $e',
          );
        }
      } else {
        print('❌ Error cargando personal: ${response.error}');
        return ApiResponse(
          success: false,
          message: response.error ?? 'Error desconocido',
        );
      }
    } catch (e) {
      print('❌ Excepción cargando personal: $e');
      return ApiResponse(success: false, message: 'Error: $e');
    }
  }
}
