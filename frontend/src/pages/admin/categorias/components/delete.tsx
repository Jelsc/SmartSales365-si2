import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Categoria } from '@/types';

interface CategoriasDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  categoria: Categoria | null;
  loading?: boolean;
}

export function CategoriasDelete({
  isOpen,
  onClose,
  onConfirm,
  categoria,
  loading = false,
}: CategoriasDeleteProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  if (!categoria) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Eliminar Categoría</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta categoría?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-3">
            {categoria.imagen && (
              <img
                src={categoria.imagen}
                alt={categoria.nombre}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <p className="font-semibold">{categoria.nombre}</p>
              <p className="text-sm text-gray-500">
                {categoria.productos_count || 0} productos asociados
              </p>
            </div>
          </div>
          
          {(categoria.productos_count || 0) > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Advertencia:</strong> Esta categoría tiene productos asociados. 
                Al eliminarla, los productos quedarán sin categoría.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
