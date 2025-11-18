import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../services/producto_admin_service.dart';

class ProductoFormScreen extends StatefulWidget {
  final Producto? producto;
  final List<Categoria> categorias;

  const ProductoFormScreen({
    super.key,
    this.producto,
    required this.categorias,
  });

  @override
  State<ProductoFormScreen> createState() => _ProductoFormScreenState();
}

class _ProductoFormScreenState extends State<ProductoFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ProductoAdminService _productoService = ProductoAdminService();

  late TextEditingController _nombreController;
  late TextEditingController _descripcionController;
  late TextEditingController _precioController;
  late TextEditingController _stockController;
  late TextEditingController _imagenController;

  int? _categoriaId;
  bool _activo = true;
  bool _destacado = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    // Si hay producto, cargar sus datos
    if (widget.producto != null) {
      _nombreController = TextEditingController(text: widget.producto!.nombre);
      _descripcionController = TextEditingController(
        text: widget.producto!.descripcion,
      );
      _precioController = TextEditingController(
        text: widget.producto!.precio.toString(),
      );
      _stockController = TextEditingController(
        text: widget.producto!.stock.toString(),
      );
      _imagenController = TextEditingController(
        text: widget.producto!.imagen ?? '',
      );
      _categoriaId = widget.producto!.categoriaId;
      _activo = widget.producto!.activo;
      _destacado = widget.producto!.destacado;
    } else {
      _nombreController = TextEditingController();
      _descripcionController = TextEditingController();
      _precioController = TextEditingController();
      _stockController = TextEditingController();
      _imagenController = TextEditingController();
    }
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    _precioController.dispose();
    _stockController.dispose();
    _imagenController.dispose();
    super.dispose();
  }

  Future<void> _guardarProducto() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_categoriaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor selecciona una categoría')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    ApiResponse response;
    if (widget.producto != null) {
      // Actualizar
      response = await _productoService.actualizarProducto(
        id: widget.producto!.id,
        nombre: _nombreController.text,
        descripcion: _descripcionController.text,
        precio: double.parse(_precioController.text),
        stock: int.parse(_stockController.text),
        categoriaId: _categoriaId,
        activo: _activo,
        destacado: _destacado,
        imagen: _imagenController.text.isNotEmpty
            ? _imagenController.text
            : null,
      );
    } else {
      // Crear
      response = await _productoService.crearProducto(
        nombre: _nombreController.text,
        descripcion: _descripcionController.text,
        precio: double.parse(_precioController.text),
        stock: int.parse(_stockController.text),
        categoriaId: _categoriaId!,
        activo: _activo,
        destacado: _destacado,
        imagen: _imagenController.text.isNotEmpty
            ? _imagenController.text
            : null,
      );
    }

    setState(() {
      _isLoading = false;
    });

    if (mounted) {
      if (response.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.producto != null
                  ? 'Producto actualizado'
                  : 'Producto creado',
            ),
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.message ?? 'Error al guardar')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.producto != null ? 'Editar Producto' : 'Nuevo Producto',
        ),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Imagen Preview
                    if (_imagenController.text.isNotEmpty)
                      Container(
                        height: 200,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            _imagenController.text,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Colors.grey[200],
                                child: const Center(
                                  child: Icon(Icons.broken_image, size: 48),
                                ),
                              );
                            },
                          ),
                        ),
                      ),

                    // Nombre
                    TextFormField(
                      controller: _nombreController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.inventory_2),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'El nombre es requerido';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Descripción
                    TextFormField(
                      controller: _descripcionController,
                      decoration: const InputDecoration(
                        labelText: 'Descripción *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                        alignLabelWithHint: true,
                      ),
                      maxLines: 3,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'La descripción es requerida';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Categoría
                    DropdownButtonFormField<int>(
                      value: _categoriaId,
                      decoration: const InputDecoration(
                        labelText: 'Categoría *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.category),
                      ),
                      items: widget.categorias.map((categoria) {
                        return DropdownMenuItem(
                          value: categoria.id,
                          child: Text(categoria.nombre),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _categoriaId = value;
                        });
                      },
                      validator: (value) {
                        if (value == null) {
                          return 'Selecciona una categoría';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Precio y Stock en fila
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _precioController,
                            decoration: const InputDecoration(
                              labelText: 'Precio (Bs.) *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.attach_money),
                            ),
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                RegExp(r'^\d+\.?\d{0,2}'),
                              ),
                            ],
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Requerido';
                              }
                              final precio = double.tryParse(value);
                              if (precio == null || precio <= 0) {
                                return 'Precio inválido';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _stockController,
                            decoration: const InputDecoration(
                              labelText: 'Stock *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.inventory),
                            ),
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Requerido';
                              }
                              final stock = int.tryParse(value);
                              if (stock == null || stock < 0) {
                                return 'Stock inválido';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // URL Imagen
                    TextFormField(
                      controller: _imagenController,
                      decoration: const InputDecoration(
                        labelText: 'URL de Imagen',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.image),
                        hintText: 'https://ejemplo.com/imagen.jpg',
                      ),
                      onChanged: (value) {
                        setState(() {
                          // Recargar preview
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Switches
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          children: [
                            SwitchListTile(
                              title: const Text('Producto Activo'),
                              subtitle: const Text('Visible en la tienda'),
                              value: _activo,
                              onChanged: (value) {
                                setState(() {
                                  _activo = value;
                                });
                              },
                            ),
                            SwitchListTile(
                              title: const Text('Producto Destacado'),
                              subtitle: const Text(
                                'Aparece en la página principal',
                              ),
                              value: _destacado,
                              onChanged: (value) {
                                setState(() {
                                  _destacado = value;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Botones
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancelar'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _guardarProducto,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepPurple,
                              foregroundColor: Colors.white,
                            ),
                            child: Text(
                              widget.producto != null ? 'Actualizar' : 'Crear',
                            ),
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
}
