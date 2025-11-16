import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../../../services/reportes_service.dart';
import 'package:open_filex/open_filex.dart';

class ReportesVozScreen extends StatefulWidget {
  const ReportesVozScreen({Key? key}) : super(key: key);

  @override
  State<ReportesVozScreen> createState() => _ReportesVozScreenState();
}

class _ReportesVozScreenState extends State<ReportesVozScreen>
    with SingleTickerProviderStateMixin {
  late stt.SpeechToText _speech;
  bool _isListening = false;
  bool _isLoading = false;
  String _transcripcion = '';
  String? _errorMessage;
  Map<String, dynamic>? _reporteGenerado;

  final TextEditingController _promptController = TextEditingController();
  final ReportesService _reportesService = ReportesService();

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _iniciarReconocimiento() async {
    // Solicitar permiso de micrófono
    final status = await Permission.microphone.request();

    if (!status.isGranted) {
      setState(() {
        _errorMessage = 'Se necesita permiso de micrófono';
      });
      return;
    }

    bool available = await _speech.initialize(
      onStatus: (status) {
        print('Estado del reconocimiento: $status');
        if (status == 'done' || status == 'notListening') {
          setState(() {
            _isListening = false;
          });
        }
      },
      onError: (error) {
        print('Error de reconocimiento: $error');
        setState(() {
          _isListening = false;
          _errorMessage = 'Error: ${error.errorMsg}';
        });
      },
    );

    if (!available) {
      setState(() {
        _errorMessage = 'Reconocimiento de voz no disponible';
      });
      return;
    }

    setState(() {
      _isListening = true;
      _errorMessage = null;
      _transcripcion = '';
    });

    _speech.listen(
      onResult: (result) {
        setState(() {
          _transcripcion = result.recognizedWords;
          _promptController.text = _transcripcion;
        });
      },
      localeId: 'es_ES', // Español
      listenMode: stt.ListenMode.confirmation,
    );
  }

  void _detenerReconocimiento() {
    _speech.stop();
    setState(() {
      _isListening = false;
    });
  }

  Future<void> _generarReporte({required String modo}) async {
    final prompt = _promptController.text.trim();

    if (prompt.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor ingrese o dicte un comando'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _reporteGenerado = null;
    });

    try {
      final resultado = await _reportesService.generarReporte(
        prompt: prompt,
        modo: modo,
      );

      setState(() {
        _reporteGenerado = resultado;
        _isLoading = false;
      });

      _mostrarResultado(resultado);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mostrarResultado(Map<String, dynamic> resultado) {
    if (resultado['tipo'] == 'archivo') {
      // Mostrar diálogo con opciones para abrir el archivo
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Reporte Generado'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Archivo: ${resultado['fileName']}'),
              const SizedBox(height: 8),
              Text('Ubicación: ${resultado['path']}'),
              const SizedBox(height: 16),
              const Text(
                'El archivo ha sido guardado en tu dispositivo.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cerrar'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _abrirArchivo(resultado['path']);
              },
              child: const Text('Abrir Archivo'),
            ),
          ],
        ),
      );
    } else if (resultado['tipo'] == 'json') {
      // Mostrar datos en pantalla
      _mostrarDatosJson(resultado['datos'], resultado['parametros']);
    }
  }

  Future<void> _abrirArchivo(String path) async {
    final file = File(path);
    if (await file.exists()) {
      try {
        // Usar OpenFilex para abrir archivos de forma segura en Android
        final result = await OpenFilex.open(path);

        if (result.type != ResultType.done) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } catch (e) {
        print('Error al abrir archivo: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al abrir archivo: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('El archivo no existe'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mostrarDatosJson(List datos, Map<String, dynamic> parametros) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Text(
                'Datos del Reporte',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                '${parametros['tipo']} - ${parametros['periodo']}',
                style: const TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const Divider(height: 24),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: datos.length,
                  itemBuilder: (context, index) {
                    final item = datos[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      child: ListTile(
                        title: Text(
                          item.entries.first.value.toString(),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: item.entries
                              .skip(1)
                              .map<Widget>(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text('${entry.key}: ${entry.value}'),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes con Voz'),
        backgroundColor: const Color(0xFF1E40AF),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Instrucciones
            Card(
              color: const Color(0xFFEFF6FF),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.info_outline, color: Color(0xFF1E40AF)),
                        SizedBox(width: 8),
                        Text(
                          'Cómo usar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E40AF),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '1. Presiona el botón del micrófono\n'
                      '2. Di tu comando en español\n'
                      '3. Presiona "Generar Reporte"',
                      style: TextStyle(fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Ejemplos:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const Text(
                      '• "Ventas del mes de septiembre en PDF"\n'
                      '• "Top 10 productos más vendidos en Excel"\n'
                      '• "Reporte de clientes de la última semana"',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Botón de micrófono
            Center(
              child: GestureDetector(
                onTap: _isListening
                    ? _detenerReconocimiento
                    : _iniciarReconocimiento,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isListening ? Colors.red : const Color(0xFF1E40AF),
                    boxShadow: _isListening
                        ? [
                            BoxShadow(
                              color: Colors.red.withOpacity(0.4),
                              blurRadius: 20,
                              spreadRadius: 10,
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 10,
                              spreadRadius: 2,
                            ),
                          ],
                  ),
                  child: Icon(
                    _isListening ? Icons.mic : Icons.mic_none,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            Center(
              child: Text(
                _isListening
                    ? 'Escuchando...'
                    : 'Presiona el micrófono para hablar',
                style: TextStyle(
                  fontSize: 16,
                  color: _isListening ? Colors.red : Colors.grey,
                  fontWeight: _isListening
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Campo de texto con transcripción
            TextField(
              controller: _promptController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Comando para el reporte',
                hintText: 'Escribe o dicta tu comando aquí...',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.description),
                filled: true,
                fillColor: Colors.white,
              ),
            ),

            const SizedBox(height: 16),

            // Botones de acción
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isLoading
                        ? null
                        : () => _generarReporte(modo: 'voz'),
                    icon: _isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.play_arrow),
                    label: const Text('Generar Reporte'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () {
                          _promptController.clear();
                          setState(() {
                            _transcripcion = '';
                            _errorMessage = null;
                            _reporteGenerado = null;
                          });
                        },
                  icon: const Icon(Icons.clear),
                  label: const Text('Limpiar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),

            // Mensaje de error
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Vista previa del último reporte
            if (_reporteGenerado != null &&
                _reporteGenerado!['tipo'] == 'archivo') ...[
              const SizedBox(height: 24),
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Último Reporte Generado',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Archivo: ${_reporteGenerado!['fileName']}'),
                      const SizedBox(height: 4),
                      Text(
                        'Tipo: ${_reporteGenerado!['contentType']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () =>
                            _abrirArchivo(_reporteGenerado!['path']),
                        icon: const Icon(Icons.folder_open),
                        label: const Text('Abrir Archivo'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
