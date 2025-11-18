import 'package:flutter/material.dart';
import '../../../services/auth_service.dart';
import '../../../providers/theme_provider.dart';
import '../../auth/login_screen.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final _authService = AuthService();
  final _themeProvider = ThemeProvider();
  User? _currentUser;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _themeProvider.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    _themeProvider.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _loadUserData() async {
    try {
      final response = await _authService.getCurrentUser();
      if (response.success && response.data != null) {
        setState(() {
          _currentUser = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Cerrar Sesión'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _authService.logout();
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          // Header con información del usuario
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade600, Colors.blue.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.blue.shade100,
                      child: Text(
                        _getInitials(),
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _currentUser?.firstName ?? 'Usuario',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _currentUser?.email ?? 'email@ejemplo.com',
                    style: const TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),

          // Opciones del perfil
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildSection(
                  title: 'Cuenta',
                  items: [
                    _buildMenuItem(
                      icon: Icons.person,
                      title: 'Editar Perfil',
                      onTap: () => _showComingSoon('Editar Perfil'),
                    ),
                    _buildMenuItem(
                      icon: Icons.lock,
                      title: 'Cambiar Contraseña',
                      onTap: () => _showComingSoon('Cambiar Contraseña'),
                    ),
                    _buildMenuItem(
                      icon: Icons.location_on,
                      title: 'Direcciones',
                      onTap: () => _showComingSoon('Mis Direcciones'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildSection(
                  title: 'Preferencias',
                  items: [
                    _buildMenuItem(
                      icon: Icons.notifications,
                      title: 'Notificaciones',
                      onTap: () => _showComingSoon('Notificaciones'),
                    ),
                    _buildMenuItem(
                      icon: Icons.language,
                      title: 'Idioma',
                      subtitle: 'Español',
                      onTap: () => _showComingSoon('Cambiar Idioma'),
                    ),
                    _buildMenuItem(
                      icon: Icons.dark_mode,
                      title: 'Tema',
                      subtitle: _themeProvider.isDarkMode ? 'Oscuro' : 'Claro',
                      onTap: () async {
                        await _themeProvider.toggleTheme();
                        setState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildSection(
                  title: 'Soporte',
                  items: [
                    _buildMenuItem(
                      icon: Icons.help,
                      title: 'Centro de Ayuda',
                      onTap: () => _showComingSoon('Centro de Ayuda'),
                    ),
                    _buildMenuItem(
                      icon: Icons.privacy_tip,
                      title: 'Privacidad',
                      onTap: () => _showComingSoon('Política de Privacidad'),
                    ),
                    _buildMenuItem(
                      icon: Icons.info,
                      title: 'Acerca de',
                      subtitle: 'v1.0.0',
                      onTap: () => _showAboutDialog(),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: _logout,
                    icon: const Icon(Icons.logout),
                    label: const Text(
                      'Cerrar Sesión',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getInitials() {
    if (_currentUser?.firstName != null &&
        _currentUser!.firstName!.isNotEmpty) {
      return _currentUser!.firstName!.substring(0, 1).toUpperCase();
    }
    return 'U';
  }

  Widget _buildSection({required String title, required List<Widget> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
        ),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.blue),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            )
          : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
    );
  }

  void _showComingSoon(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Próximamente disponible'),
        backgroundColor: Colors.blue,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.shopping_bag, color: Colors.blue, size: 32),
            SizedBox(width: 12),
            Text('SmartSales365'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Versión 1.0.0'),
            SizedBox(height: 8),
            Text(
              'Tu tienda inteligente en línea. '
              'Compra los mejores productos con la mejor experiencia.',
              style: TextStyle(fontSize: 14),
            ),
            SizedBox(height: 16),
            Text(
              '© 2024 SmartSales365',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }
}
