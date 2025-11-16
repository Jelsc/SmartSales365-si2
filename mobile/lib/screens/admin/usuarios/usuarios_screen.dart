import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/usuarios_service.dart';

class UsuariosScreen extends StatefulWidget {
  const UsuariosScreen({super.key});

  @override
  State<UsuariosScreen> createState() => _UsuariosScreenState();
}

class _UsuariosScreenState extends State<UsuariosScreen> {
  final UsuariosService _service = UsuariosService();
  List<Usuario> _usuarios = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarUsuarios();
  }

  Future<void> _cargarUsuarios() async {
    setState(() => _isLoading = true);
    final response = await _service.getUsuarios(busqueda: _searchQuery);
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _usuarios = response.data!;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final usuariosFiltrados = _usuarios.where((u) {
      if (_searchQuery.isEmpty) return true;
      return u.username.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          u.email.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          u.nombreCompleto.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Usuarios'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarUsuarios,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/usuarios'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar usuarios...',
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
                : usuariosFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.people, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'No hay usuarios'
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
                    itemCount: usuariosFiltrados.length,
                    itemBuilder: (context, index) {
                      final u = usuariosFiltrados[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: u.isActive
                                ? (u.esAdministrativo
                                      ? Colors.orange
                                      : Colors.teal)
                                : Colors.grey,
                            child: Text(
                              u.username[0].toUpperCase(),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          title: Text(
                            u.nombreCompleto.isEmpty
                                ? u.username
                                : u.nombreCompleto,
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Usuario: ${u.username}'),
                              Text('Email: ${u.email}'),
                              if (u.rolNombre != null)
                                Text('Rol: ${u.rolNombre}'),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (u.esAdministrativo)
                                const Icon(
                                  Icons.admin_panel_settings,
                                  color: Colors.orange,
                                ),
                              if (u.isStaff)
                                const Icon(Icons.verified, color: Colors.blue),
                              Chip(
                                label: Text(u.isActive ? 'ACTIVO' : 'INACTIVO'),
                                backgroundColor: u.isActive
                                    ? Colors.green.shade100
                                    : Colors.grey.shade300,
                              ),
                            ],
                          ),
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
