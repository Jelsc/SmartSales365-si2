import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/password-input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, User as UserIcon, Car } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User, UserFormData, Role } from '@/types';

// Esquema base (común a crear/editar)
const baseUsuarioSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres').optional(),
  direccion: z.string().optional(),
  ci: z.string().optional(),
  fecha_nacimiento: z.date().nullable().optional(),
  rol_id: z.number().optional(),
  is_active: z.boolean(), // Unificado con es_activo
  personal_id: z.number().optional(),
  conductor_id: z.number().optional(),
  password: z.string().optional(),
  password_confirm: z.string().optional(),
}) satisfies z.ZodType<UserFormData>;

// Crear: password requerido y debe coincidir
const createUsuarioSchema = baseUsuarioSchema.extend({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  password_confirm: z.string().min(6, 'Confirmación requerida'),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Las contraseñas deben coincidir',
  path: ['password_confirm'],
});

// Editar: password opcional, si se envía debe coincidir
const editUsuarioSchema = baseUsuarioSchema.refine((data) => {
  if (data.password || data.password_confirm) {
    return data.password === data.password_confirm;
  }
  return true;
}, {
  message: 'Las contraseñas deben coincidir',
  path: ['password_confirm'],
});

interface UsuarioStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<boolean>;
  initialData?: User | null;
  loading?: boolean;
  roles: Role[];
  personalDisponible: Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>;
  conductoresDisponibles: Array<{
    id: number;
    nombre: string; // Cambiado de personal__nombre
    apellido: string; // Cambiado de personal__apellido
    email: string; // Cambiado de personal__email
    ci: string; // Cambiado de personal__ci
    telefono: string; // Cambiado de personal__telefono
    nro_licencia: string;
  }>;
}

export function UsuarioStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  roles,
  personalDisponible,
  conductoresDisponibles
}: UsuarioStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Usuario' : 'Crear Usuario';
  const description = isEdit 
    ? 'Modifica la información del usuario seleccionado' 
    : 'Agrega un nuevo usuario al sistema';


  const form = useForm<UserFormData>({
    resolver: zodResolver(isEdit ? editUsuarioSchema : createUsuarioSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      telefono: '',
      direccion: '',
      ci: '',
      fecha_nacimiento: null,
      rol_id: undefined,
      is_active: true, // Unificado con es_activo
      personal_id: undefined,
      conductor_id: undefined,
      password: '',
      password_confirm: '',
    },
  });

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        username: initialData.username,
        email: initialData.email,
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        telefono: initialData.telefono,
        direccion: initialData.direccion,
        ci: initialData.ci,
        fecha_nacimiento: initialData.fecha_nacimiento ? new Date(initialData.fecha_nacimiento) : null,
        rol_id: initialData.rol?.id || undefined,
        is_active: initialData.is_active, // Unificado con es_activo
        personal_id: initialData.personal_id || undefined,
        conductor_id: initialData.conductor_id || undefined,
        password: '',
        password_confirm: '',
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      form.reset({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        telefono: '',
        direccion: '',
        ci: '',
        fecha_nacimiento: null,
        rol_id: undefined,
        is_active: true, // Unificado con es_activo
        personal_id: undefined,
        conductor_id: undefined,
        password: '',
        password_confirm: '',
      });
    }
  }, [isOpen, initialData, form]);

  // Manejar cambios en personal y conductor
  const personalValue = form.watch('personal_id');
  const conductorValue = form.watch('conductor_id');

  useEffect(() => {
    if (personalValue) {
      handlePersonalSelect(personalValue);
    }
  }, [personalValue]);

  useEffect(() => {
    if (conductorValue) {
      handleConductorSelect(conductorValue);
    }
  }, [conductorValue]);

  const handleSubmit = async (data: UserFormData) => {
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

  const handlePersonalSelect = (personalId: number) => {
    const personal = personalDisponible.find(p => p.id === personalId);
    if (personal) {
      form.setValue('personal_id', personalId);
      // Si selecciona personal, desvincular conductor para evitar conflictos
      form.setValue('conductor_id', undefined, { shouldDirty: true, shouldValidate: true });
      form.setValue('first_name', personal.nombre);
      form.setValue('last_name', personal.apellido);
      form.setValue('email', personal.email);
      form.setValue('telefono', personal.telefono);
      form.setValue('ci', personal.ci);
    }
  };

  const handleConductorSelect = (conductorId: number) => {
    const conductor = conductoresDisponibles.find(c => c.id === conductorId);
    if (conductor) {
      form.setValue('conductor_id', conductorId, { shouldDirty: true, shouldValidate: true });
      // Si selecciona conductor, desvincular personal para evitar conflictos
      form.setValue('personal_id', undefined, { shouldDirty: true, shouldValidate: true });
      form.setValue('first_name', conductor.nombre); // Cambiado de personal__nombre
      form.setValue('last_name', conductor.apellido); // Cambiado de personal__apellido
      form.setValue('email', conductor.email); // Cambiado de personal__email
      form.setValue('telefono', conductor.telefono); // Cambiado de personal__telefono
      form.setValue('ci', conductor.ci);
    }
  };

  const selectedPersonal = personalDisponible.find(p => p.id === form.watch('personal_id'));
  const selectedConductor = conductoresDisponibles.find(c => c.id === form.watch('conductor_id'));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
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
              {/* Nombre */}
              <FormField
                control={form.control}
                name="first_name"
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
                name="last_name"
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

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rol (desde API) */}
              <FormField
                control={form.control}
                name="rol_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                      value={field.value !== undefined ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal (Select simple) */}
              <FormField
                control={form.control}
                name="personal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                      value={field.value !== undefined ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar personal..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {personalDisponible.map((personal) => (
                          <SelectItem key={personal.id} value={String(personal.id)}>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {personal.nombre} {personal.apellido}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {personal.email} - {personal.ci}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conductor (Select simple) */}
              <FormField
                control={form.control}
                name="conductor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                      value={field.value !== undefined ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar conductor..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {conductoresDisponibles.map((conductor) => (
                          <SelectItem key={conductor.id} value={String(conductor.id)}>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {conductor.nombre} {conductor.apellido}
                                </div>
                                <div className="text-sm text-gray-500">
                                  CI: {conductor.ci}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEdit ? 'Nueva Contraseña' : 'Contraseña *'}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput 
                        placeholder={isEdit ? "Dejar vacío para mantener la actual" : "Contraseña"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEdit ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput 
                        placeholder={isEdit ? "Confirmar nueva contraseña" : "Confirmar contraseña"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dirección */}
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección" {...field} />
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
                  <FormLabel>Cédula de Identidad</FormLabel>
                  <FormControl>
                    <Input placeholder="CI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado Activo */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El usuario estará activo en el sistema
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
