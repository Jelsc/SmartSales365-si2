import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, User } from 'lucide-react';
import type { Role } from '@/types';

interface RoleDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  role?: Role | null;
  loading?: boolean;
}

export function RoleDelete({
  isOpen,
  onClose,
  onConfirm,
  role,
  loading = false,
}: RoleDeleteProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div>
              <DialogTitle>Eliminar Rol</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium mb-1">
                  ¿Estás seguro de que quieres eliminar este rol?
                </h4>
                <p className="text-red-700 text-sm">
                  Esta acción eliminará permanentemente el rol y todos sus permisos asociados.
                  Los usuarios con este rol perderán sus permisos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Información del Rol</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{role.nombre}</span>
                <Badge 
                  variant={role.es_administrativo ? "information" : "success"}
                  badgeType="icon"
                  size="sm"
                >
                  {role.es_administrativo ? "Administrativo" : "Cliente"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{role.descripcion}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Permisos:</span>
                <Badge variant="brand" badgeType="no-icon" size="sm">
                  {role.permisos?.length || 0} permisos asignados
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-yellow-800 font-medium text-sm mb-1">
                  Advertencia
                </h5>
                <p className="text-yellow-700 text-sm">
                  Si hay usuarios asignados a este rol, deberás reasignarlos a otro rol antes de eliminar este.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar Rol'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
