import 'package:flutter/material.dart';
import '../admin_drawer.dart';
import '../../../services/categorias_service.dart';

class CategoriasScreen extends StatefulWidget {
  const CategoriasScreen({super.key});

  @override
  State<CategoriasScreen> createState() => _CategoriasScreenState();
}

class _CategoriasScreenState extends State<CategoriasScreen> {
  final CategoriasService _categoriasService = CategoriasService();
  List<Categoria> _categorias = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCategorias();
  }

  Future<void> _loadCategorias() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _categoriasService.getCategorias(
      busqueda: _searchQuery.isNotEmpty ? _searchQuery : null,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.success && response.data != null) {
          _categorias = response.data!;
        } else {
          _error = response.message ?? 'Error al cargar categorías';
        }
      });
    }
  }

  Future<void> _eliminarCategoria(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Eliminación'),
        content: const Text('¿Estás seguro de eliminar esta categoría?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final response = await _categoriasService.deleteCategoria(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Categoría eliminada'),
            backgroundColor: response.success ? Colors.green : Colors.red,
          ),
        );
        if (response.success) {
          _loadCategorias();
        }
      }
    }
  }

  Future<void> _toggleActivaCategoria(int id, bool activa) async {
    final response = await _categoriasService.toggleActivaCategoria(
      id,
      !activa,
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Estado actualizado'),
          backgroundColor: response.success ? Colors.green : Colors.red,
        ),
      );
      if (response.success) {
        _loadCategorias();
      }
    }
  }

  void _showCategoriaDialog({Categoria? categoria}) {
    final nombreController = TextEditingController(
      text: categoria?.nombre ?? '',
    );
    final descripcionController = TextEditingController(
      text: categoria?.descripcion ?? '',
    );
    bool activa = categoria?.activa ?? true;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            categoria == null ? 'Nueva Categoría' : 'Editar Categoría',
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nombreController,
                  decoration: const InputDecoration(
                    labelText: 'Nombre *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descripcionController,
                  decoration: const InputDecoration(
                    labelText: 'Descripción',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  title: const Text('Activa'),
                  value: activa,
                  onChanged: (value) {
                    setDialogState(() {
                      activa = value;
                    });
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nombreController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('El nombre es requerido')),
                  );
                  return;
                }

                final nuevaCategoria = Categoria(
                  id: categoria?.id ?? 0,
                  nombre: nombreController.text,
                  descripcion: descripcionController.text.isEmpty
                      ? null
                      : descripcionController.text,
                  activa: activa,
                  fechaCreacion: categoria?.fechaCreacion ?? DateTime.now(),
                );

                final response = categoria == null
                    ? await _categoriasService.createCategoria(nuevaCategoria)
                    : await _categoriasService.updateCategoria(
                        categoria.id,
                        nuevaCategoria,
                      );

                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(response.message ?? 'Operación completada'),
                      backgroundColor: response.success
                          ? Colors.green
                          : Colors.red,
                    ),
                  );
                  if (response.success) {
                    _loadCategorias();
                  }
                }
              },
              child: Text(categoria == null ? 'Crear' : 'Actualizar'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categorías'),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCategorias,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/categorias'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar categorías...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
                _loadCategorias();
              },
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCategoriaDialog(),
        backgroundColor: Colors.blue,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCategorias,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_categorias.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.category_outlined,
              size: 100,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 20),
            const Text(
              'No hay categorías',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => _showCategoriaDialog(),
              icon: const Icon(Icons.add),
              label: const Text('Crear Primera Categoría'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _categorias.length,
      padding: const EdgeInsets.all(8),
      itemBuilder: (context, index) {
        final categoria = _categorias[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: categoria.activa ? Colors.green : Colors.grey,
              child: const Icon(Icons.category, color: Colors.white),
            ),
            title: Text(
              categoria.nombre,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (categoria.descripcion != null &&
                    categoria.descripcion!.isNotEmpty)
                  Text(categoria.descripcion!),
                Text(
                  'Estado: ${categoria.activa ? "Activa" : "Inactiva"}',
                  style: TextStyle(
                    color: categoria.activa ? Colors.green : Colors.red,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            trailing: PopupMenuButton(
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'editar',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 20),
                      SizedBox(width: 8),
                      Text('Editar'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'toggle',
                  child: Row(
                    children: [
                      Icon(
                        categoria.activa ? Icons.block : Icons.check_circle,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(categoria.activa ? 'Desactivar' : 'Activar'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'eliminar',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 20, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Eliminar', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                switch (value) {
                  case 'editar':
                    _showCategoriaDialog(categoria: categoria);
                    break;
                  case 'toggle':
                    _toggleActivaCategoria(categoria.id, categoria.activa);
                    break;
                  case 'eliminar':
                    _eliminarCategoria(categoria.id);
                    break;
                }
              },
            ),
          ),
        );
      },
    );
  }
}
