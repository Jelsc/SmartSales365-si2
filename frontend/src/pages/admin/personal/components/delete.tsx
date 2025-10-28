import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Personal } from '@/types';

interface PersonalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  personal: Personal | null;
  loading?: boolean;
}

export function PersonalDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  personal, 
  loading = false 
}: PersonalDeleteProps) {
  if (!personal) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar este miembro del personal? 
                Esta acción no se puede deshacer.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="font-medium text-gray-900">Información del Personal:</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <div>{personal.nombre} {personal.apellido}</div>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <div>{personal.email}</div>
                  </div>
                  <div>
                    <span className="font-medium">Teléfono:</span>
                    <div>{personal.telefono}</div>
                  </div>
                  <div>
                    <span className="font-medium">CI:</span>
                    <div>{personal.ci}</div>
                  </div>
                  <div>
                    <span className="font-medium">Código de Empleado:</span>
                    <div className="mt-1">
                      <Badge variant="brand" badgeType="no-icon" size="sm" className="font-mono">
                        {personal.codigo_empleado}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Fecha de Ingreso:</span>
                    <div>{formatDate(personal.fecha_ingreso)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={personal.estado ? "success" : "error"} 
                        badgeType="icon"
                        size="sm"
                      >
                        {personal.estado ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Usuario:</span>
                    <div className="mt-1">
                      {personal.usuario ? (
                        <Badge variant="information" badgeType="no-icon" size="sm">
                          Usuario #{personal.usuario}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Sin usuario</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-red-800 text-sm">
                  <strong>Advertencia:</strong> Al eliminar este personal, se perderá 
                  toda la información asociada y no podrá ser recuperada.
                </div>
              </div>

              {personal.usuario && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Este personal tiene un usuario asociado. 
                    Asegúrate de que no tenga sesiones activas antes de eliminarlo.
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar Personal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
