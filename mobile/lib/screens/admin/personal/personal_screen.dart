import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/personal_service.dart';

class PersonalScreen extends StatefulWidget {
  const PersonalScreen({super.key});

  @override
  State<PersonalScreen> createState() => _PersonalScreenState();
}

class _PersonalScreenState extends State<PersonalScreen> {
  final PersonalService _service = PersonalService();
  List<Personal> _personal = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarPersonal();
  }

  Future<void> _cargarPersonal() async {
    setState(() => _isLoading = true);
    final response = await _service.getPersonal(busqueda: _searchQuery);
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _personal = response.data!;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final personalFiltrado = _personal.where((p) {
      if (_searchQuery.isEmpty) return true;
      return p.nombreCompleto.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ) ||
          p.ci.contains(_searchQuery) ||
          (p.codigoEmpleado.toLowerCase().contains(_searchQuery.toLowerCase()));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarPersonal,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/personal'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar personal...',
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
                : personalFiltrado.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.badge, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'No hay personal'
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
                    itemCount: personalFiltrado.length,
                    itemBuilder: (context, index) {
                      final p = personalFiltrado[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: p.estado == 'activo'
                                ? Colors.blue
                                : Colors.grey,
                            child: Text(
                              p.nombre[0].toUpperCase(),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          title: Text(p.nombreCompleto),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CI: ${p.ci}'),
                              Text('Código: ${p.codigoEmpleado}'),
                              if (p.cargo != null) Text('Cargo: ${p.cargo}'),
                            ],
                          ),
                          trailing: Chip(
                            label: Text(p.estado.toUpperCase()),
                            backgroundColor: p.estado == 'activo'
                                ? Colors.blue.shade100
                                : Colors.grey.shade300,
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
