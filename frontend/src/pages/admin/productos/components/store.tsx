import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/date-picker";
import { Loader2, Upload, X } from "lucide-react";
import type { Producto, ProductoFormData, Categoria } from "@/types";
import { categoriasService, productosService } from "@/services";

// Esquema de validación
const productoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  descripcion_corta: z.string().optional(),
  imagen: z.instanceof(File).optional(),
  categoria_id: z.number().min(1, 'Seleccione una categoría'),
  precio: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
  stock_minimo: z.number().int().min(0).optional(),
  meses_garantia: z.number().int().min(0, 'La garantía debe ser mayor o igual a 0').optional(),
  descripcion_garantia: z.string().optional(),
  sku: z.string().optional(),
  codigo_barras: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  peso: z.number().optional(),
  activo: z.boolean().optional(),
  destacado: z.boolean().optional(),
  en_oferta: z.boolean().optional(),
  precio_oferta: z.number().optional(),
  descuento_porcentaje: z.number().optional(),
  fecha_inicio_oferta: z.date().optional(),
  fecha_fin_oferta: z.date().optional(),
}).superRefine((data, ctx) => {
  // Validar que si está en oferta, tenga precio de oferta
  if (data.en_oferta && !data.precio_oferta) {
    ctx.addIssue({
      code: 'custom',
      path: ['precio_oferta'],
      message: 'Debe especificar un precio de oferta',
    });
  }
  // Validar que el precio de oferta sea menor al precio normal
  if (data.en_oferta && data.precio_oferta && data.precio_oferta >= data.precio) {
    ctx.addIssue({
      code: 'custom',
      path: ['precio_oferta'],
      message: 'El precio de oferta debe ser menor al precio normal',
    });
  }
}) as any;

interface ProductosStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductoFormData) => Promise<boolean>;
  initialData?: Producto | null;
  loading?: boolean;
}

export function ProductosStore({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ProductosStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? "Editar Producto" : "Crear Producto";
  const description = isEdit
    ? "Modifica la información del producto seleccionado"
    : "Agrega un nuevo producto al catálogo";

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loadingProducto, setLoadingProducto] = useState(false);
  const [productoCompleto, setProductoCompleto] = useState<Producto | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema) as any,
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria_id: 0,
      precio: 0,
      stock: 0,
      activo: true,
      destacado: false,
      en_oferta: false,
    } as any,
  });

  const enOferta = form.watch('en_oferta');

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await categoriasService.getAll();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategorias(false);
      }
    };
    loadCategorias();
  }, []);

  // Cargar producto completo cuando se abre en modo edición
  useEffect(() => {
    const loadProductoCompleto = async () => {
      if (isOpen && initialData && initialData.id) {
        setLoadingProducto(true);
        try {
          const productoDetalle = await productosService.getById(initialData.id);
          setProductoCompleto(productoDetalle);
          
          // Cargar imagen si existe
          if (productoDetalle.imagen) {
            setImagePreview(productoDetalle.imagen);
          }
          
          form.reset({
            nombre: productoDetalle.nombre,
            descripcion: productoDetalle.descripcion,
            descripcion_corta: productoDetalle.descripcion_corta || '',
            categoria_id: productoDetalle.categoria?.id || 0,
            precio: productoDetalle.precio,
            stock: productoDetalle.stock,
            stock_minimo: productoDetalle.stock_minimo || undefined,
            meses_garantia: productoDetalle.meses_garantia || 0,
            descripcion_garantia: productoDetalle.descripcion_garantia || '',
            sku: productoDetalle.sku || '',
            codigo_barras: productoDetalle.codigo_barras || '',
            marca: productoDetalle.marca || '',
            modelo: productoDetalle.modelo || '',
            peso: productoDetalle.peso || undefined,
            activo: productoDetalle.activo ?? true,
            destacado: productoDetalle.destacado ?? false,
            en_oferta: productoDetalle.en_oferta ?? false,
            precio_oferta: productoDetalle.precio_oferta ?? undefined,
            descuento_porcentaje: productoDetalle.descuento_porcentaje || 0,
            fecha_inicio_oferta: productoDetalle.fecha_inicio_oferta ? new Date(productoDetalle.fecha_inicio_oferta) : undefined,
            fecha_fin_oferta: productoDetalle.fecha_fin_oferta ? new Date(productoDetalle.fecha_fin_oferta) : undefined,
          } as any);
        } catch (error) {
          console.error('Error al cargar producto completo:', error);
        } finally {
          setLoadingProducto(false);
        }
      } else if (isOpen && !initialData) {
        // Resetear formulario para crear nuevo
        setProductoCompleto(null);
        setImageFile(null);
        setImagePreview(null);
        form.reset({
          nombre: '',
          descripcion: '',
          categoria_id: 0,
          precio: 0,
          stock: 0,
          activo: true,
          destacado: false,
          en_oferta: false,
        } as any);
      }
    };
    
    loadProductoCompleto();
  }, [isOpen, initialData?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (data: ProductoFormData) => {
    const submitData = {
      ...data,
      ...(imageFile && { imagen: imageFile })
    };
    const success = await onSubmit(submitData);
    if (success) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onClose();
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImagePreview(null);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {loadingProducto ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando datos del producto...</span>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nombre del Producto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Laptop Dell Inspiron 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe las características principales del producto..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción Corta */}
                <FormField
                  control={form.control}
                  name="descripcion_corta"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción Corta</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Resumen breve del producto (para tarjetas)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría */}
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value > 0 ? field.value.toString() : ''}
                        disabled={loadingCategorias}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: PROD-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Imagen del Producto */}
                <div className="md:col-span-2">
                  <FormLabel>Imagen del Producto</FormLabel>
                  <div className="mt-2 space-y-3">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Subir imagen</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Precio e Inventario */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Precio e Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Precio */}
                <FormField
                  control={form.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (Bs.) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stock */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Garantía */}
                <FormField
                  control={form.control}
                  name="meses_garantia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garantía (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Peso */}
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Detalles Adicionales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Detalles Adicionales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Marca */}
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Dell" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Modelo */}
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Inspiron 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Código de Barras */}
                <FormField
                  control={form.control}
                  name="codigo_barras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 7501234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stock Mínimo */}
                <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción de Garantía */}
                <FormField
                  control={form.control}
                  name="descripcion_garantia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción de Garantía</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Garantía del fabricante por defectos de fábrica" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Oferta */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Configuración de Oferta</h3>
              
              {/* En Oferta Switch */}
              <FormField
                control={form.control}
                name="en_oferta"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Producto en Oferta</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Activar descuento especial para este producto
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {enOferta && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Precio Oferta */}
                  <FormField
                    control={form.control}
                    name="precio_oferta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Oferta (Bs.) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha Inicio Oferta */}
                  <FormField
                    control={form.control}
                    name="fecha_inicio_oferta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Inicio</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? field.value : null}
                            onChange={(date) => field.onChange(date || undefined)}
                            placeholder="Fecha de inicio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha Fin Oferta */}
                  <FormField
                    control={form.control}
                    name="fecha_fin_oferta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Fin</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? field.value : null}
                            onChange={(date) => field.onChange(date || undefined)}
                            placeholder="Fecha de fin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Estados */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Estado del Producto</h3>
              <div className="space-y-3">
                {/* Activo */}
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Producto Activo</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          El producto será visible en la tienda
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Destacado */}
                <FormField
                  control={form.control}
                  name="destacado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Producto Destacado</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Aparecerá en la sección de productos destacados
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
