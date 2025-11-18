import '../utils/http_helper.dart';

class Rol {
  final int id;
  final String nombre;
  final String descripcion;
  final bool esAdministrativo;
  final List<String> permisos;
  final DateTime fechaCreacion;
  final DateTime? fechaActualizacion;

  Rol({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.esAdministrativo,
    required this.permisos,
    required this.fechaCreacion,
    this.fechaActualizacion,
  });

  factory Rol.fromJson(Map<String, dynamic> json) {
    return Rol(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      esAdministrativo: json['es_administrativo'] ?? false,
      permisos:
          (json['permisos'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      fechaCreacion: json['fecha_creacion'] != null
          ? DateTime.parse(json['fecha_creacion'])
          : DateTime.now(),
      fechaActualizacion: json['fecha_actualizacion'] != null
          ? DateTime.parse(json['fecha_actualizacion'])
          : null,
    );
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse.success(this.data) : success = true, error = null;

  ApiResponse.error(this.error) : success = false, data = null;
}

class RolesService {
  Future<ApiResponse<List<Rol>>> getRoles({String? busqueda}) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: roleService.getRoles()
      // Frontend usa: /api/roles/ con query params
      final Map<String, String> queryParams = {};
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final queryString = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = queryString.isNotEmpty 
          ? '/api/roles/?$queryString' 
          : '/api/roles/';

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
            print('✅ Respuesta paginada: ${results.length} roles (total: ${data['count'] ?? 'N/A'})');
          } else {
            results = [];
            print('⚠️ Formato de respuesta desconocido (no tiene results)');
          }

          final roles = results
              .map((json) {
                try {
                  return Rol.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando rol: $e');
                  print('❌ JSON del rol: $json');
                  return null;
                }
              })
              .whereType<Rol>()
              .toList();
          
          print('✅ Roles cargados: ${roles.length}');
          if (roles.isEmpty && results.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${results.length} roles del API pero ninguno pudo parsearse');
          }
          return ApiResponse.success(roles);
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de roles: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse.error('Error parseando roles: $e');
        }
      } else {
        print('❌ Error cargando roles: ${response.error}');
        return ApiResponse.error(response.error ?? 'Error desconocido');
      }
    } catch (e) {
      print('❌ Excepción cargando roles: $e');
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Rol>> getRol(int id) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: roleService.getRoleById(id)
      // Frontend usa: /api/roles/${id}/
      final endpoint = '/api/roles/$id/';
      
      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);

      if (response.success && response.data != null) {
        try {
          final rol = Rol.fromJson(response.data!);
          print('✅ Rol cargado: ${rol.nombre}');
          return ApiResponse.success(rol);
        } catch (e, stackTrace) {
          print('❌ Error parseando rol: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse.error('Error parseando rol: $e');
        }
      } else {
        print('❌ Error cargando rol: ${response.error}');
        return ApiResponse.error(response.error ?? 'Error desconocido');
      }
    } catch (e) {
      print('❌ Excepción cargando rol: $e');
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
