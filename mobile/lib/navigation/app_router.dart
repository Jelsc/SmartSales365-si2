import 'package:flutter/material.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/conductor/conductor_home_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding_screen.dart';

class AppRouter {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String home = '/home';
  static const String conductorHome = '/conductor-home';

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
      
      case conductorHome:
        return MaterialPageRoute(
          builder: (_) => const ConductorHomeScreen(),
          settings: settings,
        );
      
      default:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
    }
  }

  static Future<void> navigateBasedOnUserType(
    BuildContext context,
    String userType,
    String userName,
  ) async {
    switch (userType.toLowerCase()) {
      case 'conductor':
        Navigator.pushReplacementNamed(context, conductorHome);
        break;
      case 'administrativo':
      case 'admin':
        // Los administradores usan la web, redirigir a cliente por defecto
        Navigator.pushReplacementNamed(context, home);
        break;
      case 'cliente':
      default:
        Navigator.pushReplacementNamed(context, home);
        break;
    }
  }
}
