import 'package:flutter/material.dart';
import '../../services/pedidos_service.dart';
import '../../utils/pdf_service.dart';
import 'client_home_screen.dart';

class OrderConfirmationScreen extends StatelessWidget {
  final Pedido pedido;

  const OrderConfirmationScreen({super.key, required this.pedido});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icono de éxito
                Container(
                  width: 120,
                  height: 120,
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 80, color: Colors.white),
                ),
                const SizedBox(height: 32),

                // Título
                const Text(
                  '¡Pago Exitoso!',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),

                // Descripción
                Text(
                  'Tu pedido ha sido procesado exitosamente',
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Detalles del pedido
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        _buildDetailRow(
                          'Número de Pedido',
                          pedido.numeroPedido,
                          isBold: true,
                          canOverflow: true,
                        ),
                        const Divider(height: 24),
                        _buildDetailRow(
                          'Total Pagado',
                          'Bs. ${pedido.total.toStringAsFixed(2)}',
                          valueColor: Colors.green,
                        ),
                        const Divider(height: 24),
                        _buildDetailRow('Estado', _formatEstado(pedido.estado)),
                        if (pedido.direccionEnvio != null) ...[
                          const Divider(height: 24),
                          _buildDetailRow(
                            'Envío a',
                            pedido.direccionEnvio!.nombreCompleto,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Información adicional
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Recibirás un correo de confirmación con los detalles de tu pedido',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Botón de descargar PDF
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () => _descargarPDF(context),
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text(
                      'Descargar Comprobante PDF',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Botones de acción
                Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          // Navegar a la pantalla de pedidos (tab 3)
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (context) => const ClientHomeScreen(initialTabIndex: 3),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Ver Mis Pedidos',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () {
                          // Volver al inicio
                          Navigator.of(
                            context,
                          ).popUntil((route) => route.isFirst);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blue,
                          side: const BorderSide(color: Colors.blue, width: 2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Volver al Inicio',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
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
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
    bool canOverflow = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
          flex: 2,
          child: Text(
            label,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          flex: 3,
          child: Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: valueColor ?? Colors.black87,
            ),
            textAlign: TextAlign.right,
            maxLines: canOverflow ? 2 : 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Future<void> _descargarPDF(BuildContext context) async {
    try {
      // Mostrar indicador de carga
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // Generar y mostrar el PDF
      await PdfService.mostrarYCompartirPDF(pedido);

      // Cerrar el indicador de carga
      if (context.mounted) {
        Navigator.of(context).pop();
      }

      // Mostrar mensaje de éxito
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PDF generado exitosamente. Puedes compartirlo o guardarlo.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      // Cerrar el indicador de carga si hay error
      if (context.mounted) {
        Navigator.of(context).pop();
      }

      // Mostrar mensaje de error
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al generar PDF: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  String _formatEstado(String estado) {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return '⏳ Pendiente';
      case 'CONFIRMADO':
        return '✅ Confirmado';
      case 'PREPARANDO':
        return '📦 Preparando';
      case 'ENVIADO':
        return '🚚 Enviado';
      case 'ENTREGADO':
        return '✅ Entregado';
      case 'CANCELADO':
        return '❌ Cancelado';
      default:
        return estado;
    }
  }
}
