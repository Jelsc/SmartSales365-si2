import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/auth_service.dart';

class AdminDrawer extends StatefulWidget {
  final String currentRoute;

  const AdminDrawer({super.key, required this.currentRoute});

  @override
  State<AdminDrawer> createState() => _AdminDrawerState();
}

class _AdminDrawerState extends State<AdminDrawer> {
  final AuthService _authService = AuthService();
  User? _currentUser;
  final Set<String> _expandedModules = {};

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final response = await _authService.getCurrentUser();
    if (response.success && response.data != null) {
      setState(() {
        _currentUser = response.data;
      });
    }
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
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_role');
      await prefs.remove('is_admin');

      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
      }
    }
  }

  void _toggleExpanded(String moduleId) {
    setState(() {
      if (_expandedModules.contains(moduleId)) {
        _expandedModules.remove(moduleId);
      } else {
        _expandedModules.add(moduleId);
      }
    });
  }

  bool _isExpanded(String moduleId) => _expandedModules.contains(moduleId);

  bool _isRouteActive(String route) {
    return widget.currentRoute == route;
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.blue[50],
      child: Column(
        children: [
          // Header del drawer
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(
              top: 50,
              bottom: 20,
              left: 20,
              right: 20,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade700, Colors.blue.shade500],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.shopping_bag, color: Colors.white, size: 32),
                    const SizedBox(width: 12),
                    Text(
                      'SmartSales365',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (_currentUser != null) ...[
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.white,
                        child: Text(
                          _currentUser!.username.substring(0, 1).toUpperCase(),
                          style: TextStyle(
                            color: Colors.blue.shade700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentUser!.username,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              _currentUser!.email,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Lista de módulos
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                // Panel de Administración
                _buildMenuItem(
                  icon: Icons.home,
                  title: 'Panel',
                  route: '/admin/home',
                ),

                const Divider(height: 1),

                // Usuarios y Seguridad
                _buildExpandableModule(
                  moduleId: 'usuarios-sistema',
                  icon: Icons.shield_outlined,
                  title: 'Usuarios y Seguridad',
                  children: [
                    _buildSubMenuItem(
                      icon: Icons.check_circle_outline,
                      title: 'Permisos',
                      route: '/admin/permisos',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.group,
                      title: 'Roles',
                      route: '/admin/roles',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.people,
                      title: 'Usuarios',
                      route: '/admin/usuarios',
                    ),
                  ],
                ),

                const Divider(height: 1),

                // Administración Interna
                _buildExpandableModule(
                  moduleId: 'administracion-interna',
                  icon: Icons.business_center,
                  title: 'Administración Interna',
                  children: [
                    _buildSubMenuItem(
                      icon: Icons.badge,
                      title: 'Personal',
                      route: '/admin/personal',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.local_shipping,
                      title: 'Conductores',
                      route: '/admin/conductores',
                    ),
                  ],
                ),

                const Divider(height: 1),

                // E-Commerce
                _buildExpandableModule(
                  moduleId: 'e-commerce',
                  icon: Icons.shopping_cart,
                  title: 'E-Commerce',
                  children: [
                    _buildSubMenuItem(
                      icon: Icons.inventory,
                      title: 'Productos',
                      route: '/admin/productos',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.category,
                      title: 'Categorías',
                      route: '/admin/categorias',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.point_of_sale,
                      title: 'Ventas',
                      route: '/admin/ventas',
                    ),
                    _buildSubMenuItem(
                      icon: Icons.shopping_bag,
                      title: 'Pedidos',
                      route: '/admin/pedidos',
                    ),
                  ],
                ),

                const Divider(height: 1),

                // Notificaciones
                _buildMenuItem(
                  icon: Icons.notifications,
                  title: 'Notificaciones',
                  route: '/admin/notificaciones',
                ),

                const Divider(height: 1),

                // Bitácora
                _buildMenuItem(
                  icon: Icons.history,
                  title: 'Bitácora',
                  route: '/admin/bitacora',
                ),
              ],
            ),
          ),

          // Footer del drawer con logout
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text(
              'Cerrar Sesión',
              style: TextStyle(color: Colors.red),
            ),
            onTap: _handleLogout,
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String route,
  }) {
    final isActive = _isRouteActive(route);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? Colors.blue.shade100 : null,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? Colors.blue.shade700 : Colors.grey.shade700,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isActive ? Colors.blue.shade700 : Colors.grey.shade800,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () {
          Navigator.pop(context); // Cerrar drawer
          if (!isActive) {
            Navigator.pushReplacementNamed(context, route);
          }
        },
      ),
    );
  }

  Widget _buildExpandableModule({
    required String moduleId,
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    final isExpanded = _isExpanded(moduleId);

    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
          child: ListTile(
            leading: Icon(icon, color: Colors.grey.shade700),
            title: Text(
              title,
              style: TextStyle(
                color: Colors.grey.shade800,
                fontWeight: FontWeight.w500,
              ),
            ),
            trailing: Icon(
              isExpanded ? Icons.expand_less : Icons.expand_more,
              color: Colors.grey.shade700,
            ),
            onTap: () => _toggleExpanded(moduleId),
          ),
        ),
        if (isExpanded) ...children,
      ],
    );
  }

  Widget _buildSubMenuItem({
    required IconData icon,
    required String title,
    required String route,
  }) {
    final isActive = _isRouteActive(route);

    return Container(
      margin: const EdgeInsets.only(left: 24, right: 8, top: 2, bottom: 2),
      decoration: BoxDecoration(
        color: isActive ? Colors.blue.shade100 : null,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          size: 20,
          color: isActive ? Colors.blue.shade700 : Colors.grey.shade600,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            color: isActive ? Colors.blue.shade700 : Colors.grey.shade700,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () {
          Navigator.pop(context); // Cerrar drawer
          if (!isActive) {
            Navigator.pushReplacementNamed(context, route);
          }
        },
      ),
    );
  }
}
