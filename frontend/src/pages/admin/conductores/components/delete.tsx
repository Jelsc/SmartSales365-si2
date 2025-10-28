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
import { Loader2, AlertTriangle, Car } from 'lucide-react';
import type { Conductor } from '@/types';

interface ConductorDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  conductor: Conductor | null;
  loading?: boolean;
}

export function ConductorDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conductor, 
  loading = false 
}: ConductorDeleteProps) {
  if (!conductor) return null;

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

  const getLicenseStatus = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return {
        status: 'Vencida',
        variant: 'error' as const,
        badgeType: 'icon' as const
      };
    } else if (diasRestantes <= 30) {
      return {
        status: `Por vencer (${diasRestantes} días)`,
        variant: 'warning' as const,
        badgeType: 'icon' as const
      };
    } else {
      return {
        status: 'Vigente',
        variant: 'success' as const,
        badgeType: 'dot' as const
      };
    }
  };

  const licenseStatus = getLicenseStatus(conductor.fecha_venc_licencia);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación de Conductor
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar este conductor? 
                Esta acción no se puede deshacer y afectará todas las operaciones asociadas.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Información del Conductor:
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <div>{conductor.nombre} {conductor.apellido}</div>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <div>{conductor.email}</div>
                  </div>
                  <div>
                    <span className="font-medium">Teléfono:</span>
                    <div>{conductor.telefono}</div>
                  </div>
                  <div>
                    <span className="font-medium">CI:</span>
                    <div>{conductor.ci}</div>
                  </div>
                  <div>
                    <span className="font-medium">Número de Licencia:</span>
                    <div className="mt-1">
                      <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                        {conductor.nro_licencia}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Licencia:</span>
                    <div className="mt-1">
                      <Badge variant="information" badgeType="no-icon" size="sm">
                        Tipo {conductor.tipo_licencia}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Vencimiento:</span>
                    <div>{formatDate(conductor.fecha_venc_licencia)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Estado de Licencia:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={licenseStatus.variant} 
                        badgeType={licenseStatus.badgeType}
                        size="sm"
                      >
                        {licenseStatus.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Experiencia:</span>
                    <div className="mt-1">
                      <Badge variant="brand" badgeType="no-icon" size="sm">
                        {conductor.experiencia_anios} años
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Estado Operacional:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={conductor.estado === 'disponible' ? 'success' : conductor.estado === 'ocupado' ? 'warning' : conductor.estado === 'descanso' ? 'information' : 'error'}
                        badgeType={conductor.estado === 'disponible' ? 'dot' : 'icon'}
                        size="sm"
                      >
                        {conductor.estado.charAt(0).toUpperCase() + conductor.estado.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-red-800 text-sm">
                  <strong>Advertencia:</strong> Al eliminar este conductor, se perderá 
                  toda la información asociada incluyendo historial de viajes, 
                  ubicaciones y no podrá ser recuperada.
                </div>
              </div>

              {conductor.estado === 'disponible' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Este conductor está actualmente disponible. 
                    Asegúrate de que no tenga viajes pendientes antes de eliminarlo.
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
            Eliminar Conductor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
