import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import '../../../services/productos_service.dart';
import '../../../services/carrito_service.dart';
import '../../../services/favoritos_service.dart';
import '../../../services/comparacion_service.dart';
import '../barcode_scanner_screen.dart';

class ProductsTab extends StatefulWidget {
  const ProductsTab({super.key});

  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> {
  final ProductosService _productosService = ProductosService();
  final CarritoService _carritoService = CarritoService();
  final FavoritosService _favoritosService = FavoritosService();
  final ComparacionService _comparacionService = ComparacionService();

  final TextEditingController _searchController = TextEditingController();
  List<Categoria> _categorias = [];
  List<Producto> _productos = [];
  List<int> _favoritos = [];
  List<int> _productosComparacion = [];
  List<String> _historialBusquedas = [];
  List<Map<String, dynamic>> _filtrosGuardados = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _selectedCategoryId;
  String? _nextPage;
  int _currentPage = 1;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _cargarDatos();
    _cargarFavoritos();
    _cargarProductosComparacion();
    _cargarHistorialBusquedas();
    _cargarFiltrosGuardados();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _cargarHistorialBusquedas() async {
    final historial = await _productosService.getBusquedasRecientes();
    if (mounted) {
      setState(() => _historialBusquedas = historial);
    }
  }

  Future<void> _cargarFiltrosGuardados() async {
    final filtros = await _productosService.getFiltrosGuardados();
    if (mounted) {
      setState(() => _filtrosGuardados = filtros);
    }
  }

  Future<void> _guardarFiltroActual() async {
    await _productosService.guardarFiltro(
      categoriaId: _selectedCategoryId,
    );
    await _cargarFiltrosGuardados();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Filtro guardado'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _aplicarFiltroGuardado(Map<String, dynamic> filtro) async {
    setState(() {
      _selectedCategoryId = filtro['categoriaId']?.toString();
    });
    await _cargarDatos();
  }

  Future<void> _cargarProductosComparacion() async {
    final productos = await _comparacionService.getProductosComparacion();
    setState(() => _productosComparacion = productos);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _nextPage != null) {
        _cargarMasProductos();
      }
    }
  }

  Future<void> _cargarDatos() async {
    setState(() => _isLoading = true);
    try {
      final categorias = await _productosService.getCategorias();
      ProductosService.setCategoriasCache(categorias);
      final response = await _productosService.getProductos(
        page: 1,
        categoriaId: _selectedCategoryId,
        search: _searchController.text.isNotEmpty
            ? _searchController.text
            : null,
      );

      setState(() {
        _categorias = categorias;
        _productos = response.results;
        _nextPage = response.next;
        _currentPage = 1;
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

  Future<void> _cargarMasProductos() async {
    if (_isLoadingMore) return;

    setState(() => _isLoadingMore = true);
    try {
      final response = await _productosService.getProductos(
        page: _currentPage + 1,
        categoriaId: _selectedCategoryId,
        search: _searchController.text.isNotEmpty
            ? _searchController.text
            : null,
      );

      setState(() {
        _productos.addAll(response.results);
        _nextPage = response.next;
        _currentPage++;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _cargarFavoritos() async {
    try {
      final favoritos = await _favoritosService.getFavoritos();
      setState(() => _favoritos = favoritos);
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _toggleFavorito(int productoId) async {
    try {
      final nuevoEstado = await _favoritosService.toggleFavorito(productoId);
      await _cargarFavoritos();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              nuevoEstado ? 'Agregado a favoritos' : 'Eliminado de favoritos',
            ),
            backgroundColor: nuevoEstado ? Colors.red : Colors.grey,
            duration: const Duration(seconds: 1),
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

  Future<void> _toggleComparacion(Producto producto) async {
    try {
      final estaEnComparacion = _productosComparacion.contains(producto.id);

      if (estaEnComparacion) {
        await _comparacionService.eliminarProducto(producto.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Producto eliminado de la comparación'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        final puedeAgregar = await _comparacionService.puedeAgregar();
        if (!puedeAgregar) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Máximo 3 productos para comparar'),
                backgroundColor: Colors.orange,
                duration: Duration(seconds: 2),
              ),
            );
          }
          return;
        }

        final agregado = await _comparacionService.agregarProducto(producto.id);
        if (agregado && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${producto.nombre} agregado a comparación'),
              backgroundColor: Colors.blue,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }

      _cargarProductosComparacion();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _buscar() async {
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      await _productosService.guardarBusqueda(query);
      await _cargarHistorialBusquedas();
    }
    _cargarDatos();
  }

  Future<void> _abrirEscanner() async {
    final producto = await Navigator.push<Producto>(
      context,
      MaterialPageRoute(
        builder: (context) => const BarcodeScannerScreen(),
      ),
    );

    if (producto != null && mounted) {
      _showProductDetails(producto);
    }
  }

  Future<void> _compartirProducto(Producto producto) async {
    try {
      final baseUrl = _productosService.getBaseUrl();
      final link = '$baseUrl/productos/${producto.slug}';
      final precio = producto.precioOferta ?? producto.precio;
      final texto = 'Mira este producto: ${producto.nombre}\n'
          'Precio: Bs. ${precio.toStringAsFixed(2)}\n'
          '$link';
      
      await Share.share(
        texto,
        subject: producto.nombre,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al compartir: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Barra de búsqueda
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.blue.shade50,
          child: Column(
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Buscar productos...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_searchController.text.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            _buscar();
                          },
                        ),
                      IconButton(
                        icon: const Icon(Icons.qr_code_scanner),
                        onPressed: _abrirEscanner,
                        tooltip: 'Escanear código',
                      ),
                    ],
                  ),
                ),
                onSubmitted: (_) => _buscar(),
                onChanged: (value) {
                  setState(() {});
                },
              ),
              // Historial de búsquedas
              if (_historialBusquedas.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      ..._historialBusquedas.map((busqueda) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ActionChip(
                              label: Text(busqueda),
                              onPressed: () {
                                _searchController.text = busqueda;
                                _buscar();
                              },
                              avatar: const Icon(Icons.history, size: 16),
                            ),
                          )),
                      ActionChip(
                        label: const Text('Limpiar'),
                        onPressed: () async {
                          await _productosService.limpiarHistorial();
                          await _cargarHistorialBusquedas();
                        },
                        avatar: const Icon(Icons.clear_all, size: 16),
                        backgroundColor: Colors.grey.shade300,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),

        // Filtros guardados
        if (_filtrosGuardados.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8, bottom: 4),
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      ..._filtrosGuardados.asMap().entries.map((entry) {
                        final index = entry.key;
                        final filtro = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onLongPress: () async {
                              await _productosService.eliminarFiltro(index);
                              await _cargarFiltrosGuardados();
                            },
                            child: ActionChip(
                              label: Text(filtro['nombre'] ?? 'Filtro'),
                              onPressed: () => _aplicarFiltroGuardado(filtro),
                              avatar: const Icon(Icons.bookmark, size: 16),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                if (_selectedCategoryId != null)
                  IconButton(
                    icon: const Icon(Icons.bookmark_add),
                    onPressed: _guardarFiltroActual,
                    tooltip: 'Guardar filtro actual',
                  ),
              ],
            ),
          ),

        // Filtro de categorías
        if (_categorias.isNotEmpty)
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categorias.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: const Text('Todos'),
                      selected: _selectedCategoryId == null,
                      onSelected: (selected) {
                        setState(() {
                          _selectedCategoryId = null;
                        });
                        _cargarDatos();
                      },
                      selectedColor: Colors.blue,
                      backgroundColor: Colors.grey.shade200,
                      labelStyle: TextStyle(
                        color: _selectedCategoryId == null
                            ? Colors.white
                            : Colors.black87,
                        fontWeight: _selectedCategoryId == null
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  );
                }

                final categoria = _categorias[index - 1];
                final isSelected =
                    _selectedCategoryId == categoria.id.toString();

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(categoria.nombre),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategoryId = selected
                            ? categoria.id.toString()
                            : null;
                      });
                      _cargarDatos();
                    },
                    selectedColor: Colors.blue,
                    backgroundColor: Colors.grey.shade200,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),

        // Grid de productos
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _productos.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_bag_outlined,
                        size: 80,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No se encontraron productos',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _cargarDatos,
                  child: GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio:
                              0.68, // Ajustado para evitar overflow
                        ),
                    itemCount: _productos.length + (_isLoadingMore ? 2 : 0),
                    itemBuilder: (context, index) {
                      if (index >= _productos.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      return _buildProductCard(_productos[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildProductCard(Producto producto) {
    // Prioridad: imagenes con esPrincipal > primera imagen > producto.imagen
    String? imagenUrl;
    if (producto.imagenes.isNotEmpty) {
      final imagenPrincipal = producto.imagenes.firstWhere(
        (img) => img.esPrincipal,
        orElse: () => producto.imagenes.first,
      );
      imagenUrl = imagenPrincipal.imagen;
    } else if (producto.imagen != null && producto.imagen!.isNotEmpty) {
      imagenUrl = producto.imagen;
    }

    final esFavorito = _favoritos.contains(producto.id);
    final estaEnComparacion = _productosComparacion.contains(producto.id);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: InkWell(
          onTap: () => _showProductDetails(producto),
          borderRadius: BorderRadius.circular(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Imagen del producto
              Expanded(
                flex: 3,
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(20),
                        ),
                      ),
                      child: imagenUrl != null && imagenUrl.isNotEmpty
                          ? ClipRRect(
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(20),
                              ),
                              child: Image.network(
                                imagenUrl,
                                width: double.infinity,
                                height: double.infinity,
                                fit: BoxFit.cover,
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return Center(
                                        child: CircularProgressIndicator(
                                          value:
                                              loadingProgress
                                                      .expectedTotalBytes !=
                                                  null
                                              ? loadingProgress
                                                        .cumulativeBytesLoaded /
                                                    loadingProgress
                                                        .expectedTotalBytes!
                                              : null,
                                        ),
                                      );
                                    },
                                errorBuilder: (context, error, stackTrace) {
                                  return const Center(
                                    child: Icon(
                                      Icons.image,
                                      size: 48,
                                      color: Colors.grey,
                                    ),
                                  );
                                },
                              ),
                            )
                          : const Center(
                              child: Icon(
                                Icons.image,
                                size: 48,
                                color: Colors.grey,
                              ),
                            ),
                    ),
                    // Badge de descuento
                    if (producto.enOferta && producto.precioOferta != null)
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.red.shade600,
                                Colors.orange.shade600,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.red.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            '-${((1 - (producto.precioOferta! / producto.precio)) * 100).toStringAsFixed(0)}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    // Botones de acción (comparar, favorito y compartir)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Botón de compartir
                          InkWell(
                            onTap: () => _compartirProducto(producto),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.share,
                                size: 18,
                                color: Colors.green,
                              ),
                            ),
                          ),
                          // Botón de comparar
                          InkWell(
                            onTap: () => _toggleComparacion(producto),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: estaEnComparacion
                                    ? Colors.blue
                                    : Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                Icons.compare_arrows,
                                size: 18,
                                color: estaEnComparacion
                                    ? Colors.white
                                    : Colors.blue,
                              ),
                            ),
                          ),
                          // Botón de favorito
                          InkWell(
                            onTap: () => _toggleFavorito(producto.id),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                esFavorito
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                size: 18,
                                color: Colors.red,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Información del producto
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          producto.nombre,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: Colors.black87,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.inventory_2,
                            size: 11,
                            color: Colors.blue,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              'Stock: ${producto.stock}',
                              style: TextStyle(
                                fontSize: 10,
                                color: producto.stock > 0
                                    ? Colors.green.shade600
                                    : Colors.red.shade600,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (producto.enOferta &&
                                    producto.precioOferta != null)
                                  Text(
                                    'Bs. ${producto.precio.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontSize: 9,
                                      decoration: TextDecoration.lineThrough,
                                      color: Colors.grey,
                                    ),
                                  ),
                                Text(
                                  'Bs. ${(producto.precioOferta ?? producto.precio).toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: Colors.blue.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: () => _agregarAlCarrito(producto),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.blue.shade600,
                                    Colors.purple.shade600,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.add_shopping_cart,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showProductDetails(Producto producto) {
    // Prioridad: imagenes con esPrincipal > primera imagen > producto.imagen
    String? imagenUrl;
    if (producto.imagenes.isNotEmpty) {
      final imagenPrincipal = producto.imagenes.firstWhere(
        (img) => img.esPrincipal,
        orElse: () => producto.imagenes.first,
      );
      imagenUrl = imagenPrincipal.imagen;
    } else if (producto.imagen != null && producto.imagen!.isNotEmpty) {
      imagenUrl = producto.imagen;
    }
    final esFavorito = _favoritos.contains(producto.id);
    final estaEnComparacion = _productosComparacion.contains(producto.id);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: GestureDetector(
                    onTap: () => _mostrarGaleriaImagenes(producto, 0),
                    child: Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: imagenUrl != null && imagenUrl.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.network(
                                    imagenUrl,
                                    fit: BoxFit.contain,
                                    loadingBuilder:
                                        (context, child, loadingProgress) {
                                          if (loadingProgress == null) return child;
                                          return Center(
                                            child: CircularProgressIndicator(
                                              value:
                                                  loadingProgress
                                                          .expectedTotalBytes !=
                                                      null
                                                  ? loadingProgress
                                                            .cumulativeBytesLoaded /
                                                        loadingProgress
                                                            .expectedTotalBytes!
                                                  : null,
                                            ),
                                          );
                                        },
                                    errorBuilder: (context, error, stackTrace) {
                                      return const Icon(
                                        Icons.image,
                                        size: 80,
                                        color: Colors.grey,
                                      );
                                    },
                                  ),
                                  if (producto.imagenes.length > 1)
                                    Positioned(
                                      bottom: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.6),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '${producto.imagenes.length} imágenes',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            )
                          : const Icon(Icons.image, size: 80, color: Colors.grey),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        producto.nombre,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.share),
                          onPressed: () => _compartirProducto(producto),
                          tooltip: 'Compartir',
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.compare_arrows,
                            color: estaEnComparacion
                                ? Colors.blue
                                : Colors.grey,
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                            _toggleComparacion(producto);
                          },
                          tooltip: 'Comparar',
                        ),
                        IconButton(
                          icon: Icon(
                            esFavorito ? Icons.favorite : Icons.favorite_border,
                            color: Colors.red,
                          ),
                          onPressed: () => _toggleFavorito(producto.id),
                          tooltip: 'Favorito',
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.visibility,
                      color: Colors.grey.shade600,
                      size: 20,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${producto.vistas} vistas',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.shopping_cart,
                      color: Colors.grey.shade600,
                      size: 20,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${producto.ventas} ventas',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (producto.enOferta && producto.precioOferta != null) ...[
                      Text(
                        'Bs. ${producto.precio.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 18,
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      'Bs. ${(producto.precioOferta ?? producto.precio).toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Stock: ${producto.stock} unidades',
                  style: TextStyle(
                    fontSize: 14,
                    color: producto.stock > 0 ? Colors.green : Colors.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Descripción',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  producto.descripcion ?? 'Sin descripción disponible.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: producto.stock > 0
                        ? () {
                            Navigator.pop(context);
                            _agregarAlCarrito(producto);
                          }
                        : null,
                    icon: const Icon(Icons.shopping_cart),
                    label: Text(
                      producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _mostrarGaleriaImagenes(Producto producto, int initialIndex) {
    final imagenes = <String>[];
    
    if (producto.imagenes.isNotEmpty) {
      imagenes.addAll(producto.imagenes.map((img) => img.imagen));
    } else if (producto.imagen != null && producto.imagen!.isNotEmpty) {
      imagenes.add(producto.imagen!);
    }

    if (imagenes.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          body: PhotoViewGallery.builder(
            scrollPhysics: const BouncingScrollPhysics(),
            builder: (BuildContext context, int index) {
              return PhotoViewGalleryPageOptions(
                imageProvider: NetworkImage(imagenes[index]),
                initialScale: PhotoViewComputedScale.contained,
                minScale: PhotoViewComputedScale.contained,
                maxScale: PhotoViewComputedScale.covered * 2,
              );
            },
            itemCount: imagenes.length,
            loadingBuilder: (context, event) => Center(
              child: CircularProgressIndicator(
                value: event == null
                    ? 0
                    : event.cumulativeBytesLoaded / event.expectedTotalBytes!,
              ),
            ),
            pageController: PageController(initialPage: initialIndex),
          ),
        ),
      ),
    );
  }
}
