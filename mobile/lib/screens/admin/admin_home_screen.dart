import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/auth_service.dart';
import '../../services/dashboard_admin_service.dart';
import 'dashboard/admin_dashboard_screen.dart';
import 'productos/productos_list_screen.dart';
import 'reportes/reportes_voz_screen.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  final AuthService _authService = AuthService();
  final DashboardAdminService _dashboardService = DashboardAdminService();

  User? _currentUser;
  int _selectedIndex = 0;
  DashboardStats? _stats;
  List<ProductoBajoStock> _productosBajoStock = [];
  List<ActividadReciente> _actividadesRecientes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadDashboardData();
  }

  Future<void> _loadUserData() async {
    final response = await _authService.getCurrentUser();
    if (response.success && response.data != null) {
      setState(() {
        _currentUser = response.data;
      });
    }
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);

    // Cargar estadísticas
    final statsResponse = await _dashboardService.getEstadisticas();
    if (statsResponse.success && statsResponse.data != null) {
      setState(() {
        _stats = statsResponse.data;
      });
    }

    // Cargar productos con bajo stock
    final bajoStockResponse = await _dashboardService.getProductosBajoStock();
    if (bajoStockResponse.success && bajoStockResponse.data != null) {
      setState(() {
        _productosBajoStock = bajoStockResponse.data!;
      });
    }

    // Cargar actividades recientes
    final actividadesResponse = await _dashboardService
        .getActividadesRecientes();
    if (actividadesResponse.success && actividadesResponse.data != null) {
      setState(() {
        _actividadesRecientes = actividadesResponse.data!;
      });
    }

    setState(() => _isLoading = false);
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cerrar Sesión'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _authService.logout();

      // Limpiar preferencias de rol para evitar bugs de persistencia
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_role');
      await prefs.remove('is_admin');

      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
      }
    }
  }

  Widget _getSelectedPage() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboardPage();
      case 1:
        return _buildUsersPage();
      case 2:
        return _buildReportsPage();
      case 3:
        return _buildSettingsPage();
      default:
        return _buildDashboardPage();
    }
  }

  Widget _buildDashboardPage() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bienvenida del administrador
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.admin_panel_settings,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Panel Administrativo',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Bienvenido, ${_currentUser?.firstName ?? 'Administrador'}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Estadísticas rápidas
            const Text(
              'Estadísticas Generales',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildStatCard(
                  'Usuarios',
                  '${_stats?.totalUsuarios ?? 0}',
                  Icons.people,
                  Colors.blue,
                ),
                _buildStatCard(
                  'Conductores',
                  '${_stats?.totalConductores ?? 0}',
                  Icons.local_shipping,
                  Colors.green,
                ),
                _buildStatCard(
                  'Productos',
                  '${_stats?.totalProductos ?? 0}',
                  Icons.inventory,
                  Colors.orange,
                ),
                _buildStatCard(
                  'Ventas Hoy',
                  '${_stats?.ventasHoy ?? 0}',
                  Icons.shopping_cart,
                  Colors.purple,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Acceso Rápido
            const Text(
              'Acceso Rápido',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.8,
              children: [
                _buildQuickAccessCard(
                  'Dashboard',
                  'Estadísticas completas',
                  Icons.dashboard,
                  Colors.blue,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AdminDashboardScreen(),
                      ),
                    );
                  },
                ),
                _buildQuickAccessCard(
                  'Productos',
                  'Gestionar inventario',
                  Icons.inventory,
                  Colors.orange,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ProductosListScreen(),
                      ),
                    );
                  },
                ),
                _buildQuickAccessCard(
                  'Reportes',
                  'Generar reportes con voz',
                  Icons.mic,
                  const Color(0xFF10B981),
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ReportesVozScreen(),
                      ),
                    );
                  },
                ),
                _buildQuickAccessCard(
                  'Conductores',
                  'Gestionar conductores',
                  Icons.local_shipping,
                  Colors.green,
                  () {
                    // TODO: Agregar pantalla de conductores
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Próximamente: Gestión de Conductores'),
                      ),
                    );
                  },
                ),
                _buildQuickAccessCard(
                  'Personal',
                  'Gestionar personal',
                  Icons.people,
                  Colors.purple,
                  () {
                    // TODO: Agregar pantalla de personal
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Próximamente: Gestión de Personal'),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Ingresos
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.monetization_on, color: Colors.green),
                        SizedBox(width: 8),
                        Text(
                          'Resumen de Ingresos',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Este Mes',
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Bs. ${(_stats?.ingresosMes ?? 0).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Bs. ${(_stats?.ingresosTotal ?? 0).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Productos con bajo stock
            if (_productosBajoStock.isNotEmpty) ...[
              const Text(
                'Productos con Bajo Stock',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Card(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _productosBajoStock.length > 5
                      ? 5
                      : _productosBajoStock.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final producto = _productosBajoStock[index];
                    return ListTile(
                      leading: const Icon(Icons.warning, color: Colors.orange),
                      title: Text(producto.nombre),
                      subtitle: Text(producto.categoria),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: producto.stock <= 5
                              ? Colors.red
                              : Colors.orange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Stock: ${producto.stock}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Actividades recientes
            const Text(
              'Actividad Reciente',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _actividadesRecientes.length > 5
                    ? 5
                    : _actividadesRecientes.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final actividad = _actividadesRecientes[index];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.blue.shade100,
                      child: Text(
                        actividad.usuario[0].toUpperCase(),
                        style: const TextStyle(color: Colors.blue),
                      ),
                    ),
                    title: Text(actividad.accion),
                    subtitle: Text(
                      '${actividad.usuario} • ${_formatearFecha(actividad.fechaHora)}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatearFecha(DateTime fecha) {
    final now = DateTime.now();
    final difference = now.difference(fecha);

    if (difference.inMinutes < 1) {
      return 'Ahora';
    } else if (difference.inHours < 1) {
      return 'Hace ${difference.inMinutes} min';
    } else if (difference.inDays < 1) {
      return 'Hace ${difference.inHours} h';
    } else {
      return '${fecha.day}/${fecha.month}/${fecha.year}';
    }
  }

  Widget _buildUsersPage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Gestión de Usuarios',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Módulo en desarrollo',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildReportsPage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Reportes y Análisis',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Módulo en desarrollo',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsPage() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Configuración',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: Text(
                    _currentUser != null && _currentUser!.firstName.isNotEmpty
                        ? _currentUser!.firstName.substring(0, 1).toUpperCase()
                        : 'A',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Text(
                  '${_currentUser?.firstName ?? ''} ${_currentUser?.lastName ?? ''}'
                      .trim(),
                ),
                subtitle: Text(_currentUser?.email ?? ''),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(
                  Icons.admin_panel_settings,
                  color: Colors.blue,
                ),
                title: const Text('Rol'),
                subtitle: Text(_currentUser?.rol?.nombre ?? 'Administrador'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.notifications, color: Colors.blue),
                title: const Text('Notificaciones'),
                trailing: Switch(value: true, onChanged: (value) {}),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.security, color: Colors.blue),
                title: const Text('Seguridad'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _handleLogout,
          icon: const Icon(Icons.logout),
          label: const Text('Cerrar Sesión'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAccessCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartSales365 - Admin'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              // TODO: Implementar notificaciones
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: Colors.blue),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  _currentUser != null && _currentUser!.firstName.isNotEmpty
                      ? _currentUser!.firstName.substring(0, 1).toUpperCase()
                      : 'A',
                  style: const TextStyle(fontSize: 40, color: Colors.blue),
                ),
              ),
              accountName: Text(
                '${_currentUser?.firstName ?? ''} ${_currentUser?.lastName ?? ''}'
                    .trim(),
              ),
              accountEmail: Text(_currentUser?.email ?? ''),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Dashboard'),
              selected: _selectedIndex == 0,
              onTap: () {
                setState(() => _selectedIndex = 0);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Usuarios'),
              selected: _selectedIndex == 1,
              onTap: () {
                setState(() => _selectedIndex = 1);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.analytics),
              title: const Text('Reportes'),
              selected: _selectedIndex == 2,
              onTap: () {
                setState(() => _selectedIndex = 2);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Configuración'),
              selected: _selectedIndex == 3,
              onTap: () {
                setState(() => _selectedIndex = 3);
                Navigator.pop(context);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text(
                'Cerrar Sesión',
                style: TextStyle(color: Colors.red),
              ),
              onTap: () {
                Navigator.pop(context);
                _handleLogout();
              },
            ),
          ],
        ),
      ),
      body: _getSelectedPage(),
    );
  }
}
