import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface RoleFiltersComponentProps {
  search: string;
  esAdministrativoFilter: string;
  onSearchChange: (value: string) => void;
  onEsAdministrativoFilterChange: (value: string) => void;
  loading: boolean;
}

export function RoleFiltersComponent({
  search,
  esAdministrativoFilter,
  onSearchChange,
  onEsAdministrativoFilterChange,
  loading
}: RoleFiltersComponentProps) {
  const clearFilters = () => {
    onSearchChange('');
    onEsAdministrativoFilterChange('all');
  };

  const hasActiveFilters = search || esAdministrativoFilter !== 'all';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <div className="w-full sm:w-48">
            <Select
              value={esAdministrativoFilter}
              onValueChange={onEsAdministrativoFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="true">Administrativos</SelectItem>
                <SelectItem value="false">Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              disabled={loading || !hasActiveFilters}
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              title="Más filtros"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {search && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                <span>Búsqueda: "{search}"</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {esAdministrativoFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                <span>
                  Tipo: {esAdministrativoFilter === 'true' ? 'Administrativos' : 'Clientes'}
                </span>
                <button
                  onClick={() => onEsAdministrativoFilterChange('all')}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
