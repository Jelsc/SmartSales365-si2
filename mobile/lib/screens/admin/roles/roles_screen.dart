import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/roles_service.dart';

class RolesScreen extends StatefulWidget {
  const RolesScreen({super.key});

  @override
  State<RolesScreen> createState() => _RolesScreenState();
}

class _RolesScreenState extends State<RolesScreen> {
  final RolesService _service = RolesService();
  List<Rol> _roles = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarRoles();
  }

  Future<void> _cargarRoles() async {
    setState(() => _isLoading = true);
    final response = await _service.getRoles(busqueda: _searchQuery);
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _roles = response.data!;
      } else {
        print('Error cargando roles: ${response.error}');
        // Si hay error, mantener la lista vacía para mostrar el estado vacío
        _roles = [];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final rolesFiltrados = _roles.where((r) {
      if (_searchQuery.isEmpty) return true;
      return r.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          r.descripcion.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Roles'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _cargarRoles),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/roles'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar roles...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : rolesFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.group, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'No hay roles'
                              : 'No se encontraron resultados',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: rolesFiltrados.length,
                    itemBuilder: (context, index) {
                      final rol = rolesFiltrados[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ExpansionTile(
                          leading: CircleAvatar(
                            backgroundColor: rol.esAdministrativo
                                ? Colors.deepOrange
                                : Colors.indigo,
                            child: Icon(
                              rol.esAdministrativo
                                  ? Icons.admin_panel_settings
                                  : Icons.person,
                              color: Colors.white,
                            ),
                          ),
                          title: Text(rol.nombre),
                          subtitle: Text(rol.descripcion),
                          trailing: Chip(
                            label: Text(
                              rol.esAdministrativo ? 'ADMIN' : 'USUARIO',
                            ),
                            backgroundColor: rol.esAdministrativo
                                ? Colors.orange.shade100
                                : Colors.blue.shade100,
                          ),
                          children: [
                            if (rol.permisos.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Permisos:',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: rol.permisos
                                          .map(
                                            (p) => Chip(
                                              label: Text(p),
                                              backgroundColor:
                                                  Colors.grey.shade200,
                                            ),
                                          )
                                          .toList(),
                                    ),
                                  ],
                                ),
                              )
                            else
                              const Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Text(
                                  'Sin permisos específicos',
                                  style: TextStyle(fontStyle: FontStyle.italic),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
