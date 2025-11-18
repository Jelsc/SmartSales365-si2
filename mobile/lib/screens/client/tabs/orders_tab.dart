import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/pedidos_service.dart';
import '../../../services/recordatorios_service.dart';

class OrdersTab extends StatefulWidget {
  final VoidCallback? onVisible;

  const OrdersTab({super.key, this.onVisible});

  @override
  State<OrdersTab> createState() => OrdersTabState();
}

class OrdersTabState extends State<OrdersTab>
    with AutomaticKeepAliveClientMixin {
  final PedidosService _pedidosService = PedidosService();
  final RecordatoriosService _recordatoriosService = RecordatoriosService();
  List<Pedido> _pedidos = [];
  bool _isLoading = true;
  String? _error;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _recordatoriosService.inicializar();
    _cargarPedidos();
  }

  // Método público para recargar desde fuera
  void recargarPedidos() {
    if (mounted) {
      print('[ORDERS_TAB] recargarPedidos() llamado, isLoading: $_isLoading');
      // Permitir recargar incluso si está cargando (para forzar actualización)
      _cargarPedidos();
    } else {
      print('[ORDERS_TAB] ⚠️ No se puede recargar: widget no está montado');
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Notificar que el tab está visible
    if (widget.onVisible != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onVisible?.call();
      });
    }
  }

  Future<void> _cargarPedidos() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      print('[ORDERS_TAB] Cargando pedidos...');
      final response = await _pedidosService.getMisPedidos();

      if (!mounted) return;

      print(
        '[ORDERS_TAB] Pedidos recibidos: ${response.count} total, ${response.results.length} en lista',
      );

      setState(() {
        _pedidos = response.results;
        _isLoading = false;
        _error = null;
      });

      if (response.results.isEmpty) {
        print('[ORDERS_TAB] ⚠️ No hay pedidos para mostrar');
      } else {
        // Programar recordatorios para pedidos pendientes
        _programarRecordatorios();
      }
    } catch (e) {
      print('[ORDERS_TAB] ❌ Error al cargar pedidos: $e');

      if (!mounted) return;

      String errorMessage = 'Error al cargar pedidos';
      if (e.toString().contains('Sesión expirada')) {
        errorMessage =
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (e.toString().contains('Tiempo de espera')) {
        errorMessage =
            'Tiempo de espera agotado. Verifica tu conexión a internet.';
      } else if (e.toString().contains('permisos')) {
        errorMessage = 'No tienes permisos para ver pedidos.';
      } else {
        errorMessage = e.toString().replaceFirst('Exception: ', '');
      }

      setState(() {
        _error = errorMessage;
        _isLoading = false;
      });
    }
  }

  Future<void> _programarRecordatorios() async {
    try {
      final pedidosPendientes = _pedidos
          .where((p) => p.estado == 'PENDIENTE' ||
              p.estado == 'CONFIRMADO' ||
              p.estado == 'EN_PROCESO')
          .map((p) => {
                'id': p.id,
                'numero_pedido': p.numeroPedido,
                'estado': p.estado,
              })
          .toList();

      if (pedidosPendientes.isNotEmpty) {
        await _recordatoriosService.programarRecordatorios(pedidosPendientes);
      } else {
        await _recordatoriosService.cancelarTodosRecordatorios();
      }
    } catch (e) {
      print('[ORDERS_TAB] Error programando recordatorios: $e');
    }
  }

  String _formatearFecha(String fechaStr) {
    try {
      final fecha = DateTime.parse(fechaStr);
      return DateFormat('dd MMM yyyy', 'es').format(fecha);
    } catch (e) {
      return fechaStr;
    }
  }

  Color _getEstadoColor(String estado) {
    switch (estado.toUpperCase()) {
      case 'ENTREGADO':
        return Colors.green;
      case 'ENVIADO':
      case 'EN_CAMINO':
        return Colors.blue;
      case 'PROCESANDO':
      case 'PAGADO':
        return Colors.orange;
      case 'CANCELADO':
        return Colors.red;
      case 'PENDIENTE':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getEstadoIcon(String estado) {
    switch (estado.toUpperCase()) {
      case 'ENTREGADO':
        return Icons.check_circle;
      case 'ENVIADO':
      case 'EN_CAMINO':
        return Icons.local_shipping;
      case 'PROCESANDO':
      case 'PAGADO':
        return Icons.pending;
      case 'CANCELADO':
        return Icons.cancel;
      case 'PENDIENTE':
        return Icons.schedule;
      default:
        return Icons.help;
    }
  }

  String _getEstadoTexto(String estado) {
    switch (estado.toUpperCase()) {
      case 'ENTREGADO':
        return 'Entregado';
      case 'ENVIADO':
        return 'En camino';
      case 'EN_CAMINO':
        return 'En camino';
      case 'PROCESANDO':
        return 'Procesando';
      case 'PAGADO':
        return 'Pagado';
      case 'CANCELADO':
        return 'Cancelado';
      case 'PENDIENTE':
        return 'Pendiente';
      default:
        return estado;
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Necesario para AutomaticKeepAliveClientMixin
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              'Error al cargar pedidos',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _cargarPedidos,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_pedidos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'No tienes pedidos',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tus pedidos aparecerán aquí',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _cargarPedidos,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _pedidos.length,
        itemBuilder: (context, index) {
          return _buildOrderCard(context, _pedidos[index]);
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, Pedido pedido) {
    final statusColor = _getEstadoColor(pedido.estado);
    final statusIcon = _getEstadoIcon(pedido.estado);
    final statusTexto = _getEstadoTexto(pedido.estado);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => _showOrderDetails(context, pedido),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(statusIcon, color: statusColor, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pedido #${pedido.numeroPedido}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatearFecha(pedido.creado),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.grey.shade400,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  statusTexto,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total',
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                  ),
                  Text(
                    'Bs. ${pedido.total.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showOrderDetails(BuildContext context, Pedido pedido) async {
    // Cargar detalles completos del pedido
    try {
      final pedidoCompleto = await _pedidosService.getPedido(pedido.id);
      if (!mounted) return;

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
                  Text(
                    'Pedido #${pedidoCompleto.numeroPedido}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Fecha: ${_formatearFecha(pedidoCompleto.creado)}',
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Productos',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  if (pedidoCompleto.items != null &&
                      pedidoCompleto.items!.isNotEmpty)
                    ...pedidoCompleto.items!.map(
                      (item) => _buildProductItem(
                        item.nombreProducto,
                        item.cantidad,
                        item.precioUnitario,
                      ),
                    )
                  else
                    const Text('No hay productos en este pedido'),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  _buildPriceRow('Subtotal', pedidoCompleto.subtotal),
                  if (pedidoCompleto.descuento > 0) ...[
                    const SizedBox(height: 8),
                    _buildPriceRow('Descuento', -pedidoCompleto.descuento),
                  ],
                  if (pedidoCompleto.costoEnvio > 0) ...[
                    const SizedBox(height: 8),
                    _buildPriceRow('Envío', pedidoCompleto.costoEnvio),
                  ],
                  const SizedBox(height: 16),
                  _buildPriceRow('Total', pedidoCompleto.total, isTotal: true),
                  const SizedBox(height: 24),
                  if (pedidoCompleto.estado.toUpperCase() == 'ENVIADO' ||
                      pedidoCompleto.estado.toUpperCase() == 'EN_CAMINO')
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Rastreando pedido...'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        icon: const Icon(Icons.location_on),
                        label: const Text('Rastrear Pedido'),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al cargar detalles: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildProductItem(String name, int quantity, double price) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.shopping_bag, color: Colors.blue, size: 30),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Cantidad: $quantity',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          Text(
            'Bs. ${(price * quantity).toStringAsFixed(2)}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          'Bs. ${amount.abs().toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: isTotal ? 20 : 14,
            fontWeight: FontWeight.bold,
            color: isTotal ? Colors.blue : Colors.black87,
          ),
        ),
      ],
    );
  }
}
