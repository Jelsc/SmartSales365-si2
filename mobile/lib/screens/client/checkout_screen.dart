import 'package:flutter/material.dart';
import '../../services/carrito_service.dart';
import '../../services/pedidos_service.dart';
import '../../services/payment_service.dart';
import '../../services/notification_service.dart';
import 'order_confirmation_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final Carrito carrito;

  const CheckoutScreen({super.key, required this.carrito});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final PedidosService _pedidosService = PedidosService();
  final PaymentService _paymentService = PaymentService();
  final CarritoService _carritoService = CarritoService();

  // Controladores del formulario
  final _nombreCompletoController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _emailController = TextEditingController();
  final _direccionController = TextEditingController();
  final _referenciaController = TextEditingController();
  final _ciudadController = TextEditingController();
  final _departamentoController = TextEditingController();
  final _codigoPostalController = TextEditingController();
  final _notasController = TextEditingController();

  bool _isProcessing = false;
  String _currentStep =
      'form'; // 'form', 'creating_order', 'processing_payment'

  @override
  void dispose() {
    _nombreCompletoController.dispose();
    _telefonoController.dispose();
    _emailController.dispose();
    _direccionController.dispose();
    _referenciaController.dispose();
    _ciudadController.dispose();
    _departamentoController.dispose();
    _codigoPostalController.dispose();
    _notasController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finalizar Compra'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Indicador de pasos
          _buildStepIndicator(),

          // Contenido principal
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Resumen del carrito
                    _buildCartSummary(),
                    const SizedBox(height: 24),

                    // Formulario de dirección de envío
                    _buildShippingForm(),
                    const SizedBox(height: 24),

                    // Notas del pedido
                    _buildNotesSection(),
                  ],
                ),
              ),
            ),
          ),

          // Botón de pago
          _buildPaymentButton(),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      color: Colors.grey.shade100,
      child: Row(
        children: [
          _buildStepDot(1, 'Datos', isActive: _currentStep == 'form'),
          _buildStepLine(),
          _buildStepDot(
            2,
            'Pedido',
            isActive: _currentStep == 'creating_order',
          ),
          _buildStepLine(),
          _buildStepDot(
            3,
            'Pago',
            isActive: _currentStep == 'processing_payment',
          ),
        ],
      ),
    );
  }

  Widget _buildStepDot(int number, String label, {bool isActive = false}) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? Colors.blue : Colors.grey.shade300,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number',
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey.shade600,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isActive ? Colors.blue : Colors.grey.shade600,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine() {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 20),
        color: Colors.grey.shade300,
      ),
    );
  }

  Widget _buildCartSummary() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Resumen del Pedido',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(height: 24),
            ...widget.carrito.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${item.cantidad}x ${item.productoDetalle.nombre}',
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                    Text(
                      'Bs. ${item.subtotal.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Bs. ${widget.carrito.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShippingForm() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Dirección de Envío',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _nombreCompletoController,
              decoration: const InputDecoration(
                labelText: 'Nombre Completo',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingresa tu nombre completo';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _telefonoController,
              decoration: const InputDecoration(
                labelText: 'Teléfono',
                prefixIcon: Icon(Icons.phone),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingresa tu teléfono';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingresa tu email';
                }
                if (!value.contains('@')) {
                  return 'Por favor ingresa un email válido';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _direccionController,
              decoration: const InputDecoration(
                labelText: 'Dirección',
                prefixIcon: Icon(Icons.home),
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingresa tu dirección';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _referenciaController,
              decoration: const InputDecoration(
                labelText: 'Referencia (Opcional)',
                prefixIcon: Icon(Icons.location_on),
                border: OutlineInputBorder(),
                hintText: 'Ej: Cerca del parque central',
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _ciudadController,
                    decoration: const InputDecoration(
                      labelText: 'Ciudad',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Requerido';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _departamentoController,
                    decoration: const InputDecoration(
                      labelText: 'Departamento',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Requerido';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _codigoPostalController,
              decoration: const InputDecoration(
                labelText: 'Código Postal',
                prefixIcon: Icon(Icons.markunread_mailbox),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingresa el código postal';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Notas del Pedido (Opcional)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notasController,
              decoration: const InputDecoration(
                hintText: 'Instrucciones especiales para la entrega...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentButton() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isProcessing ? null : _procesarCompra,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              disabledBackgroundColor: Colors.grey.shade300,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isProcessing
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Proceder al Pago',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _procesarCompra() async {
    // Validar formulario
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor completa todos los campos requeridos'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
      _currentStep = 'creating_order';
    });

    try {
      // 1. Crear el pedido en el backend
      print('[CHECKOUT] Creando pedido...');

      final direccion = DireccionEnvio(
        id: 0, // Será asignado por el backend
        nombreCompleto: _nombreCompletoController.text.trim(),
        telefono: _telefonoController.text.trim(),
        email: _emailController.text.trim(),
        direccion: _direccionController.text.trim(),
        ciudad: _ciudadController.text.trim(),
        departamento: _departamentoController.text.trim(),
        codigoPostal: _codigoPostalController.text.trim(),
        referencia: _referenciaController.text.trim().isNotEmpty
            ? _referenciaController.text.trim()
            : null,
      );

      final request = CrearPedidoRequest(
        direccionEnvio: direccion,
        notasCliente: _notasController.text.trim().isNotEmpty
            ? _notasController.text.trim()
            : null,
      );

      final pedido = await _pedidosService.crearPedido(request);
      print(
        '[CHECKOUT] ✅ Pedido creado: ${pedido.numeroPedido} (ID: ${pedido.id})',
      );

      // 2. Crear el Payment Intent
      setState(() => _currentStep = 'processing_payment');
      print('[CHECKOUT] Creando payment intent...');

      final paymentData = await _paymentService.crearPaymentIntent(pedido.id);
      print(
        '[CHECKOUT] ✅ Payment intent creado: ${paymentData['payment_intent_id']}',
      );

      // 3. Procesar el pago con Stripe Payment Sheet
      print('[CHECKOUT] Presentando Payment Sheet...');
      final paymentIntentId = await _paymentService.procesarPagoConPaymentSheet(
        clientSecret: paymentData['client_secret'],
        pedidoId: pedido.id,
      );

      if (paymentIntentId == null) {
        // Usuario canceló el pago
        print('[CHECKOUT] Pago cancelado por el usuario');
        setState(() {
          _isProcessing = false;
          _currentStep = 'form';
        });
        return;
      }

      // 4. Confirmar el pago en el backend
      print('[CHECKOUT] Confirmando pago en backend...');
      final pagoConfirmado = await _paymentService.confirmarPago(
        paymentIntentId,
      );

      if (!pagoConfirmado) {
        throw Exception('No se pudo confirmar el pago');
      }

      print('[CHECKOUT] ✅ Pago confirmado exitosamente');

      // 5. Enviar notificación push de pago exitoso (el backend también puede enviar una)
      try {
        final notificationService = NotificationService();
        await notificationService.showLocalNotification(
          title: '¡Pago Exitoso!',
          body: 'Tu pedido ${pedido.numeroPedido} ha sido confirmado',
          data: {
            'tipo': 'pago_exitoso',
            'pedido_id': pedido.id.toString(),
            'numero_pedido': pedido.numeroPedido,
          },
        );
      } catch (e) {
        print('[CHECKOUT] ⚠️ Error mostrando notificación: $e');
      }

      // 6. Vaciar el carrito (el pago fue exitoso)
      try {
        await _carritoService.vaciarCarrito();
        print('[CHECKOUT] ✅ Carrito vaciado');
      } catch (e) {
        // No fallar el flujo si falla vaciar el carrito (ya se procesó el pago)
        print('[CHECKOUT] ⚠️ Advertencia: Error al vaciar carrito: $e');
        // El carrito puede estar vacío de todas formas si el backend lo limpió
      }

      // 6. Mostrar mensaje de éxito
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pago procesado exitosamente'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }

      // 7. Navegar a pantalla de confirmación
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => OrderConfirmationScreen(pedido: pedido),
          ),
        );
      }
    } catch (e) {
      print('[CHECKOUT] ❌ Error: $e');
      setState(() {
        _isProcessing = false;
        _currentStep = 'form';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al procesar la compra: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }
}
