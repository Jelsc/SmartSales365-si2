import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2 } from "lucide-react";
import type { Personal, PersonalFormData } from "@/types";

// Esquema de validación (fechas opcionales en el tipo, pero requeridas por regla)
const personalSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  fecha_nacimiento: z.date().nullable(),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido'),
  ci: z.string().min(7, 'La CI debe tener al menos 7 caracteres'),
  codigo_empleado: z.string().min(3, 'Código de empleado requerido'),
  fecha_ingreso: z.date().nullable(),
  telefono_emergencia: z.string().optional(),
  contacto_emergencia: z.string().optional(),
  estado: z.boolean().optional(), // Cambiado de es_activo a estado
}).superRefine((v, ctx) => {
  if (!v.fecha_nacimiento) {
    ctx.addIssue({ code: 'custom', path: ['fecha_nacimiento'], message: 'La fecha de nacimiento es requerida' });
  }
  if (!v.fecha_ingreso) {
    ctx.addIssue({ code: 'custom', path: ['fecha_ingreso'], message: 'La fecha de ingreso es requerida' });
  }
}) satisfies z.ZodType<PersonalFormData>;

interface PersonalStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonalFormData) => Promise<boolean>;
  initialData?: Personal | null;
  loading?: boolean;
}

export function PersonalStore({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: PersonalStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? "Editar Personal" : "Crear Personal";
  const description = isEdit
    ? "Modifica la información del personal seleccionado"
    : "Agrega un nuevo miembro del personal";

  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      fecha_nacimiento: null,
      telefono: '',
      email: '',
      ci: '',
      codigo_empleado: '',
      fecha_ingreso: null,
      telefono_emergencia: '',
      contacto_emergencia: '',
      estado: true, // Cambiado de es_activo a estado
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
        codigo_empleado: initialData.codigo_empleado,
        fecha_ingreso: initialData.fecha_ingreso ? new Date(initialData.fecha_ingreso) : null,
        telefono_emergencia: initialData.telefono_emergencia || '',
        contacto_emergencia: initialData.contacto_emergencia || '',
        estado: initialData.estado, // Cambiado de es_activo a estado
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
        codigo_empleado: '',
        fecha_ingreso: null,
        telefono_emergencia: '',
        contacto_emergencia: '',
        estado: true, // Cambiado de es_activo a estado
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: PersonalFormData) => {
    if (!data.fecha_nacimiento) {
      form.setError("fecha_nacimiento", {
        type: "required",
        message: "La fecha de nacimiento es requerida",
      });
      return;
    }
    if (!data.fecha_ingreso) {
      form.setError("fecha_ingreso", {
        type: "required",
        message: "La fecha de ingreso es requerida",
      });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                    <FormLabel>Fecha de Nacimiento *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? null}
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

              {/* Código de Empleado */}
              <FormField
                control={form.control}
                name="codigo_empleado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Empleado *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: EMP123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de Ingreso */}
              <FormField
                control={form.control}
                name="fecha_ingreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Ingreso *</FormLabel>
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

            {/* Estado */}
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El personal estará activo en el sistema
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
      </DialogContent>
    </Dialog>
  );
}
