import 'package:flutter/material.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding_screen.dart';

class AppRouter {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String home = '/home';

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
    // Todos los usuarios van al home de cliente (app mobile es para clientes)
    Navigator.pushReplacementNamed(context, home);
  }
}
