import 'package:flutter/material.dart';
import '../../services/productos_service.dart';
import '../../services/comparacion_service.dart';
import '../../services/carrito_service.dart';
import '../../utils/image_helper.dart';

class ProductoComparacionScreen extends StatefulWidget {
  const ProductoComparacionScreen({super.key});

  @override
  State<ProductoComparacionScreen> createState() =>
      _ProductoComparacionScreenState();
}

class _ProductoComparacionScreenState extends State<ProductoComparacionScreen> {
  final ComparacionService _comparacionService = ComparacionService();
  final ProductosService _productosService = ProductosService();
  final CarritoService _carritoService = CarritoService();

  List<Producto> _productos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarProductos();
  }

  Future<void> _cargarProductos() async {
    setState(() => _isLoading = true);
    try {
      final productos = await _comparacionService.getProductosCompletos(
        _productosService,
      );
      setState(() {
        _productos = productos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar productos: $e')),
        );
      }
    }
  }

  Future<void> _eliminarProducto(int productoId) async {
    await _comparacionService.eliminarProducto(productoId);
    _cargarProductos();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Producto eliminado de la comparación'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _agregarAlCarrito(Producto producto) async {
    try {
      await _carritoService.agregarItem(producto.id, 1);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${producto.nombre} agregado al carrito'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Comparar Productos'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          if (_productos.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Limpiar comparación'),
                    content: const Text(
                      '¿Deseas eliminar todos los productos de la comparación?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancelar'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text(
                          'Limpiar',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await _comparacionService.limpiarComparacion();
                  _cargarProductos();
                }
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _productos.isEmpty
          ? _buildEmptyState()
          : _buildComparacionTable(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.compare_arrows, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No hay productos para comparar',
            style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Text(
            'Agrega hasta 3 productos para compararlos',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.shopping_bag),
            label: const Text('Explorar Productos'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparacionTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(Colors.blue.shade50),
          columns: [
            const DataColumn(
              label: Text(
                'Característica',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            ..._productos.map(
              (p) => DataColumn(
                label: SizedBox(
                  width: 150,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Imagen
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _buildProductImage(p),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Nombre
                      Text(
                        p.nombre,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      // Botón eliminar
                      IconButton(
                        icon: const Icon(
                          Icons.close,
                          size: 18,
                          color: Colors.red,
                        ),
                        onPressed: () => _eliminarProducto(p.id),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          rows: _buildComparisonRows(),
        ),
      ),
    );
  }

  Widget _buildProductImage(Producto producto) {
    String? imagenUrl;
    if (producto.imagenes.isNotEmpty) {
      final imagenPrincipal = producto.imagenes.firstWhere(
        (img) => img.esPrincipal,
        orElse: () => producto.imagenes.first,
      );
      imagenUrl = ImageHelper.buildImageUrl(imagenPrincipal.imagen);
    } else if (producto.imagen != null && producto.imagen!.isNotEmpty) {
      imagenUrl = ImageHelper.buildImageUrl(producto.imagen);
    }

    if (imagenUrl != null && imagenUrl.isNotEmpty) {
      return Image.network(
        imagenUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) =>
            const Icon(Icons.image, color: Colors.grey),
      );
    }
    return const Icon(Icons.image, color: Colors.grey);
  }

  List<DataRow> _buildComparisonRows() {
    return [
      _buildRow(
        'Precio',
        _productos
            .map((p) => 'Bs. ${p.precioFinal.toStringAsFixed(2)}')
            .toList(),
      ),
      _buildRow(
        'Precio Original',
        _productos
            .map(
              (p) => p.enOferta && p.precioOferta != null
                  ? 'Bs. ${p.precio.toStringAsFixed(2)}'
                  : '-',
            )
            .toList(),
      ),
      _buildRow(
        'Descuento',
        _productos
            .map(
              (p) => p.enOferta && p.descuentoPorcentaje != null
                  ? '${p.descuentoPorcentaje}%'
                  : '-',
            )
            .toList(),
      ),
      _buildRow(
        'Stock',
        _productos
            .map((p) => p.stock > 0 ? '${p.stock} unidades' : 'Sin stock')
            .toList(),
      ),
      _buildRow(
        'Categoría',
        _productos.map((p) => p.categoriaNombre ?? '-').toList(),
      ),
      _buildRow('Marca', _productos.map((p) => p.marca ?? '-').toList()),
      _buildRow('Modelo', _productos.map((p) => p.modelo ?? '-').toList()),
      _buildRow('SKU', _productos.map((p) => p.sku ?? '-').toList()),
      _buildRow('Ventas', _productos.map((p) => '${p.ventas}').toList()),
      _buildRow('Vistas', _productos.map((p) => '${p.vistas}').toList()),
      _buildRow(
        'Estado',
        _productos
            .map((p) => p.activo ? 'Disponible' : 'No disponible')
            .toList(),
      ),
      _buildActionRow(),
    ];
  }

  DataRow _buildRow(String label, List<String> values) {
    return DataRow(
      cells: [
        DataCell(
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        ...values.map(
          (value) => DataCell(
            SizedBox(
              width: 150,
              child: Text(
                value,
                style: TextStyle(
                  color: value == 'Sin stock'
                      ? Colors.red
                      : (label == 'Precio' ? Colors.blue : null),
                  fontWeight: label == 'Precio' ? FontWeight.bold : null,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ],
    );
  }

  DataRow _buildActionRow() {
    return DataRow(
      cells: [
        const DataCell(
          Text('Acciones', style: TextStyle(fontWeight: FontWeight.w600)),
        ),
        ..._productos.map(
          (p) => DataCell(
            SizedBox(
              width: 150,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton.icon(
                    onPressed: () => _agregarAlCarrito(p),
                    icon: const Icon(Icons.add_shopping_cart, size: 16),
                    label: const Text(
                      'Carrito',
                      style: TextStyle(fontSize: 12),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
