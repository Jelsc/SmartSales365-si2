import 'package:flutter/material.dart';
import '../../../services/dashboard_admin_service.dart';
import '../admin_drawer.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final DashboardAdminService _dashboardService = DashboardAdminService();

  DashboardStats? _stats;
  List<ProductoBajoStock> _productosBajoStock = [];
  List<ActividadReciente> _actividades = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Cargar estadísticas
      final statsResponse = await _dashboardService.getEstadisticas();
      if (statsResponse.success && statsResponse.data != null) {
        _stats = statsResponse.data;
      }

      // Cargar productos bajo stock
      final stockResponse = await _dashboardService.getProductosBajoStock();
      if (stockResponse.success && stockResponse.data != null) {
        _productosBajoStock = stockResponse.data!;
      }

      // Cargar actividades recientes
      final actividadesResponse = await _dashboardService
          .getActividadesRecientes();
      if (actividadesResponse.success && actividadesResponse.data != null) {
        _actividades = actividadesResponse.data!;
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error al cargar datos: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Administrativo'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/dashboard'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loadDashboardData,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reintentar'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Estadísticas generales
                    if (_stats != null) ...[
                      _buildStatsSection(),
                      const SizedBox(height: 24),
                    ],

                    // Ingresos
                    if (_stats != null) ...[
                      _buildIngresosCard(),
                      const SizedBox(height: 24),
                    ],

                    // Productos bajo stock
                    if (_productosBajoStock.isNotEmpty) ...[
                      _buildBajoStockSection(),
                      const SizedBox(height: 24),
                    ],

                    // Actividades recientes
                    if (_actividades.isNotEmpty) ...[
                      _buildActividadesSection(),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Resumen General',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _buildStatCard(
              'Productos',
              '${_stats!.totalProductos}',
              Icons.inventory,
              Colors.blue,
            ),
            _buildStatCard(
              'Conductores',
              '${_stats!.totalConductores}',
              Icons.local_shipping,
              Colors.green,
            ),
            _buildStatCard(
              'Personal',
              '${_stats!.totalPersonal}',
              Icons.people,
              Colors.orange,
            ),
            _buildStatCard(
              'Usuarios',
              '${_stats!.totalUsuarios}',
              Icons.person,
              Colors.purple,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 3,
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
              label,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIngresosCard() {
    return Card(
      color: Colors.green.shade50,
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.attach_money, color: Colors.green.shade700),
                const SizedBox(width: 8),
                const Text(
                  'Ingresos',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    Text(
                      'Bs. ${_stats!.ingresosTotal.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade700,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Este Mes',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    Text(
                      'Bs. ${_stats!.ingresosMes.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildVentasStat('Total', '${_stats!.totalVentas}'),
                _buildVentasStat('Hoy', '${_stats!.ventasHoy}'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVentasStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const Text(
          'ventas',
          style: TextStyle(fontSize: 10, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildBajoStockSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.warning, color: Colors.orange.shade700),
            const SizedBox(width: 8),
            const Text(
              'Productos con Bajo Stock',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _productosBajoStock.length > 5
                ? 5
                : _productosBajoStock.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final producto = _productosBajoStock[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: producto.stock <= 5
                      ? Colors.red
                      : Colors.orange,
                  child: Text(
                    '${producto.stock}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                title: Text(producto.nombre),
                subtitle: Text(producto.categoria),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  // Navegar a detalle del producto
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildActividadesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.history, color: Colors.blue),
            SizedBox(width: 8),
            Text(
              'Actividad Reciente',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _actividades.length > 10 ? 10 : _actividades.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final actividad = _actividades[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: _getActividadColor(actividad.accion),
                  child: Text(
                    actividad.usuario.substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Text(actividad.accion),
                subtitle: Text(
                  '${actividad.usuario} • ${_formatearFecha(actividad.fechaHora)}\n${actividad.descripcion}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                isThreeLine: true,
              );
            },
          ),
        ),
      ],
    );
  }

  Color _getActividadColor(String accion) {
    if (accion.toLowerCase().contains('crear')) return Colors.green;
    if (accion.toLowerCase().contains('actualizar')) return Colors.blue;
    if (accion.toLowerCase().contains('eliminar')) return Colors.red;
    return Colors.grey;
  }

  String _formatearFecha(DateTime fecha) {
    final now = DateTime.now();
    final difference = now.difference(fecha);

    if (difference.inSeconds < 60) {
      return 'Ahora';
    } else if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} min';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} h';
    } else {
      return '${fecha.day}/${fecha.month}/${fecha.year}';
    }
  }
}
