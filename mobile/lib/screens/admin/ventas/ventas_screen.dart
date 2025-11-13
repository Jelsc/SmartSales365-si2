import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../admin_drawer.dart';
import '../../../services/pedidos_service.dart';

class VentasScreen extends StatefulWidget {
  const VentasScreen({super.key});

  @override
  State<VentasScreen> createState() => _VentasScreenState();
}

class _VentasScreenState extends State<VentasScreen> {
  final PedidosService _service = PedidosService();
  List<Pedido> _pedidos = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String? _estadoFiltro;

  final List<String> _estados = [
    'TODOS',
    'PENDIENTE',
    'PAGADO',
    'PROCESANDO',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
    'REEMBOLSADO',
  ];

  @override
  void initState() {
    super.initState();
    _cargarPedidos();
  }

  Future<void> _cargarPedidos() async {
    setState(() => _isLoading = true);
    try {
      final response = await _service.getPedidos(
        estado: _estadoFiltro == 'TODOS' ? null : _estadoFiltro,
        busqueda: _searchQuery.isNotEmpty ? _searchQuery : null,
      );
      setState(() {
        _isLoading = false;
        _pedidos = response.results;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al cargar pedidos: $e')));
      }
    }
  }

  String _formatearFecha(String fechaStr) {
    try {
      final fecha = DateTime.parse(fechaStr);
      return DateFormat('dd/MM/yyyy HH:mm').format(fecha);
    } catch (e) {
      return fechaStr;
    }
  }

  String _formatearMonto(double monto) {
    return 'Bs. ${monto.toStringAsFixed(2)}';
  }

  Color _getEstadoColor(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return Colors.orange;
      case 'PAGADO':
        return Colors.blue;
      case 'PROCESANDO':
        return Colors.purple;
      case 'ENVIADO':
        return Colors.teal;
      case 'ENTREGADO':
        return Colors.green;
      case 'CANCELADO':
        return Colors.red;
      case 'REEMBOLSADO':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getEstadoIcon(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return Icons.pending_actions;
      case 'PAGADO':
        return Icons.payment;
      case 'PROCESANDO':
        return Icons.sync;
      case 'ENVIADO':
        return Icons.local_shipping;
      case 'ENTREGADO':
        return Icons.check_circle;
      case 'CANCELADO':
        return Icons.cancel;
      case 'REEMBOLSADO':
        return Icons.money_off;
      default:
        return Icons.help_outline;
    }
  }

  void _mostrarDetallePedido(Pedido pedido) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DetallePedidoScreen(pedido: pedido),
      ),
    ).then((_) => _cargarPedidos());
  }

  void _mostrarFiltroEstados() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Filtrar por estado',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...(_estados.map((estado) {
              final isSelected =
                  _estadoFiltro == estado ||
                  (_estadoFiltro == null && estado == 'TODOS');
              return ListTile(
                leading: Icon(
                  estado == 'TODOS'
                      ? Icons.all_inclusive
                      : _getEstadoIcon(estado),
                  color: isSelected ? Colors.blue : null,
                ),
                title: Text(
                  estado == 'TODOS'
                      ? 'Todos'
                      : Pedido(
                          id: 0,
                          numeroPedido: '',
                          usuario: 0,
                          estado: estado,
                          subtotal: 0,
                          descuento: 0,
                          impuestos: 0,
                          costoEnvio: 0,
                          total: 0,
                          creado: DateTime.now().toIso8601String(),
                          actualizado: DateTime.now().toIso8601String(),
                        ).estadoTexto,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : null,
                    color: isSelected ? Colors.blue : null,
                  ),
                ),
                trailing: isSelected
                    ? const Icon(Icons.check, color: Colors.blue)
                    : null,
                onTap: () {
                  setState(() {
                    _estadoFiltro = estado == 'TODOS' ? null : estado;
                  });
                  Navigator.pop(context);
                  _cargarPedidos();
                },
              );
            }).toList()),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pedidosFiltrados = _pedidos.where((p) {
      if (_searchQuery.isEmpty) return true;
      return p.numeroPedido.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ventas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _mostrarFiltroEstados,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarPedidos,
          ),
        ],
      ),
      drawer: const AdminDrawer(currentRoute: '/admin/ventas'),
      body: Column(
        children: [
          // Barra de búsqueda
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar por número de pedido...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _estadoFiltro != null
                    ? Chip(
                        label: Text(
                          Pedido(
                            id: 0,
                            numeroPedido: '',
                            usuario: 0,
                            estado: _estadoFiltro!,
                            subtotal: 0,
                            descuento: 0,
                            impuestos: 0,
                            costoEnvio: 0,
                            total: 0,
                            creado: DateTime.now().toIso8601String(),
                            actualizado: DateTime.now().toIso8601String(),
                          ).estadoTexto,
                          style: const TextStyle(fontSize: 12),
                        ),
                        backgroundColor: _getEstadoColor(
                          _estadoFiltro!,
                        ).withOpacity(0.2),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () {
                          setState(() => _estadoFiltro = null);
                          _cargarPedidos();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
            ),
          ),

          // Lista de pedidos
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : pedidosFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_bag_outlined,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isEmpty && _estadoFiltro == null
                              ? 'No hay pedidos'
                              : 'No se encontraron resultados',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: pedidosFiltrados.length,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemBuilder: (context, index) {
                      final pedido = pedidosFiltrados[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => _mostrarDetallePedido(pedido),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        pedido.numeroPedido,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getEstadoColor(
                                          pedido.estado,
                                        ).withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            _getEstadoIcon(pedido.estado),
                                            size: 16,
                                            color: _getEstadoColor(
                                              pedido.estado,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            pedido.estadoTexto,
                                            style: TextStyle(
                                              color: _getEstadoColor(
                                                pedido.estado,
                                              ),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.calendar_today,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      _formatearFecha(pedido.creado),
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (pedido.totalItems != null)
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.shopping_cart,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${pedido.totalItems} ${pedido.totalItems == 1 ? 'item' : 'items'}',
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ],
                                      ),
                                    Text(
                                      _formatearMonto(pedido.total),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
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

// Pantalla de detalle del pedido
class DetallePedidoScreen extends StatefulWidget {
  final Pedido pedido;

  const DetallePedidoScreen({super.key, required this.pedido});

  @override
  State<DetallePedidoScreen> createState() => _DetallePedidoScreenState();
}

class _DetallePedidoScreenState extends State<DetallePedidoScreen> {
  final PedidosService _service = PedidosService();
  late Pedido _pedido;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _pedido = widget.pedido;
    _cargarDetalle();
  }

  Future<void> _cargarDetalle() async {
    setState(() => _isLoading = true);
    try {
      final pedido = await _service.getPedido(_pedido.id);
      setState(() {
        _isLoading = false;
        _pedido = pedido;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al cargar detalle: $e')));
      }
    }
  }

  String _formatearMonto(double monto) {
    return 'Bs. ${monto.toStringAsFixed(2)}';
  }

  Color _getEstadoColor(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return Colors.orange;
      case 'PAGADO':
        return Colors.blue;
      case 'PROCESANDO':
        return Colors.purple;
      case 'ENVIADO':
        return Colors.teal;
      case 'ENTREGADO':
        return Colors.green;
      case 'CANCELADO':
        return Colors.red;
      case 'REEMBOLSADO':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Future<void> _cambiarEstado() async {
    final estados = [
      'PENDIENTE',
      'PAGADO',
      'PROCESANDO',
      'ENVIADO',
      'ENTREGADO',
      'CANCELADO',
      'REEMBOLSADO',
    ];

    final nuevoEstado = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cambiar Estado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: estados.map((estado) {
            return RadioListTile<String>(
              title: Text(
                Pedido(
                  id: 0,
                  numeroPedido: '',
                  estado: estado,
                  subtotal: 0,
                  descuento: 0,
                  impuestos: 0,
                  costoEnvio: 0,
                  total: 0,
                  creado: DateTime.now().toIso8601String(),
                  actualizado: DateTime.now().toIso8601String(),
                ).estadoTexto,
              ),
              value: estado,
              groupValue: _pedido.estado,
              onChanged: (value) => Navigator.pop(context, value),
            );
          }).toList(),
        ),
      ),
    );

    if (nuevoEstado != null && nuevoEstado != _pedido.estado) {
      try {
        final pedidoActualizado = await _service.actualizarEstado(
          _pedido.id,
          nuevoEstado,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Estado actualizado correctamente'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _pedido = pedidoActualizado;
          });
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error al actualizar estado: $e'),
              backgroundColor: Colors.red,
            ),
          );
          _cargarDetalle();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error al actualizar estado'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_pedido.numeroPedido),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _cambiarEstado,
            tooltip: 'Cambiar estado',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Estado
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: _getEstadoColor(_pedido.estado).withOpacity(0.1),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: _getEstadoColor(_pedido.estado),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Estado: ${_pedido.estadoTexto}',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _getEstadoColor(_pedido.estado),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Items del pedido
                  if (_pedido.items != null && _pedido.items!.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'Productos',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    ...(_pedido.items!.map((item) {
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 4,
                        ),
                        child: ListTile(
                          title: Text(item.productoNombre),
                          subtitle: Text(
                            '${_formatearMonto(item.precioUnitario)} x ${item.cantidad}',
                          ),
                          trailing: Text(
                            _formatearMonto(item.subtotal),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      );
                    }).toList()),
                  ],

                  // Dirección de envío
                  if (_pedido.direccionEnvio != null) ...[
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'Dirección de Envío',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _pedido.direccionEnvio!.nombreCompleto,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(_pedido.direccionEnvio!.telefono),
                            if (_pedido.direccionEnvio!.email != null)
                              Text(_pedido.direccionEnvio!.email!),
                            const SizedBox(height: 8),
                            Text(_pedido.direccionEnvio!.direccion),
                            if (_pedido.direccionEnvio!.referencia != null)
                              Text(_pedido.direccionEnvio!.referencia!),
                            Text(
                              '${_pedido.direccionEnvio!.ciudad}, ${_pedido.direccionEnvio!.departamento}',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  // Resumen de totales
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Resumen',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildTotalRow('Subtotal', _pedido.subtotal),
                          if (_pedido.descuento > 0)
                            _buildTotalRow(
                              'Descuento',
                              -_pedido.descuento,
                              color: Colors.red,
                            ),
                          if (_pedido.impuestos > 0)
                            _buildTotalRow('Impuestos', _pedido.impuestos),
                          if (_pedido.costoEnvio > 0)
                            _buildTotalRow('Envío', _pedido.costoEnvio),
                          const Divider(),
                          _buildTotalRow(
                            'TOTAL',
                            _pedido.total,
                            bold: true,
                            color: Colors.green,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Notas
                  if (_pedido.notasCliente != null &&
                      _pedido.notasCliente!.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'Notas del Cliente',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(_pedido.notasCliente!),
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }

  Widget _buildTotalRow(
    String label,
    double monto, {
    bool bold = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : null,
              fontSize: bold ? 16 : 14,
            ),
          ),
          Text(
            _formatearMonto(monto),
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : null,
              fontSize: bold ? 16 : 14,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
