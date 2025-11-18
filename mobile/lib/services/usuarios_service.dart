import '../utils/http_helper.dart';

class Usuario {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String nombreCompleto;
  final String? telefono;
  final String? ci;
  final bool isActive;
  final bool isStaff;
  final bool puedeAccederAdmin;
  final bool esAdministrativo;
  final bool esCliente;
  final String? rolNombre;
  final String? rolDescripcion;
  final DateTime dateJoined;

  Usuario({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.nombreCompleto,
    this.telefono,
    this.ci,
    required this.isActive,
    required this.isStaff,
    required this.puedeAccederAdmin,
    required this.esAdministrativo,
    required this.esCliente,
    this.rolNombre,
    this.rolDescripcion,
    required this.dateJoined,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    final rol = json['rol'] as Map<String, dynamic>?;
    return Usuario(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      nombreCompleto: '${json['first_name']} ${json['last_name']}'.trim(),
      telefono: json['telefono'],
      ci: json['ci'],
      isActive: json['is_active'] ?? true,
      isStaff: json['is_staff'] ?? false,
      puedeAccederAdmin: json['puede_acceder_admin'] ?? false,
      esAdministrativo: json['es_administrativo'] ?? false,
      esCliente: json['es_cliente'] ?? false,
      rolNombre: rol?['nombre'],
      rolDescripcion: rol?['descripcion'],
      dateJoined: json['date_joined'] != null
          ? DateTime.parse(json['date_joined'])
          : DateTime.now(),
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

class UsuariosService {
  Future<ApiResponse<List<Usuario>>> getUsuarios({String? busqueda}) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: usuariosApi.list()
      // Frontend usa: /api/admin/users/ con query params
      final Map<String, String> queryParams = {};
      if (busqueda != null && busqueda.isNotEmpty) {
        queryParams['search'] = busqueda;
      }

      final queryString = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final endpoint = queryString.isNotEmpty 
          ? '/api/admin/users/?$queryString' 
          : '/api/admin/users/';

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
            print('✅ Respuesta paginada: ${results.length} usuarios (total: ${data['count'] ?? 'N/A'})');
          } else {
            results = [];
            print('⚠️ Formato de respuesta desconocido (no tiene results ni es lista)');
          }

          final usuarios = results
              .map((json) {
                try {
                  return Usuario.fromJson(json);
                } catch (e) {
                  print('❌ Error parseando usuario: $e');
                  print('❌ JSON del usuario: $json');
                  return null;
                }
              })
              .whereType<Usuario>()
              .toList();
          
          print('✅ Usuarios cargados exitosamente: ${usuarios.length}');
          if (usuarios.isEmpty && results.isNotEmpty) {
            print('⚠️ ATENCIÓN: Se recibieron ${results.length} usuarios del API pero ninguno pudo parsearse');
            print('⚠️ Primer usuario (raw): ${results[0]}');
          }
          return ApiResponse.success(usuarios);
        } catch (e, stackTrace) {
          print('❌ Error parseando lista de usuarios: $e');
          print('❌ Stack trace: $stackTrace');
          print('❌ Data recibida: ${response.data}');
          return ApiResponse.error('Error parseando usuarios: $e');
        }
      } else {
        print('❌ Error cargando usuarios: ${response.error}');
        print('❌ Response success: ${response.success}');
        print('❌ Response data: ${response.data}');
        return ApiResponse.error(response.error ?? 'Error desconocido');
      }
    } catch (e) {
      print('❌ Excepción cargando usuarios: $e');
      return ApiResponse.error('Error de conexión: $e');
    }
  }

  Future<ApiResponse<Usuario>> getUsuario(int id) async {
    try {
      // Replicar EXACTAMENTE la lógica del frontend: usuariosApi.get(id)
      // Frontend usa: /api/admin/users/${id}/
      final endpoint = '/api/admin/users/$id/';
      
      print('🔵 Llamando endpoint (igual que frontend): $endpoint');

      final response = await HttpHelper.get<Map<String, dynamic>>(endpoint);

      if (response.success && response.data != null) {
        try {
          final usuario = Usuario.fromJson(response.data!);
          print('✅ Usuario cargado: ${usuario.username}');
          return ApiResponse.success(usuario);
        } catch (e, stackTrace) {
          print('❌ Error parseando usuario: $e');
          print('❌ Stack trace: $stackTrace');
          return ApiResponse.error('Error parseando usuario: $e');
        }
      } else {
        print('❌ Error cargando usuario: ${response.error}');
        return ApiResponse.error(response.error ?? 'Error desconocido');
      }
    } catch (e) {
      print('❌ Excepción cargando usuario: $e');
      return ApiResponse.error('Error de conexión: $e');
    }
  }
}
