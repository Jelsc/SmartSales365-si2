import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../navigation/app_router.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final credentials = LoginCredentials(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      final response = await _authService.login(credentials);

      if (response.success && response.data != null) {
        final loginResponse = response.data!;
        
        // Mostrar mensaje según el tipo de usuario
        String message = '¡Inicio de sesión exitoso!';
        String userType = loginResponse.tipoLogin;
        
        // Si es administrativo pero tiene rol de conductor, tratarlo como conductor
        if (loginResponse.tipoLogin == 'administrativo' && 
            loginResponse.user.rol != null &&
            loginResponse.user.rol!.nombre.toLowerCase() == 'conductor') {
          userType = 'conductor';
        }
        
        if (userType == 'administrativo') {
          message = '¡Bienvenido, ${loginResponse.user.firstName}!';
        } else if (userType == 'conductor') {
          message = '¡Bienvenido conductor, ${loginResponse.user.firstName}!';
        } else {
          message = '¡Bienvenido, ${loginResponse.user.firstName}!';
        }
        
        _authService.showSuccessToast(message);

        if (mounted) {
          // Redirigir según el tipo de usuario
          // Si es administrativo pero tiene rol de conductor, tratarlo como conductor
          String userType = loginResponse.tipoLogin;
          if (loginResponse.tipoLogin == 'administrativo' && 
              loginResponse.user.rol != null &&
              loginResponse.user.rol!.nombre.toLowerCase() == 'conductor') {
            userType = 'conductor';
          }
          
          await AppRouter.navigateBasedOnUserType(
            context,
            userType,
            loginResponse.user.firstName,
          );
        }
      } else {
        _authService.showErrorToast(response.error ?? 'Error en el login');
      }
    } catch (e) {
      _authService.showErrorToast('Error inesperado: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loginWithGoogle() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Para testing, usar un token mock
      // En producción, integrar con Google Sign-In
      const mockGoogleToken = "mock_google_token_for_testing";
      
      final response = await _authService.loginWithGoogle(mockGoogleToken);

      if (response.success && response.data != null) {
        _authService.showSuccessToast('¡Inicio de sesión con Google exitoso!');

        if (mounted) {
          Navigator.pushReplacementNamed(context, AppRouter.home);
        }
      } else {
        _authService.showErrorToast(response.error ?? 'Error en el login con Google');
      }
    } catch (e) {
      _authService.showErrorToast('Error inesperado: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          // Botón de debug (solo para desarrollo)
          if (true) // Cambiar a false en producción
            PopupMenuButton<String>(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.settings, color: Colors.grey, size: 20),
              ),
              tooltip: 'Debug',
              onSelected: (value) async {
                switch (value) {
                  case 'info':
                    await _authService.showEnvironmentInfo();
                    break;
                  case 'force':
                    final newUrl = await _authService.forceIPDetection();
                    _authService.showSuccessToast('Nueva detección: $newUrl');
                    break;
                  case 'localhost':
                    await _authService.forceLocalhost();
                    _authService.showSuccessToast('Forzando localhost');
                    break;
                }
              },
              itemBuilder: (BuildContext context) => [
                const PopupMenuItem<String>(
                  value: 'info',
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, size: 20, color: Colors.blue),
                      SizedBox(width: 12),
                      Text('Info Entorno', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                const PopupMenuItem<String>(
                  value: 'force',
                  child: Row(
                    children: [
                      Icon(Icons.refresh, size: 20, color: Colors.orange),
                      SizedBox(width: 12),
                      Text('Forzar Detección', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                const PopupMenuItem<String>(
                  value: 'localhost',
                  child: Row(
                    children: [
                      Icon(Icons.home, size: 20, color: Colors.green),
                      SizedBox(width: 12),
                      Text('Forzar Localhost', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 30),

                // Logo y título balanceado
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.directions_bus, size: 55, color: Colors.blue),
                ),
                const SizedBox(height: 20),
                const Text(
                  'MoviFleet',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Inicia sesión',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 40),

                // Campo de email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Correo electrónico',
                    prefixIcon: Icon(Icons.email, color: Colors.grey.shade600),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.blue, width: 2),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Por favor ingresa tu email';
                    }
                    if (!value.contains('@')) {
                      return 'Por favor ingresa un email válido';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Campo de contraseña
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: Icon(Icons.lock, color: Colors.grey.shade600),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                        color: Colors.grey.shade600,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.blue, width: 2),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Por favor ingresa tu contraseña';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Botón de login
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shadowColor: Colors.blue.withOpacity(0.3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Iniciar sesión',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),

                const SizedBox(height: 20),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'O',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),

                const SizedBox(height: 20),

                // Botón de Google
                SizedBox(
                  height: 52,
                  child: OutlinedButton.icon(
                    onPressed: _isLoading ? null : _loginWithGoogle,
                    icon: const Icon(Icons.login, color: Colors.blue),
                    label: const Text(
                      'Continuar con Google',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.blue, width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Botón de registro
                SizedBox(
                  height: 52,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const RegisterScreen(),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.blue, width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Crear cuenta',
                      style: TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
