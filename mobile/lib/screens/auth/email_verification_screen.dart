import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../client/client_home_screen.dart';
import 'login_screen.dart';

class EmailVerificationScreen extends StatefulWidget {
  final String email;
  final String username;
  final int userId;

  const EmailVerificationScreen({
    super.key,
    required this.email,
    required this.username,
    required this.userId,
  });

  @override
  State<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  int _resendCountdown = 0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _sendVerificationCode();
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _sendVerificationCode() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _authService.resendVerificationCode(widget.userId);

      if (response.success) {
        setState(() {
          _resendCountdown = 60; // 60 segundos de espera
        });
        _authService.showSuccessToast('Código enviado a ${widget.email}');
        _startResendCountdown();
      } else {
        setState(() {
          _errorMessage = response.error ?? 'Error al enviar código';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error inesperado: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _startResendCountdown() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _resendCountdown > 0) {
        setState(() {
          _resendCountdown--;
        });
        _startResendCountdown();
      }
    });
  }

  Future<void> _verifyCode() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _authService.verifyCode(
        widget.userId,
        _codeController.text.trim(),
      );

      if (response.success && response.data != null) {
        _authService.showSuccessToast('¡Email verificado exitosamente!');

        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const ClientHomeScreen()),
            (route) => false,
          );
        }
      } else {
        setState(() {
          _errorMessage = response.error ?? 'Código incorrecto';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error inesperado: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _resendCode() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _authService.resendVerificationCode(widget.userId);

      if (response.success) {
        setState(() {
          _resendCountdown = 60;
        });
        _authService.showSuccessToast('Código reenviado');
        _startResendCountdown();
      } else {
        setState(() {
          _errorMessage = response.error ?? 'Error al reenviar código';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error inesperado: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verificar Email'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo y título
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.email_outlined, size: 60, color: Colors.blue),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Verificación de Email',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // Información del usuario
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Hola ${widget.username}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Hemos enviado un código de verificación a:',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.email,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Campo de código
                TextFormField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 4,
                  ),
                  decoration: InputDecoration(
                    labelText: 'Código de verificación',
                    hintText: '123456',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.blue, width: 2),
                    ),
                    prefixIcon: Icon(Icons.security, color: Colors.grey.shade600),
                    helperText:
                        'Ingresa el código de 6 dígitos que recibiste por email',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Por favor ingresa el código';
                    }
                    if (value.length != 6) {
                      return 'El código debe tener 6 dígitos';
                    }
                    if (!RegExp(r'^[0-9]{6}$').hasMatch(value)) {
                      return 'El código debe contener solo números';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Mensaje de error
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.red.shade600),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: Colors.red.shade600),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),

                // Botón de verificar
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _verifyCode,
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
                            'Verificar Código',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                // Botón de reenviar código
                SizedBox(
                  height: 56,
                  child: OutlinedButton(
                    onPressed: (_isLoading || _resendCountdown > 0)
                        ? null
                        : _resendCode,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.blue, width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _resendCountdown > 0
                        ? Text(
                            'Reenviar código en ${_resendCountdown}s',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        : const Text(
                            'Reenviar Código',
                            style: TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),

                const SizedBox(height: 32),

                // Información adicional
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue.shade600),
                          const SizedBox(width: 8),
                          Text(
                            'Información importante',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.blue.shade600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '• El código expira en 15 minutos\n'
                        '• Revisa tu carpeta de spam si no recibes el email\n'
                        '• No compartas este código con nadie',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.blue.shade600,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Botón para volver al login
                SizedBox(
                  height: 56,
                  child: TextButton(
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                        (route) => false,
                      );
                    },
                    child: const Text(
                      'Volver al inicio de sesión',
                      style: TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
