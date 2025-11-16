import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../admin_drawer.dart';
import '../../../services/bitacora_service.dart';

class BitacoraScreen extends StatefulWidget {
  const BitacoraScreen({super.key});

  @override
  State<BitacoraScreen> createState() => _BitacoraScreenState();
}

class _BitacoraScreenState extends State<BitacoraScreen> {
  final BitacoraService _service = BitacoraService();
  List<RegistroBitacora> _registros = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarBitacora();
  }

  Future<void> _cargarBitacora() async {
    setState(() => _isLoading = true);
    final response = await _service.getBitacora(busqueda: _searchQuery);
    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _registros = response.data!;
      }
    });
  }

  String _formatearFecha(DateTime fecha) {
    return DateFormat('dd/MM/yyyy HH:mm').format(fecha);
  }

  @override
  Widget build(BuildContext context) {
    final registrosFiltrados = _registros.where((r) {
      if (_searchQuery.isEmpty) return true;
      return r.accion.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          r.descripcion.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          r.usuarioUsername.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bitácora'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarBitacora,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/bitacora'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar en bitácora...',
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
                : registrosFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.history, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty
                              ? 'No hay registros'
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
                    itemCount: registrosFiltrados.length,
                    itemBuilder: (context, index) {
                      final reg = registrosFiltrados[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: Colors.purple,
                            child: const Icon(
                              Icons.person,
                              color: Colors.white,
                            ),
                          ),
                          title: Text(reg.accion),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Usuario: ${reg.usuarioNombreCompleto}'),
                              Text('Rol: ${reg.usuarioRol}'),
                              Text('Fecha: ${_formatearFecha(reg.fechaHora)}'),
                              if (reg.descripcion.isNotEmpty)
                                Text(
                                  reg.descripcion,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                          trailing: reg.ip != null
                              ? Tooltip(
                                  message: reg.ip!,
                                  child: const Icon(Icons.computer),
                                )
                              : null,
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
