import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:flutter/material.dart';
import '../utils/ip_detection.dart';

// Configuración base de la API - Ahora con detección automática

// Tipos de datos para la API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse({required this.success, this.data, this.error, this.message});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      error: json['error'],
      message: json['message'],
    );
  }
}

// Modelo de Rol basado en el backend
class Rol {
  final int id;
  final String nombre;
  final String descripcion;
  final bool esAdministrativo;
  final List<String> permisos;
  final DateTime fechaCreacion;
  final DateTime fechaActualizacion;

  Rol({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.esAdministrativo,
    required this.permisos,
    required this.fechaCreacion,
    required this.fechaActualizacion,
  });

  factory Rol.fromJson(Map<String, dynamic> json) {
    return Rol(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      esAdministrativo: json['es_administrativo'] ?? false,
      permisos: List<String>.from(json['permisos'] ?? []),
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
      fechaActualizacion: DateTime.parse(json['fecha_actualizacion'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'es_administrativo': esAdministrativo,
      'permisos': permisos,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_actualizacion': fechaActualizacion.toIso8601String(),
    };
  }
}

// Modelo de Usuario actualizado basado en el backend
class User {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String? telefono;
  final String? direccion;
  final String? ci;
  final DateTime? fechaNacimiento;
  final bool isActive;
  final bool isStaff;
  final DateTime dateJoined;
  final DateTime? lastLogin;
  final Rol? rol;
  
  // Propiedades calculadas
  final bool esAdministrativo;
  final bool esCliente;
  final bool puedeAccederAdmin;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.telefono,
    this.direccion,
    this.ci,
    this.fechaNacimiento,
    required this.isActive,
    required this.isStaff,
    required this.dateJoined,
    this.lastLogin,
    this.rol,
    required this.esAdministrativo,
    required this.esCliente,
    required this.puedeAccederAdmin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      telefono: json['telefono'],
      direccion: json['direccion'],
      ci: json['ci'],
      fechaNacimiento: json['fecha_nacimiento'] != null 
          ? DateTime.parse(json['fecha_nacimiento']) 
          : null,
      isActive: json['is_active'] ?? false,
      isStaff: json['is_staff'] ?? false,
      dateJoined: DateTime.parse(json['date_joined'] ?? DateTime.now().toIso8601String()),
      lastLogin: json['last_login'] != null 
          ? DateTime.parse(json['last_login']) 
          : null,
      rol: json['rol'] != null ? Rol.fromJson(json['rol']) : null,
      esAdministrativo: json['es_administrativo'] ?? false,
      esCliente: json['es_cliente'] ?? false,
      puedeAccederAdmin: json['puede_acceder_admin'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'telefono': telefono,
      'direccion': direccion,
      'ci': ci,
      'fecha_nacimiento': fechaNacimiento?.toIso8601String(),
      'is_active': isActive,
      'is_staff': isStaff,
      'date_joined': dateJoined.toIso8601String(),
      'last_login': lastLogin?.toIso8601String(),
      'rol': rol?.toJson(),
      'es_administrativo': esAdministrativo,
      'es_cliente': esCliente,
      'puede_acceder_admin': puedeAccederAdmin,
    };
  }
}

// Credenciales de login unificado (acepta username o email)
class LoginCredentials {
  final String? username;
  final String? email;
  final String password;

  LoginCredentials({
    this.username,
    this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      if (username != null) 'username': username,
      if (email != null) 'email': email,
      'password': password,
    };
  }
}

// Datos de registro para clientes (basado en ClienteRegisterSerializer)
class ClienteRegisterData {
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String password;
  final String passwordConfirm;
  final String telefono;
  final String? direccion;
  final String ci;
  final DateTime? fechaNacimiento;

  ClienteRegisterData({
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.password,
    required this.passwordConfirm,
    required this.telefono,
    this.direccion,
    required this.ci,
    this.fechaNacimiento,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'password': password,
      'password_confirm': passwordConfirm,
      'telefono': telefono,
      if (direccion != null) 'direccion': direccion,
      'ci': ci,
      if (fechaNacimiento != null) 'fecha_nacimiento': fechaNacimiento!.toIso8601String().split('T')[0],
    };
  }
}

// Datos de registro para administradores (basado en AdminCreateSerializer)
class AdminCreateData {
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String password;
  final String passwordConfirm;
  final int rolId;
  final String? telefono;
  final String? direccion;

  AdminCreateData({
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.password,
    required this.passwordConfirm,
    required this.rolId,
    this.telefono,
    this.direccion,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'password': password,
      'password_confirm': passwordConfirm,
      'rol_id': rolId,
      if (telefono != null) 'telefono': telefono,
      if (direccion != null) 'direccion': direccion,
    };
  }
}

// Respuesta de login unificado
class LoginResponse {
  final String access;
  final String refresh;
  final User user;
  final String tipoLogin;
  final bool puedeAccederAdmin;

  LoginResponse({
    required this.access,
    required this.refresh,
    required this.user,
    required this.tipoLogin,
    required this.puedeAccederAdmin,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      access: json['access'] ?? '',
      refresh: json['refresh'] ?? '',
      user: User.fromJson(json['user'] ?? {}),
      tipoLogin: json['tipo_login'] ?? 'cliente',
      puedeAccederAdmin: json['puede_acceder_admin'] ?? false,
    );
  }
}

// Datos del dashboard
class DashboardData {
  final String tipoUsuario;
  final String rol;
  final List<String> permisos;
  final String? departamento;
  final String? codigoEmpleado;
  final List<Map<String, dynamic>> menuItems;
  final Map<String, dynamic> estadisticas;

  DashboardData({
    required this.tipoUsuario,
    required this.rol,
    required this.permisos,
    this.departamento,
    this.codigoEmpleado,
    required this.menuItems,
    required this.estadisticas,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      tipoUsuario: json['tipo_usuario'] ?? 'cliente',
      rol: json['rol'] ?? 'Sin rol',
      permisos: List<String>.from(json['permisos'] ?? []),
      departamento: json['departamento'],
      codigoEmpleado: json['codigo_empleado'],
      menuItems: List<Map<String, dynamic>>.from(json['menu_items'] ?? []),
      estadisticas: Map<String, dynamic>.from(json['estadisticas'] ?? {}),
    );
  }
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Headers por defecto
  Map<String, String> get _defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers con autenticación
  Future<Map<String, String>> get _authHeaders async {
    final token = await getToken();
    final headers = Map<String, String>.from(_defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Función para hacer peticiones HTTP con manejo automático de tokens
  Future<ApiResponse<T>> _apiRequest<T>(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
  }) async {
    final baseUrl = await IPDetection.getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _authHeaders;

    try {
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Método HTTP no soportado: $method');
      }

      // Si el token expiró (401), intentar refrescar
      if (response.statusCode == 401) {
        final refreshResponse = await refreshToken();
        if (refreshResponse.success) {
          // Reintentar la petición con el nuevo token
          final newHeaders = await _authHeaders;
          switch (method.toUpperCase()) {
            case 'GET':
              response = await http.get(url, headers: newHeaders);
              break;
            case 'POST':
              response = await http.post(
                url,
                headers: newHeaders,
                body: body != null ? jsonEncode(body) : null,
              );
              break;
            case 'PUT':
              response = await http.put(
                url,
                headers: newHeaders,
                body: body != null ? jsonEncode(body) : null,
              );
              break;
            case 'DELETE':
              response = await http.delete(url, headers: newHeaders);
              break;
          }
        } else {
          // Si no se pudo refrescar el token, limpiar tokens y retornar error
          await clearTokens();
          return ApiResponse<T>(
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          );
        }
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson != null ? fromJson(responseData) : responseData,
          message: responseData['message'] ?? 'Operación exitosa',
        );
      } else {
        // Extraer mensaje de error específico
        String errorMessage = 'Error en la petición';

        if (responseData['detail'] != null) {
          errorMessage = responseData['detail'];
        } else if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        } else if (responseData['non_field_errors'] != null) {
          // Para errores de validación generales
          errorMessage = responseData['non_field_errors'].join(', ');
        } else {
          // Para errores de campos específicos
          List<String> fieldErrors = [];
          responseData.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              fieldErrors.add('$key: ${value.join(', ')}');
            }
          });
          if (fieldErrors.isNotEmpty) {
            errorMessage = fieldErrors.join('; ');
          }
        }

        return ApiResponse<T>(
          success: false,
          error: errorMessage,
          message: responseData['message'],
        );
      }
    } catch (e) {
      return ApiResponse<T>(success: false, error: 'Error de conexión: $e');
    }
  }

  // Función para hacer peticiones HTTP sin autenticación
  Future<ApiResponse<T>> _apiRequestWithoutAuth<T>(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
  }) async {
    final baseUrl = await IPDetection.getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = _defaultHeaders;

    try {
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Método HTTP no soportado: $method');
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson != null ? fromJson(responseData) : responseData,
          message: responseData['message'] ?? 'Operación exitosa',
        );
      } else {
        // Extraer mensaje de error específico
        String errorMessage = 'Error en la petición';

        if (responseData['detail'] != null) {
          errorMessage = responseData['detail'];
        } else if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        } else if (responseData['non_field_errors'] != null) {
          // Para errores de validación generales
          errorMessage = responseData['non_field_errors'].join(', ');
        } else {
          // Para errores de campos específicos
          List<String> fieldErrors = [];
          responseData.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              fieldErrors.add('$key: ${value.join(', ')}');
            }
          });
          if (fieldErrors.isNotEmpty) {
            errorMessage = fieldErrors.join('; ');
          }
        }

        return ApiResponse<T>(
          success: false,
          error: errorMessage,
          message: responseData['message'],
        );
      }
    } catch (e) {
      return ApiResponse<T>(success: false, error: 'Error de conexión: $e');
    }
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  // Login unificado (detecta automáticamente el tipo de usuario)
  Future<ApiResponse<LoginResponse>> login(LoginCredentials credentials) async {
    try {
      final response = await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/auth/login/',
        method: 'POST',
        body: credentials.toJson(),
      );

      if (response.success && response.data != null) {
        final loginResponse = LoginResponse.fromJson(response.data!);
        
        // Guardar tokens
        await saveToken(loginResponse.access);
        await saveRefreshToken(loginResponse.refresh);

        return ApiResponse<LoginResponse>(
            success: true,
          data: loginResponse,
            message: 'Inicio de sesión exitoso',
          );
        } else {
        return ApiResponse<LoginResponse>(
          success: false,
          error: response.error ?? 'Error en el login',
        );
      }
    } catch (e) {
      return ApiResponse<LoginResponse>(success: false, error: 'Error en el login: $e');
    }
  }

  // Registro de clientes (público con verificación)
  Future<ApiResponse<Map<String, dynamic>>> registerCliente(ClienteRegisterData userData) async {
    try {
      final response = await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/register/',
        method: 'POST',
        body: userData.toJson(),
      );

      return response;
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error en el registro: $e',
      );
    }
  }

  // Creación de administradores (requiere autenticación)
  Future<ApiResponse<User>> createAdmin(AdminCreateData userData) async {
    try {
      final response = await _apiRequest<User>(
        '/api/admin/create/',
        method: 'POST',
        body: userData.toJson(),
        fromJson: (data) => User.fromJson(data),
      );

      return response;
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Error al crear administrador: $e',
      );
    }
  }

  // Autenticación con Google
  Future<ApiResponse<LoginResponse>> loginWithGoogle(String accessToken) async {
    try {
      final response = await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/google/',
        method: 'POST',
        body: {'access_token': accessToken},
      );

      if (response.success && response.data != null) {
        final loginResponse = LoginResponse.fromJson(response.data!);
        
        // Guardar tokens
        await saveToken(loginResponse.access);
        await saveRefreshToken(loginResponse.refresh);

        return ApiResponse<LoginResponse>(
          success: true,
          data: loginResponse,
          message: 'Inicio de sesión con Google exitoso',
        );
      } else {
        return ApiResponse<LoginResponse>(
        success: false,
          error: response.error ?? 'Error en el login con Google',
        );
      }
    } catch (e) {
      return ApiResponse<LoginResponse>(success: false, error: 'Error en el login con Google: $e');
    }
  }

  // ===== MÉTODOS DE VERIFICACIÓN =====

  // Verificar código de verificación para clientes
  Future<ApiResponse<User>> verifyCode(int userId, String code) async {
    try {
      final response = await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/verify/',
        method: 'POST',
        body: {'user_id': userId, 'code': code},
      );

      if (response.success && response.data != null) {
        final user = User.fromJson(response.data!['user']);
        return ApiResponse<User>(
          success: true,
          data: user,
          message: 'Usuario verificado exitosamente',
        );
      } else {
        return ApiResponse<User>(
          success: false,
          error: response.error ?? 'Error al verificar código',
        );
      }
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Error al verificar código: $e',
      );
    }
  }

  // Reenviar código de verificación
  Future<ApiResponse<Map<String, dynamic>>> resendVerificationCode(int userId) async {
    try {
      return await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/resend-code/',
        method: 'POST',
        body: {'user_id': userId},
      );
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al reenviar código: $e',
      );
    }
  }

  // ===== MÉTODOS DE INFORMACIÓN DEL USUARIO =====

  // Obtener información del usuario actual
  Future<ApiResponse<User>> getCurrentUser() async {
    try {
      return await _apiRequest<User>(
        '/api/auth/user-info/',
        fromJson: (data) => User.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Error al obtener usuario: $e',
      );
    }
  }

  // Obtener datos del dashboard según tipo de usuario
  Future<ApiResponse<DashboardData>> getDashboardData() async {
    try {
      final response = await _apiRequest<Map<String, dynamic>>(
        '/api/auth/dashboard-data/',
      );

      if (response.success && response.data != null) {
        final dashboardData = DashboardData.fromJson(response.data!);
        return ApiResponse<DashboardData>(
          success: true,
          data: dashboardData,
          message: 'Datos del dashboard obtenidos exitosamente',
        );
      } else {
        return ApiResponse<DashboardData>(
          success: false,
          error: response.error ?? 'Error al obtener datos del dashboard',
        );
      }
    } catch (e) {
      return ApiResponse<DashboardData>(
        success: false,
        error: 'Error al obtener datos del dashboard: $e',
      );
    }
  }

  // Logout unificado
  Future<void> logout() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken != null) {
        await _apiRequest('/api/auth/logout/', method: 'POST', body: {'refresh': refreshToken});
      }
    } catch (e) {
      // Ignorar errores en logout
    } finally {
      await clearTokens();
    }
  }

  // ===== MÉTODOS DE TOKEN =====

  // Guardar access token
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // Guardar refresh token
  Future<void> saveRefreshToken(String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('refresh_token', refreshToken);
  }

  // Obtener access token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Obtener refresh token
  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('refresh_token');
  }

  // Limpiar todos los tokens
  Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
  }

  // Limpiar solo access token (para compatibilidad)
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Verificar si está autenticado
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null;
  }

  // Refrescar token usando refresh token
  Future<ApiResponse<LoginResponse>> refreshToken() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) {
        return ApiResponse<LoginResponse>(
          success: false,
          error: 'No hay refresh token disponible',
        );
      }

      // El backend no tiene endpoint de refresh, usar logout y requerir login
      return ApiResponse<LoginResponse>(
        success: false,
        error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
      );
    } catch (e) {
      return ApiResponse<LoginResponse>(
        success: false,
        error: 'Error al refrescar token: $e',
      );
    }
  }

  // ===== MÉTODOS DE UI =====

  // Mostrar toast de éxito
  void showSuccessToast(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.blue,
      textColor: Colors.white,
    );
  }

  // Mostrar toast de error
  void showErrorToast(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.red,
      textColor: Colors.white,
    );
  }

  // ===== MÉTODOS DE DETECCIÓN DE IP =====

  // Obtener información del entorno actual
  Future<Map<String, dynamic>> getEnvironmentInfo() async {
    return await IPDetection.getEnvironmentInfo();
  }

  // Forzar nueva detección de IP (útil para cambios de red)
  Future<String> forceIPDetection() async {
    return await IPDetection.forceDetection();
  }

  // Forzar localhost (útil para desarrollo)
  Future<String> forceLocalhost() async {
    return await IPDetection.forceLocalhost();
  }

  // Verificar conectividad con el backend
  Future<bool> checkBackendConnection() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/login/'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      // Cualquier respuesta del servidor indica que está disponible
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (e) {
      return false;
    }
  }

  // Mostrar información del entorno en un toast
  Future<void> showEnvironmentInfo() async {
    final envInfo = await getEnvironmentInfo();
    final isConnected = await checkBackendConnection();
    
    final message = '''
Entorno: ${envInfo['isCloud'] ? 'Nube' : 'Local'}
URL: ${envInfo['baseUrl']}
Plataforma: ${envInfo['platform']}
Conectado: ${isConnected ? 'Sí' : 'No'}
''';
    
    showSuccessToast(message);
  }
}
