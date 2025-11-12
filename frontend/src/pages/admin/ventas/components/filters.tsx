import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PedidoFilters as PedidoFiltersType } from '@/types/pedido';
import { EstadoPedido, ESTADO_LABELS } from '@/types/pedido';
import { X } from 'lucide-react';

interface PedidoFiltersProps {
  filters: PedidoFiltersType;
  onFilterChange: (filters: Partial<PedidoFiltersType>) => void;
  loading?: boolean;
}

export default function PedidoFilters({
  filters,
  onFilterChange,
  loading = false,
}: PedidoFiltersProps) {
  const handleClearFilters = () => {
    // En lugar de pasar undefined, construimos un objeto sin esas propiedades
    const clearedFilters: Partial<PedidoFiltersType> = {};
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = !!(
    filters.estado ||
    filters.fecha_inicio ||
    filters.fecha_fin ||
    filters.search
  );

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda por número de pedido */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Buscar pedido
          </label>
          <Input
            placeholder="Número de pedido..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Filtro por estado */}
        <div>
          <label className="text-sm font-medium mb-2 block">Estado</label>
          <Select
            value={filters.estado || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                // Crear nuevo objeto sin la propiedad estado
                const { estado, ...rest } = filters;
                onFilterChange(rest);
              } else {
                onFilterChange({ estado: value as EstadoPedido });
              }
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha inicio */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Fecha desde
          </label>
          <Input
            type="date"
            value={filters.fecha_inicio || ''}
            onChange={(e) => onFilterChange({ fecha_inicio: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Fecha fin */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Fecha hasta
          </label>
          <Input
            type="date"
            value={filters.fecha_fin || ''}
            onChange={(e) => onFilterChange({ fecha_fin: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      {/* Botón limpiar filtros */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </Card>
  );
}
