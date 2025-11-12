import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/admin/admin_home_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding_screen.dart';
import '../services/auth_service.dart';

class AppRouter {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String home = '/home';
  static const String adminHome = '/admin_home';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case onboarding:
        return MaterialPageRoute(
          builder: (_) => const OnboardingScreen(),
          settings: settings,
        );

      case login:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );

      case home:
        return MaterialPageRoute(
          builder: (_) => const ClientHomeScreen(),
          settings: settings,
        );

      case adminHome:
        return MaterialPageRoute(
          builder: (_) => const AdminHomeScreen(),
          settings: settings,
        );

      default:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
    }
  }

  /// Navega al home correspondiente según el tipo de usuario
  ///
  /// Esta función determina si el usuario es administrativo o cliente
  /// y lo redirige al módulo correspondiente con la navegación apropiada
  /// para evitar bugs de persistencia al cerrar/abrir la app.
  ///
  /// Utiliza pushNamedAndRemoveUntil para limpiar completamente la pila de navegación
  /// y prevenir que el usuario regrese a pantallas anteriores o tenga problemas
  /// al reiniciar la aplicación.
  static Future<void> navigateBasedOnUserType(
    BuildContext context,
    String userType,
    String userName,
  ) async {
    try {
      final authService = AuthService();
      final response = await authService.getCurrentUser();

      if (!response.success || response.data == null) {
        // Si no hay usuario o falla la petición, redirigir al login
        if (context.mounted) {
          Navigator.pushNamedAndRemoveUntil(
            context,
            login,
            (route) => false, // Elimina todas las rutas anteriores
          );
        }
        return;
      }

      final user = response.data!;

      // Guardar información del rol en SharedPreferences para persistencia
      await _saveUserRolePreferences(user);

      // Determinar la ruta según el tipo de usuario
      String targetRoute;
      if (user.esAdministrativo || user.puedeAccederAdmin) {
        targetRoute = adminHome;
      } else {
        targetRoute = home;
      }

      // Navegar y limpiar toda la pila de navegación
      // Esto previene bugs al cerrar y reabrir la app
      if (context.mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          targetRoute,
          (route) => false, // Elimina TODAS las rutas anteriores
        );
      }
    } catch (e) {
      print('❌ Error al determinar tipo de usuario: $e');
      // En caso de error, redirigir al login por seguridad
      if (context.mounted) {
        Navigator.pushNamedAndRemoveUntil(context, login, (route) => false);
      }
    }
  }

  /// Guarda las preferencias de rol del usuario para persistencia
  ///
  /// Esto ayuda a mantener el estado correcto cuando la app se cierra y reabre,
  /// evitando el bug de cambio de módulo que experimentaste anteriormente.
  static Future<void> _saveUserRolePreferences(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Guardar flags de rol
      await prefs.setBool('is_admin', user.esAdministrativo);
      await prefs.setBool('can_access_admin', user.puedeAccederAdmin);
      await prefs.setBool('is_client', user.esCliente);

      // Guardar información del rol si existe
      if (user.rol != null) {
        await prefs.setString('user_role_name', user.rol!.nombre);
        await prefs.setInt('user_role_id', user.rol!.id);
      }

      print('✅ Preferencias de rol guardadas correctamente');
    } catch (e) {
      print('❌ Error al guardar preferencias de rol: $e');
    }
  }

  /// Obtiene el tipo de usuario desde SharedPreferences
  ///
  /// Útil para verificar el rol del usuario sin hacer una petición al servidor,
  /// especialmente durante el reinicio de la app.
  static Future<bool> isAdminUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isAdmin = prefs.getBool('is_admin') ?? false;
      final canAccessAdmin = prefs.getBool('can_access_admin') ?? false;
      return isAdmin || canAccessAdmin;
    } catch (e) {
      print('❌ Error al verificar si es admin: $e');
      return false;
    }
  }

  /// Limpia las preferencias de rol del usuario
  ///
  /// Debe llamarse al hacer logout para evitar que persistan datos de sesiones anteriores.
  static Future<void> clearUserRolePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('is_admin');
      await prefs.remove('can_access_admin');
      await prefs.remove('is_client');
      await prefs.remove('user_role_name');
      await prefs.remove('user_role_id');
      print('✅ Preferencias de rol limpiadas correctamente');
    } catch (e) {
      print('❌ Error al limpiar preferencias de rol: $e');
    }
  }
}
