import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';

class ConductorHomeScreen extends StatefulWidget {
  const ConductorHomeScreen({super.key});

  @override
  State<ConductorHomeScreen> createState() => _ConductorHomeScreenState();
}

class _ConductorHomeScreenState extends State<ConductorHomeScreen> {
  final _authService = AuthService();
  User? _currentUser;
  bool _isLoading = true;
  bool _isOnDuty = false; // Estado de servicio del conductor

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

  void _toggleDutyStatus() {
    setState(() {
      _isOnDuty = !_isOnDuty;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isOnDuty ? 'Servicio iniciado' : 'Servicio pausado'),
        backgroundColor: _isOnDuty ? Colors.green : Colors.orange,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MoviFleet - Conductor'),
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
                    // Estado del conductor
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _isOnDuty 
                              ? [Colors.green.shade50, Colors.green.shade100]
                              : [Colors.blue.shade50, Colors.blue.shade100],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _isOnDuty ? Colors.green.shade200 : Colors.blue.shade200,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.drive_eta, 
                                color: _isOnDuty ? Colors.green.shade600 : Colors.blue.shade600,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _isOnDuty ? 'En Servicio' : 'Fuera de Servicio',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: _isOnDuty ? Colors.green : Colors.blue,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Hola ${_currentUser?.firstName ?? 'Conductor'}',
                            style: const TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _isOnDuty 
                                ? 'Listo para recibir viajes'
                                : 'Inicia tu servicio para comenzar',
                            style: const TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Botón de estado de servicio
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: _toggleDutyStatus,
                        icon: Icon(_isOnDuty ? Icons.pause : Icons.play_arrow),
                        label: Text(
                          _isOnDuty ? 'Pausar Servicio' : 'Iniciar Servicio',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isOnDuty ? Colors.orange : Colors.green,
                          foregroundColor: Colors.white,
                          elevation: 4,
                          shadowColor: (_isOnDuty ? Colors.orange : Colors.green).withValues(alpha: 0.3),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Funcionalidades específicas para conductores
                    Expanded(
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        children: [
                          _buildFeatureCard(
                            icon: Icons.assignment,
                            title: 'Viajes Asignados',
                            subtitle: 'Ver viajes del día',
                            color: Colors.blue,
                            onTap: () {
                              _showComingSoon('Viajes Asignados');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.people,
                            title: 'Pasajeros',
                            subtitle: 'Gestionar pasajeros',
                            color: Colors.green,
                            onTap: () {
                              _showComingSoon('Gestión de Pasajeros');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.location_on,
                            title: 'Mi Ubicación',
                            subtitle: 'Compartir ubicación',
                            color: Colors.red,
                            onTap: () {
                              _showComingSoon('Compartir Ubicación');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.analytics,
                            title: 'Reportes',
                            subtitle: 'Reportes de viaje',
                            color: Colors.purple,
                            onTap: () {
                              _showComingSoon('Reportes de Viaje');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.car_repair,
                            title: 'Vehículo',
                            subtitle: 'Estado del vehículo',
                            color: Colors.orange,
                            onTap: () {
                              _showComingSoon('Estado del Vehículo');
                            },
                          ),
                          _buildFeatureCard(
                            icon: Icons.schedule,
                            title: 'Horarios',
                            subtitle: 'Ver horarios',
                            color: Colors.indigo,
                            onTap: () {
                              _showComingSoon('Horarios de Trabajo');
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
