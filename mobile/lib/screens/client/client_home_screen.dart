import 'package:flutter/material.dart';
import 'tabs/home_tab.dart';
import 'tabs/products_tab.dart';
import 'tabs/cart_tab.dart';
import 'tabs/orders_tab.dart';
import 'tabs/profile_tab.dart';
import 'producto_comparacion_screen.dart';
import '../../services/comparacion_service.dart';

class ClientHomeScreen extends StatefulWidget {
  final int? initialTabIndex;

  const ClientHomeScreen({super.key, this.initialTabIndex});

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  late int _currentIndex;
  final GlobalKey _cartTabKey = GlobalKey();
  final GlobalKey _ordersTabKey = GlobalKey();
  final ComparacionService _comparacionService = ComparacionService();
  int _productosComparacionCount = 0;

  List<Widget> get _tabs => [
    const HomeTab(),
    const ProductsTab(),
    CartTab(
      key: _cartTabKey,
      onVisible: () {
        // Recargar carrito cuando el tab se vuelve visible
        final state = _cartTabKey.currentState;
        if (state != null && state is CartTabState) {
          state.recargarCarrito();
        }
      },
    ),
    OrdersTab(
      key: _ordersTabKey,
      onVisible: () {
        // Recargar pedidos cuando el tab se vuelve visible
        final state = _ordersTabKey.currentState;
        if (state != null && state is OrdersTabState) {
          state.recargarPedidos();
        }
      },
    ),
    const ProfileTab(),
  ];

  final List<String> _titles = const [
    'Inicio',
    'Productos',
    'Carrito',
    'Pedidos',
    'Perfil',
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex ?? 0;
    _cargarCantidadComparacion();
    // Si se especifica un tab inicial, recargar ese tab después de un delay
    if (widget.initialTabIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (widget.initialTabIndex == 2) {
          Future.delayed(const Duration(milliseconds: 100), () {
            final state = _cartTabKey.currentState;
            if (state != null && state is CartTabState) {
              state.recargarCarrito();
            }
          });
        } else if (widget.initialTabIndex == 3) {
          Future.delayed(const Duration(milliseconds: 100), () {
            final state = _ordersTabKey.currentState;
            if (state != null && state is OrdersTabState) {
              state.recargarPedidos();
            }
          });
        }
      });
    }
  }

  Future<void> _cargarCantidadComparacion() async {
    final cantidad = await _comparacionService.getCantidad();
    if (mounted) {
      setState(() => _productosComparacionCount = cantidad);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.shopping_bag, size: 28),
            const SizedBox(width: 8),
            Text(_titles[_currentIndex]),
          ],
        ),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_currentIndex == 1) // Solo en tab de productos
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.compare_arrows),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ProductoComparacionScreen(),
                      ),
                    );
                    _cargarCantidadComparacion();
                  },
                ),
                if (_productosComparacionCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '$_productosComparacionCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
          if (_currentIndex == 0 || _currentIndex == 1)
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Búsqueda - Próximamente'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
          if (_currentIndex == 0 || _currentIndex == 1)
            IconButton(
              icon: const Icon(Icons.shopping_cart),
              onPressed: () {
                setState(() {
                  _currentIndex = 2;
                });
                // Recargar carrito cuando se navega desde el botón
                Future.delayed(const Duration(milliseconds: 100), () {
                  final state = _cartTabKey.currentState;
                  if (state != null && state is CartTabState) {
                    state.recargarCarrito();
                  }
                });
              },
            ),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: _tabs),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
            // Recargar carrito cuando se navega al tab del carrito
            if (index == 2) {
              Future.delayed(const Duration(milliseconds: 100), () {
                final state = _cartTabKey.currentState;
                if (state != null && state is CartTabState) {
                  state.recargarCarrito();
                }
              });
            }
            // Recargar pedidos cuando se navega al tab de pedidos
            if (index == 3) {
              // Usar un delay más largo para asegurar que el widget esté completamente construido
              Future.delayed(const Duration(milliseconds: 200), () {
                final state = _ordersTabKey.currentState;
                if (state != null && state is OrdersTabState) {
                  print('[CLIENT_HOME] Recargando pedidos desde navegación...');
                  state.recargarPedidos();
                } else {
                  print(
                    '[CLIENT_HOME] ⚠️ No se pudo obtener el estado de OrdersTab',
                  );
                }
              });
            }
            // Recargar cantidad de comparación cuando se navega al tab de productos
            if (index == 1) {
              _cargarCantidadComparacion();
            }
          },
          type: BottomNavigationBarType.fixed,
          selectedItemColor: Colors.blue,
          unselectedItemColor: Colors.grey,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view),
              label: 'Productos',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shopping_cart_outlined),
              activeIcon: Icon(Icons.shopping_cart),
              label: 'Carrito',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined),
              activeIcon: Icon(Icons.receipt_long),
              label: 'Pedidos',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Perfil',
            ),
          ],
        ),
      ),
    );
  }
}
