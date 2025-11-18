import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../services/pedidos_service.dart';

/// Servicio para generar PDFs de comprobantes de pedidos
class PdfService {
  /// Genera y guarda un PDF del comprobante de pedido
  static Future<File?> generarComprobantePDF(Pedido pedido) async {
    try {
      final pdf = pw.Document();

      // Formatear fecha
      final fechaFormateada = _formatearFecha(pedido.creado);

      // Construir el PDF
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(40),
          build: (pw.Context context) {
            return [
              // Encabezado
              _buildHeader(),
              pw.SizedBox(height: 30),

              // Título
              pw.Center(
                child: pw.Text(
                  'COMPROBANTE DE PEDIDO',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.SizedBox(height: 20),

              // Información del pedido
              _buildSectionTitle('Información del Pedido'),
              pw.SizedBox(height: 10),
              _buildInfoRow('Número de Pedido:', pedido.numeroPedido),
              _buildInfoRow('Fecha:', fechaFormateada),
              _buildInfoRow('Estado:', _formatearEstado(pedido.estado)),
              pw.SizedBox(height: 20),

              // Productos
              if (pedido.items != null && pedido.items!.isNotEmpty) ...[
                _buildSectionTitle('Productos'),
                pw.SizedBox(height: 10),
                _buildProductTable(pedido.items!),
                pw.SizedBox(height: 20),
              ],

              // Resumen financiero
              _buildSectionTitle('Resumen Financiero'),
              pw.SizedBox(height: 10),
              _buildInfoRow('Subtotal:', 'Bs. ${pedido.subtotal.toStringAsFixed(2)}'),
              if (pedido.descuento > 0)
                _buildInfoRow('Descuento:', 'Bs. ${pedido.descuento.toStringAsFixed(2)}'),
              if (pedido.costoEnvio > 0)
                _buildInfoRow('Costo de Envío:', 'Bs. ${pedido.costoEnvio.toStringAsFixed(2)}'),
              if (pedido.impuestos > 0)
                _buildInfoRow('Impuestos:', 'Bs. ${pedido.impuestos.toStringAsFixed(2)}'),
              pw.Divider(),
              _buildInfoRow(
                'TOTAL:',
                'Bs. ${pedido.total.toStringAsFixed(2)}',
                isBold: true,
                fontSize: 18,
              ),
              pw.SizedBox(height: 20),

              // Dirección de envío
              if (pedido.direccionEnvio != null) ...[
                _buildSectionTitle('Dirección de Envío'),
                pw.SizedBox(height: 10),
                _buildDireccionEnvio(pedido.direccionEnvio!),
                pw.SizedBox(height: 20),
              ],

              // Notas
              if (pedido.notasCliente != null && pedido.notasCliente!.isNotEmpty) ...[
                _buildSectionTitle('Notas'),
                pw.SizedBox(height: 10),
                pw.Text(
                  pedido.notasCliente!,
                  style: const pw.TextStyle(fontSize: 12),
                ),
                pw.SizedBox(height: 20),
              ],

              // Pie de página
              pw.Divider(),
              pw.SizedBox(height: 10),
              pw.Center(
                child: pw.Text(
                  'Gracias por tu compra',
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontStyle: pw.FontStyle.italic,
                  ),
                ),
              ),
              pw.SizedBox(height: 5),
              pw.Center(
                child: pw.Text(
                  'SmartSales365',
                  style: pw.TextStyle(
                    fontSize: 12,
                    color: PdfColors.grey700,
                  ),
                ),
              ),
            ];
          },
        ),
      );

      // Guardar el PDF
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/comprobante_${pedido.numeroPedido}.pdf');
      await file.writeAsBytes(await pdf.save());

      return file;
    } catch (e) {
      print('Error generando PDF: $e');
      return null;
    }
  }

  /// Muestra el PDF en un visor y permite compartir/guardar
  static Future<void> mostrarYCompartirPDF(Pedido pedido) async {
    try {
      final pdf = pw.Document();

      // Formatear fecha
      final fechaFormateada = _formatearFecha(pedido.creado);

      // Construir el PDF
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(40),
          build: (pw.Context context) {
            return [
              // Encabezado
              _buildHeader(),
              pw.SizedBox(height: 30),

              // Título
              pw.Center(
                child: pw.Text(
                  'COMPROBANTE DE PEDIDO',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.SizedBox(height: 20),

              // Información del pedido
              _buildSectionTitle('Información del Pedido'),
              pw.SizedBox(height: 10),
              _buildInfoRow('Número de Pedido:', pedido.numeroPedido),
              _buildInfoRow('Fecha:', fechaFormateada),
              _buildInfoRow('Estado:', _formatearEstado(pedido.estado)),
              pw.SizedBox(height: 20),

              // Productos
              if (pedido.items != null && pedido.items!.isNotEmpty) ...[
                _buildSectionTitle('Productos'),
                pw.SizedBox(height: 10),
                _buildProductTable(pedido.items!),
                pw.SizedBox(height: 20),
              ],

              // Resumen financiero
              _buildSectionTitle('Resumen Financiero'),
              pw.SizedBox(height: 10),
              _buildInfoRow('Subtotal:', 'Bs. ${pedido.subtotal.toStringAsFixed(2)}'),
              if (pedido.descuento > 0)
                _buildInfoRow('Descuento:', 'Bs. ${pedido.descuento.toStringAsFixed(2)}'),
              if (pedido.costoEnvio > 0)
                _buildInfoRow('Costo de Envío:', 'Bs. ${pedido.costoEnvio.toStringAsFixed(2)}'),
              if (pedido.impuestos > 0)
                _buildInfoRow('Impuestos:', 'Bs. ${pedido.impuestos.toStringAsFixed(2)}'),
              pw.Divider(),
              _buildInfoRow(
                'TOTAL:',
                'Bs. ${pedido.total.toStringAsFixed(2)}',
                isBold: true,
                fontSize: 18,
              ),
              pw.SizedBox(height: 20),

              // Dirección de envío
              if (pedido.direccionEnvio != null) ...[
                _buildSectionTitle('Dirección de Envío'),
                pw.SizedBox(height: 10),
                _buildDireccionEnvio(pedido.direccionEnvio!),
                pw.SizedBox(height: 20),
              ],

              // Notas
              if (pedido.notasCliente != null && pedido.notasCliente!.isNotEmpty) ...[
                _buildSectionTitle('Notas'),
                pw.SizedBox(height: 10),
                pw.Text(
                  pedido.notasCliente!,
                  style: const pw.TextStyle(fontSize: 12),
                ),
                pw.SizedBox(height: 20),
              ],

              // Pie de página
              pw.Divider(),
              pw.SizedBox(height: 10),
              pw.Center(
                child: pw.Text(
                  'Gracias por tu compra',
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontStyle: pw.FontStyle.italic,
                  ),
                ),
              ),
              pw.SizedBox(height: 5),
              pw.Center(
                child: pw.Text(
                  'SmartSales365',
                  style: pw.TextStyle(
                    fontSize: 12,
                    color: PdfColors.grey700,
                  ),
                ),
              ),
            ];
          },
        ),
      );

      // Mostrar el PDF con opciones de compartir/guardar
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      print('Error mostrando PDF: $e');
      rethrow;
    }
  }

  static pw.Widget _buildHeader() {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              'SmartSales365',
              style: pw.TextStyle(
                fontSize: 20,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.blue700,
              ),
            ),
            pw.Text(
              'Comprobante de Pedido',
              style: pw.TextStyle(
                fontSize: 12,
                color: PdfColors.grey700,
              ),
            ),
          ],
        ),
      ],
    );
  }

  static pw.Widget _buildSectionTitle(String title) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: pw.BoxDecoration(
        color: PdfColors.grey200,
        borderRadius: pw.BorderRadius.circular(4),
      ),
      child: pw.Text(
        title,
        style: pw.TextStyle(
          fontSize: 14,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
    );
  }

  static pw.Widget _buildInfoRow(
    String label,
    String value, {
    bool isBold = false,
    double fontSize = 12,
  }) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: fontSize,
              color: PdfColors.grey700,
            ),
          ),
          pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: fontSize,
              fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildProductTable(List<ItemPedidoDetalle> items) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      columnWidths: {
        0: const pw.FlexColumnWidth(3),
        1: const pw.FlexColumnWidth(1),
        2: const pw.FlexColumnWidth(1.5),
        3: const pw.FlexColumnWidth(1.5),
      },
      children: [
        // Encabezado
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          children: [
            _buildTableCell('Producto', isHeader: true),
            _buildTableCell('Cant.', isHeader: true),
            _buildTableCell('Precio Unit.', isHeader: true),
            _buildTableCell('Subtotal', isHeader: true),
          ],
        ),
        // Filas de productos
        ...items.map((item) => pw.TableRow(
              children: [
                _buildTableCell(item.nombreProducto),
                _buildTableCell(item.cantidad.toString()),
                _buildTableCell('Bs. ${item.precioUnitario.toStringAsFixed(2)}'),
                _buildTableCell('Bs. ${item.subtotal.toStringAsFixed(2)}'),
              ],
            )),
      ],
    );
  }

  static pw.Widget _buildTableCell(String text, {bool isHeader = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 12 : 10,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
    );
  }

  static pw.Widget _buildDireccionEnvio(DireccionEnvio direccion) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey300),
        borderRadius: pw.BorderRadius.circular(4),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            direccion.nombreCompleto,
            style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
          ),
          if (direccion.telefono.isNotEmpty)
            pw.Text('Tel: ${direccion.telefono}', style: const pw.TextStyle(fontSize: 10)),
          if (direccion.email != null && direccion.email!.isNotEmpty)
            pw.Text('Email: ${direccion.email}', style: const pw.TextStyle(fontSize: 10)),
          pw.SizedBox(height: 4),
          pw.Text(direccion.direccion, style: const pw.TextStyle(fontSize: 10)),
          if (direccion.direccion2 != null && direccion.direccion2!.isNotEmpty)
            pw.Text(direccion.direccion2!, style: const pw.TextStyle(fontSize: 10)),
          pw.Text(
            direccion.departamento != null
                ? '${direccion.ciudad}, ${direccion.departamento}'
                : direccion.ciudad,
            style: const pw.TextStyle(fontSize: 10),
          ),
          if (direccion.codigoPostal.isNotEmpty)
            pw.Text('CP: ${direccion.codigoPostal}', style: const pw.TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  static String _formatearFecha(String fechaStr) {
    try {
      final fecha = DateTime.parse(fechaStr);
      return DateFormat('dd/MM/yyyy HH:mm', 'es').format(fecha);
    } catch (e) {
      return fechaStr;
    }
  }

  static String _formatearEstado(String estado) {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'PAGADO':
        return 'Pagado';
      case 'PROCESANDO':
        return 'Procesando';
      case 'ENVIADO':
        return 'Enviado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}

