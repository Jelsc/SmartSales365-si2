import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/roles_service.dart';

class PermisosScreen extends StatefulWidget {
  const PermisosScreen({super.key});

  @override
  State<PermisosScreen> createState() => _PermisosScreenState();
}

class _PermisosScreenState extends State<PermisosScreen> {
  final RolesService _service = RolesService();
  List<Rol> _roles = [];
  bool _isLoading = true;
  Map<String, Set<String>> _permisosPorRol = {};

  @override
  void initState() {
    super.initState();
    _cargarPermisos();
  }

  Future<void> _cargarPermisos() async {
    setState(() => _isLoading = true);
    final response = await _service.getRoles();
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _roles = response.data!;
        _permisosPorRol = {};
        for (var rol in _roles) {
          for (var permiso in rol.permisos) {
            if (!_permisosPorRol.containsKey(permiso)) {
              _permisosPorRol[permiso] = {};
            }
            _permisosPorRol[permiso]!.add(rol.nombre);
          }
        }
      } else {
        print('Error cargando permisos: ${response.error}');
        // Si hay error, mantener las listas vacías
        _roles = [];
        _permisosPorRol = {};
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final permisos = _permisosPorRol.keys.toList()..sort();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Permisos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarPermisos,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/permisos'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : permisos.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.check_circle_outline,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No hay permisos configurados',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: permisos.length,
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final permiso = permisos[index];
                final rolesConPermiso = _permisosPorRol[permiso]!.toList()
                  ..sort();

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ExpansionTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.deepPurple,
                      child: Icon(Icons.verified_user, color: Colors.white),
                    ),
                    title: Text(
                      permiso,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${rolesConPermiso.length} ${rolesConPermiso.length == 1 ? 'rol' : 'roles'}',
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Roles con este permiso:',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: rolesConPermiso
                                  .map(
                                    (rol) => Chip(
                                      label: Text(rol),
                                      backgroundColor: Colors.blue.shade100,
                                      avatar: const Icon(Icons.group, size: 18),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
