import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DatePicker } from '@/components/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Conductor, ConductorFormData } from '@/types';

// Esquema de validación
const conductorSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  fecha_nacimiento: z.date().nullable(),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido'),
  ci: z.string().min(7, 'La CI debe tener al menos 7 caracteres'),
  nro_licencia: z.string().min(5, 'El número de licencia debe tener al menos 5 caracteres'),
  tipo_licencia: z.string().min(1, 'Debe seleccionar un tipo de licencia'),
  fecha_venc_licencia: z.date().nullable(),
  experiencia_anios: z.number().min(0, 'La experiencia debe ser mayor o igual a 0'),
  estado: z.enum(['disponible', 'ocupado', 'descanso', 'inactivo']), // Nuevo campo operacional
  telefono_emergencia: z.string().optional(),
  contacto_emergencia: z.string().optional(),
}) satisfies z.ZodType<ConductorFormData>;

interface ConductorStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConductorFormData) => Promise<boolean>;
  initialData?: Conductor | null;
  loading?: boolean;
}

export function ConductorStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false 
}: ConductorStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Conductor' : 'Crear Conductor';
  const description = isEdit 
    ? 'Modifica la información del conductor seleccionado' 
    : 'Agrega un nuevo conductor';

  const form = useForm<ConductorFormData>({
    resolver: zodResolver(conductorSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      fecha_nacimiento: null,
      telefono: '',
      email: '',
      ci: '',
      nro_licencia: '',
      tipo_licencia: '',
      fecha_venc_licencia: null,
      experiencia_anios: 0,
      estado: 'disponible', // Nuevo campo operacional
      telefono_emergencia: undefined,
      contacto_emergencia: undefined,
    },
  });

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        fecha_nacimiento: initialData.fecha_nacimiento ? new Date(initialData.fecha_nacimiento) : null,
        telefono: initialData.telefono,
        email: initialData.email,
        ci: initialData.ci,
        nro_licencia: initialData.nro_licencia,
        tipo_licencia: initialData.tipo_licencia,
        fecha_venc_licencia: initialData.fecha_venc_licencia ? new Date(initialData.fecha_venc_licencia) : null,
        experiencia_anios: initialData.experiencia_anios,
        estado: initialData.estado, // Nuevo campo operacional
        telefono_emergencia: initialData.telefono_emergencia || undefined,
        contacto_emergencia: initialData.contacto_emergencia || undefined,
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      form.reset({
        nombre: '',
        apellido: '',
        fecha_nacimiento: null,
        telefono: '',
        email: '',
        ci: '',
        nro_licencia: '',
        tipo_licencia: '',
        fecha_venc_licencia: null,
        experiencia_anios: 0,
        estado: 'disponible', // Nuevo campo operacional
        telefono_emergencia: undefined,
        contacto_emergencia: undefined,
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: ConductorFormData) => {
    // Validación adicional: la fecha de vencimiento es requerida por el backend
    if (!data.fecha_venc_licencia) {
      form.setError('fecha_venc_licencia', { type: 'required', message: 'La fecha de vencimiento es requerida' });
      return;
    }
    const success = await onSubmit(data);
    if (success) {
      form.reset();
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apellido */}
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de Nacimiento */}
                <FormField
                  control={form.control}
                  name="fecha_nacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || null}
                          onChange={field.onChange}
                          placeholder="Seleccionar fecha"
                          maxDate={new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono */}
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CI */}
                <FormField
                  control={form.control}
                  name="ci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cédula de Identidad *</FormLabel>
                      <FormControl>
                        <Input placeholder="CI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información de Licencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Licencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Licencia */}
                <FormField
                  control={form.control}
                  name="nro_licencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Licencia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de licencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Licencia */}
                <FormField
                  control={form.control}
                  name="tipo_licencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Licencia *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
                          <SelectItem value="B">Tipo B - Automóviles</SelectItem>
                          <SelectItem value="C">Tipo C - Camiones</SelectItem>
                          <SelectItem value="D">Tipo D - Buses</SelectItem>
                          <SelectItem value="E">Tipo E - Remolques</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de Vencimiento de Licencia */}
                <FormField
                  control={form.control}
                  name="fecha_venc_licencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Vencimiento de Licencia *</FormLabel>
                      <FormControl>
                        <DatePicker
                            value={field.value ?? null}
                          onChange={field.onChange}
                          placeholder="Seleccionar fecha"
                          minDate={new Date("1900-01-01")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Experiencia en Años */}
                <FormField
                  control={form.control}
                  name="experiencia_anios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiencia (años) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Años de experiencia"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teléfono de Emergencia */}
                <FormField
                  control={form.control}
                  name="telefono_emergencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono de Emergencia</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono de emergencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contacto de Emergencia */}
                <FormField
                  control={form.control}
                  name="contacto_emergencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto de Emergencia</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del contacto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Estado Operacional */}
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Operacional *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupado">Ocupado</SelectItem>
                      <SelectItem value="descanso">En Descanso</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
