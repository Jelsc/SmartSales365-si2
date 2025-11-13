import 'package:flutter/material.dart';
import '../../../services/productos_service.dart';
import '../../../services/carrito_service.dart';
import '../../../services/comparacion_service.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final ProductosService _productosService = ProductosService();
  final CarritoService _carritoService = CarritoService();
  final ComparacionService _comparacionService = ComparacionService();

  List<Categoria> _categorias = [];
  List<Producto> _productosDestacados = [];
  List<Producto> _productosEnOferta = [];
  List<int> _productosComparacion = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
    _cargarProductosComparacion();
  }

  Future<void> _cargarProductosComparacion() async {
    final productos = await _comparacionService.getProductosComparacion();
    setState(() => _productosComparacion = productos);
  }

  Future<void> _cargarDatos() async {
    setState(() => _isLoading = true);
    try {
      final categorias = await _productosService.getCategorias();

      // Intentar obtener productos destacados
      var destacados = await _productosService.getProductosDestacados(limit: 4);

      // Si no hay destacados, obtener productos regulares
      if (destacados.isEmpty) {
        final response = await _productosService.getProductos(page: 1);
        destacados = response.results.take(4).toList();
      }

      // Intentar obtener productos en oferta
      var ofertas = await _productosService.getProductosEnOferta(limit: 4);

      // Si no hay ofertas, obtener otros productos regulares
      if (ofertas.isEmpty) {
        final response = await _productosService.getProductos(page: 1);
        ofertas = response.results.skip(4).take(4).toList();
      }

      setState(() {
        _categorias = categorias;
        _productosDestacados = destacados;
        _productosEnOferta = ofertas;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al cargar datos: $e')));
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _cargarDatos,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner principal
            _buildBanner(),
            const SizedBox(height: 24),

            // Categorías
            if (_categorias.isNotEmpty) ...[
              _buildCategorias(),
              const SizedBox(height: 24),
            ],

            // Productos en Oferta
            if (_productosEnOferta.isNotEmpty) ...[
              _buildSeccionProductos(
                titulo: 'Ofertas Especiales',
                productos: _productosEnOferta,
                icono: Icons.local_offer,
                color: Colors.red,
              ),
              const SizedBox(height: 24),
            ],

            // Productos Destacados
            if (_productosDestacados.isNotEmpty) ...[
              _buildSeccionProductos(
                titulo: 'Productos Destacados',
                productos: _productosDestacados,
                icono: Icons.star,
                color: Colors.amber,
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBanner() {
    return Container(
      margin: const EdgeInsets.all(16),
      constraints: const BoxConstraints(minHeight: 180),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade600, Colors.blue.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '¡Bienvenido a',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const Text(
                  'SmartSales365!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Compra los mejores productos',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    DefaultTabController.of(context).animateTo(1);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.blue,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Ver ofertas'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorias() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Categorías',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _categorias.length > 5 ? 5 : _categorias.length,
              itemBuilder: (context, index) {
                final categoria = _categorias[index];
                return _buildCategoryCard(categoria);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(Categoria categoria) {
    final colors = [
      Colors.purple,
      Colors.pink,
      Colors.orange,
      Colors.green,
      Colors.indigo,
    ];
    final icons = [
      Icons.phone_android,
      Icons.checkroom,
      Icons.home,
      Icons.sports_soccer,
      Icons.book,
    ];
    final color = colors[categoria.id % colors.length];
    final icon = icons[categoria.id % icons.length];

    return Container(
      width: 100,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 32, color: color),
          const SizedBox(height: 8),
          Text(
            categoria.nombre,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildSeccionProductos({
    required String titulo,
    required List<Producto> productos,
    required IconData icono,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Flexible(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icono, color: color, size: 24),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        titulo,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () {
                  DefaultTabController.of(context).animateTo(1);
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Ver todos', style: TextStyle(fontSize: 14)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.75, // Aumentado para dar más espacio vertical
            ),
            itemCount: productos.length,
            itemBuilder: (context, index) {
              return _buildProductCard(
                productos[index],
                isOferta: titulo == 'Ofertas Especiales',
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(Producto producto, {bool isOferta = false}) {
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

    final precioFinal = producto.precioOferta ?? producto.precio;
    final tieneDescuento = producto.enOferta && producto.precioOferta != null;
    final porcentajeDescuento = tieneDescuento
        ? ((1 - (producto.precioOferta! / producto.precio)) * 100)
              .toStringAsFixed(0)
        : null;
    final estaEnComparacion = _productosComparacion.contains(producto.id);

    return Card(
      elevation: isOferta ? 4 : 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isOferta
            ? BorderSide(color: Colors.red.shade200, width: 1.5)
            : BorderSide.none,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Imagen del producto
          Flexible(
            flex: 3,
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(minHeight: 120),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                  ),
                  child: imagenUrl != null && imagenUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                          child: Image.network(
                            imagenUrl,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Center(
                                child: CircularProgressIndicator(
                                  value:
                                      loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                            loadingProgress.expectedTotalBytes!
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
                // Badge de oferta mejorado
                if (tieneDescuento && porcentajeDescuento != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.red.shade600, Colors.red.shade400],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.local_offer,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '-$porcentajeDescuento%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Badge "OFERTA" para sección de ofertas especiales
                if (isOferta && !tieneDescuento)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade600,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'OFERTA',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                // Botón de comparar
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: InkWell(
                    onTap: () => _toggleComparacion(producto),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: estaEnComparacion ? Colors.blue : Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.compare_arrows,
                        size: 16,
                        color: estaEnComparacion ? Colors.white : Colors.blue,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Información del producto
          Flexible(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Nombre del producto
                  Flexible(
                    child: Text(
                      producto.nombre,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isOferta ? Colors.red.shade700 : Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Ventas
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.shopping_cart,
                        size: 12,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '${producto.ventas} ventas',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Precio y botón
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (tieneDescuento)
                              Text(
                                'Bs. ${producto.precio.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 9,
                                  decoration: TextDecoration.lineThrough,
                                  color: Colors.grey.shade500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            Text(
                              'Bs. ${precioFinal.toStringAsFixed(2)}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: isOferta
                                    ? Colors.red.shade600
                                    : Colors.blue,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 4),
                      Material(
                        color: isOferta
                            ? Colors.red.shade50
                            : Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                        child: InkWell(
                          onTap: () => _agregarAlCarrito(producto),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Icon(
                              Icons.add_shopping_cart,
                              size: 18,
                              color: isOferta
                                  ? Colors.red.shade600
                                  : Colors.blue,
                            ),
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
    );
  }
}
