import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Loader2, Shield, User } from "lucide-react";
import type { Role, RoleFormData } from "@/types";

// Esquema de validación
const roleSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  es_administrativo: z.boolean(),
  permisos: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso'),
});

interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: string;
}

interface RoleStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<boolean>;
  initialData?: Role | null;
  loading?: boolean;
  permissions: Permission[];
}


export function RoleStore({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  permissions,
}: RoleStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? "Editar Rol" : "Crear Rol";
  const description = isEdit
    ? "Modifica la información del rol seleccionado"
    : "Crea un nuevo rol con permisos específicos";

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      es_administrativo: false,
      permisos: [],
    },
  });

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        nombre: initialData.nombre,
        descripcion: initialData.descripcion,
        es_administrativo: initialData.es_administrativo,
        permisos: initialData.permisos || [],
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      form.reset({
        nombre: '',
        descripcion: '',
        es_administrativo: false,
        permisos: [],
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: RoleFormData) => {
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

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = form.getValues('permisos');
    if (checked) {
      form.setValue('permisos', [...currentPermissions, permission]);
    } else {
      form.setValue('permisos', currentPermissions.filter(p => p !== permission));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
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
                    <FormLabel>Nombre del Rol *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Administrador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Rol */}
              <FormField
                control={form.control}
                name="es_administrativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Rol Administrativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Shield className="h-4 w-4" />
                            Acceso completo al sistema
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <User className="h-4 w-4" />
                            Acceso limitado para clientes
                          </div>
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las responsabilidades y funciones de este rol..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permisos */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Permisos *</Label>
              <ScrollArea className="h-60 w-full border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {permissions.map((permission) => (
                    <div key={permission.codename} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.codename}
                        checked={form.watch('permisos').includes(permission.codename)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.codename, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={permission.codename}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">
                Selecciona los permisos que tendrá este rol. Los roles administrativos pueden tener todos los permisos.
              </p>
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
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Actualizar" : "Crear"}
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
