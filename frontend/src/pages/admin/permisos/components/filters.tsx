import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface PermissionFiltersComponentProps {
  search: string;
  categoriaFilter: string;
  onSearchChange: (value: string) => void;
  onCategoriaFilterChange: (value: string) => void;
  loading: boolean;
}

const categorias = [
  'all',
  'autenticación',
  'gestión_de_usuarios',
  'operaciones',
  'reportes',
  'administración',
  'monitoreo',
  'configuración'
];

export function PermissionFiltersComponent({
  search,
  categoriaFilter,
  onSearchChange,
  onCategoriaFilterChange,
  loading
}: PermissionFiltersComponentProps) {
  const clearFilters = () => {
    onSearchChange('');
    onCategoriaFilterChange('all');
  };

  const hasActiveFilters = search || categoriaFilter !== 'all';

  const getCategoryLabel = (categoria: string) => {
    if (categoria === 'all') return 'Todas las categorías';
    return categoria.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filtro por categoría */}
          <div className="w-full sm:w-48">
            <Select
              value={categoriaFilter}
              onValueChange={onCategoriaFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {getCategoryLabel(categoria)}
                  </SelectItem>
                ))}
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
            {categoriaFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                <span>
                  Categoría: {getCategoryLabel(categoriaFilter)}
                </span>
                <button
                  onClick={() => onCategoriaFilterChange('all')}
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
