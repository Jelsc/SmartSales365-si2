import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  final _authService = AuthService();
  User? _currentUser;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
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
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MoviFleet - Cliente'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        elevation: 4,
        shadowColor: Colors.blue.withValues(alpha: 0.3),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Bienvenida específica para cliente
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.blue.shade50, Colors.blue.shade100],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.person, color: Colors.blue.shade600),
                              const SizedBox(width: 8),
                              const Text(
                                '¡Bienvenido Cliente!',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Hola ${_currentUser?.firstName ?? 'Usuario'}',
                            style: const TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Gestiona tus viajes y encomiendas',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Funcionalidades específicas para clientes
                    Expanded(
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        children: [
                          _buildFeatureCard(
                            icon: Icons.directions_bus,
                            title: 'Ver Viajes',
                            subtitle: 'Explora viajes disponibles',
                            color: Colors.blue,
                            onTap: () {
                              // TODO: Implementar pantalla de viajes
                              _showComingSoon('Ver Viajes');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.book_online,
                            title: 'Reservar',
                            subtitle: 'Reserva tu asiento',
                            color: Colors.green,
                            onTap: () {
                              // TODO: Implementar pantalla de reservas
                              _showComingSoon('Reservar Viaje');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.local_shipping,
                            title: 'Encomiendas',
                            subtitle: 'Envía y rastrea paquetes',
                            color: Colors.orange,
                            onTap: () {
                              // TODO: Implementar pantalla de encomiendas
                              _showComingSoon('Encomiendas');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.location_on,
                            title: 'Tracking',
                            subtitle: 'Rastrea en tiempo real',
                            color: Colors.purple,
                            onTap: () {
                              // TODO: Implementar pantalla de tracking
                              _showComingSoon('Tracking');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.history,
                            title: 'Historial',
                            subtitle: 'Ver viajes anteriores',
                            color: Colors.indigo,
                            onTap: () {
                              // TODO: Implementar pantalla de historial
                              _showComingSoon('Historial');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.payment,
                            title: 'Pagos',
                            subtitle: 'Gestiona tus pagos',
                            color: Colors.teal,
                            onTap: () {
                              // TODO: Implementar pantalla de pagos
                              _showComingSoon('Pagos');
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4,
      shadowColor: color.withValues(alpha: 0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
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
}
