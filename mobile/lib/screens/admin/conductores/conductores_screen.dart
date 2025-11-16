import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/conductores_service.dart';

class ConductoresScreen extends StatefulWidget {
  const ConductoresScreen({super.key});

  @override
  State<ConductoresScreen> createState() => _ConductoresScreenState();
}

class _ConductoresScreenState extends State<ConductoresScreen> {
  final ConductoresService _service = ConductoresService();
  List<Conductor> _conductores = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarConductores();
  }

  Future<void> _cargarConductores() async {
    setState(() => _isLoading = true);
    final response = await _service.getConductores(busqueda: _searchQuery);
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _conductores = response.data!;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final conductoresFiltrados = _conductores.where((c) {
      if (_searchQuery.isEmpty) return true;
      return c.nombreCompleto.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ) ||
          c.ci.contains(_searchQuery) ||
          c.nroLicencia.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conductores'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarConductores,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/conductores'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar conductores...',
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
                : conductoresFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.local_shipping,
                          size: 64,
                          color: Colors.grey,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'No hay conductores'
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
                    itemCount: conductoresFiltrados.length,
                    itemBuilder: (context, index) {
                      final conductor = conductoresFiltrados[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: conductor.estado == 'activo'
                                ? Colors.green
                                : Colors.grey,
                            child: Text(
                              conductor.nombre[0].toUpperCase(),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          title: Text(conductor.nombreCompleto),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CI: ${conductor.ci}'),
                              Text(
                                'Licencia ${conductor.tipoLicencia}: ${conductor.nroLicencia}',
                              ),
                              if (conductor.licenciaVencida)
                                const Text(
                                  '⚠️ Licencia vencida',
                                  style: TextStyle(color: Colors.red),
                                ),
                            ],
                          ),
                          trailing: Chip(
                            label: Text(conductor.estado.toUpperCase()),
                            backgroundColor: conductor.estado == 'activo'
                                ? Colors.green.shade100
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
