import 'package:flutter/material.dart';
import '../../../services/producto_admin_service.dart';
import 'producto_form_screen.dart';
import '../admin_drawer.dart';

class ProductosListScreen extends StatefulWidget {
  const ProductosListScreen({super.key});

  @override
  State<ProductosListScreen> createState() => _ProductosListScreenState();
}

class _ProductosListScreenState extends State<ProductosListScreen> {
  final ProductoAdminService _productoService = ProductoAdminService();

  List<Producto> _productos = [];
  List<Categoria> _categorias = [];
  bool _isLoading = true;
  String? _error;

  // Filtros
  String _searchQuery = '';
  int? _selectedCategoriaId;
  bool? _filterActivo;
  bool? _filterDestacado;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Cargar categorías primero
      final categoriasResponse = await _productoService.getCategorias();
      if (categoriasResponse.success && categoriasResponse.data != null) {
        _categorias = categoriasResponse.data!;
      }

      // Cargar productos con filtros
      final response = await _productoService.getProductos(
        categoria: _selectedCategoriaId?.toString(),
        activo: _filterActivo,
        destacado: _filterDestacado,
        busqueda: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (response.success && response.data != null) {
        _productos = response.data!;
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

  Future<void> _loadProductos() async {
    final response = await _productoService.getProductos(
      categoria: _selectedCategoriaId?.toString(),
      activo: _filterActivo,
      destacado: _filterDestacado,
      busqueda: _searchQuery.isNotEmpty ? _searchQuery : null,
    );

    if (response.success && response.data != null) {
      setState(() {
        _productos = response.data!;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Error al cargar productos';
      });
    }
  }

  Future<void> _eliminarProducto(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Eliminación'),
        content: const Text('¿Estás seguro de eliminar este producto?'),
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
      final response = await _productoService.eliminarProducto(id);
      if (mounted) {
        if (response.success) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Producto eliminado')));
          _loadProductos();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Error al eliminar')),
          );
        }
      }
    }
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filtros'),
        content: StatefulBuilder(
          builder: (context, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Filtro por categoría
              DropdownButtonFormField<int?>(
                value: _selectedCategoriaId,
                decoration: const InputDecoration(
                  labelText: 'Categoría',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Todas')),
                  ..._categorias.map(
                    (cat) => DropdownMenuItem(
                      value: cat.id,
                      child: Text(cat.nombre),
                    ),
                  ),
                ],
                onChanged: (value) {
                  setDialogState(() {
                    _selectedCategoriaId = value;
                  });
                },
              ),
              const SizedBox(height: 16),

              // Filtro Activo
              CheckboxListTile(
                title: const Text('Solo Activos'),
                value: _filterActivo ?? false,
                tristate: true,
                onChanged: (value) {
                  setDialogState(() {
                    _filterActivo = value;
                  });
                },
              ),

              // Filtro Destacado
              CheckboxListTile(
                title: const Text('Solo Destacados'),
                value: _filterDestacado ?? false,
                tristate: true,
                onChanged: (value) {
                  setDialogState(() {
                    _filterDestacado = value;
                  });
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedCategoriaId = null;
                _filterActivo = null;
                _filterDestacado = null;
              });
              Navigator.pop(context);
              _loadProductos();
            },
            child: const Text('Limpiar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _loadProductos();
            },
            child: const Text('Aplicar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/productos'),
      appBar: AppBar(
        title: const Text('Productos'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.filter_list),
                if (_selectedCategoriaId != null ||
                    _filterActivo != null ||
                    _filterDestacado != null)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 8,
                        minHeight: 8,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: _showFilterDialog,
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar productos...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
                _loadProductos();
              },
            ),
          ),
        ),
      ),
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
                    onPressed: _loadData,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reintentar'),
                  ),
                ],
              ),
            )
          : _productos.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.inventory_2_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No hay productos',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () => _navigateToForm(),
                    icon: const Icon(Icons.add),
                    label: const Text('Agregar Producto'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView.builder(
                itemCount: _productos.length,
                itemBuilder: (context, index) {
                  final producto = _productos[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    child: ListTile(
                      leading: producto.imagen != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                producto.imagen!,
                                width: 60,
                                height: 60,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 60,
                                    height: 60,
                                    color: Colors.grey[300],
                                    child: const Icon(
                                      Icons.image_not_supported,
                                    ),
                                  );
                                },
                              ),
                            )
                          : Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: Colors.grey[300],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.inventory_2),
                            ),
                      title: Text(
                        producto.nombre,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(producto.categoria),
                          Text(
                            'Bs. ${producto.precio.toStringAsFixed(2)} • Stock: ${producto.stock}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Row(
                            children: [
                              if (producto.activo)
                                Chip(
                                  label: const Text(
                                    'Activo',
                                    style: TextStyle(fontSize: 10),
                                  ),
                                  backgroundColor: Colors.green[100],
                                  padding: EdgeInsets.zero,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              const SizedBox(width: 4),
                              if (producto.destacado)
                                Chip(
                                  label: const Text(
                                    'Destacado',
                                    style: TextStyle(fontSize: 10),
                                  ),
                                  backgroundColor: Colors.amber[100],
                                  padding: EdgeInsets.zero,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                            ],
                          ),
                        ],
                      ),
                      isThreeLine: true,
                      trailing: PopupMenuButton(
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit, size: 18),
                                SizedBox(width: 8),
                                Text('Editar'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete, size: 18, color: Colors.red),
                                SizedBox(width: 8),
                                Text(
                                  'Eliminar',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ],
                            ),
                          ),
                        ],
                        onSelected: (value) {
                          if (value == 'edit') {
                            _navigateToForm(producto: producto);
                          } else if (value == 'delete') {
                            _eliminarProducto(producto.id);
                          }
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToForm(),
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Producto'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
    );
  }

  void _navigateToForm({Producto? producto}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ProductoFormScreen(producto: producto, categorias: _categorias),
      ),
    );

    if (result == true) {
      _loadProductos();
    }
  }
}
