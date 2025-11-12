import type { Categoria, ProductoFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface ProductFiltersProps {
  filters: ProductoFilters;
  categorias: Categoria[];
  onFiltersChange: (filters: ProductoFilters) => void;
  onClearFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categorias,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleFilterChange = (key: keyof ProductoFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Búsqueda */}
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            type="text"
            placeholder="Nombre del producto..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Categoría */}
        <div>
          <Label htmlFor="categoria">Categoría</Label>
          <Select
            value={filters.categoria?.toString() || 'all'}
            onValueChange={(value) => 
              handleFilterChange('categoria', value === 'all' ? undefined : parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rango de precio */}
        <div className="space-y-2">
          <Label>Precio (BOB)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.precio_min || ''}
                onChange={(e) => 
                  handleFilterChange('precio_min', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.precio_max || ''}
                onChange={(e) => 
                  handleFilterChange('precio_max', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        </div>

        {/* Stock mínimo */}
        <div>
          <Label htmlFor="stock_min">Stock mínimo</Label>
          <Input
            id="stock_min"
            type="number"
            placeholder="0"
            value={filters.stock_min || ''}
            onChange={(e) => 
              handleFilterChange('stock_min', e.target.value ? parseInt(e.target.value) : undefined)
            }
          />
        </div>

        {/* Filtros booleanos */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="en_oferta"
              checked={filters.en_oferta || false}
              onCheckedChange={(checked) => 
                handleFilterChange('en_oferta', checked ? true : undefined)
              }
            />
            <Label
              htmlFor="en_oferta"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Solo ofertas
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="destacado"
              checked={filters.destacado || false}
              onCheckedChange={(checked) => 
                handleFilterChange('destacado', checked ? true : undefined)
              }
            />
            <Label
              htmlFor="destacado"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Solo destacados
            </Label>
          </div>
        </div>

        {/* Ordenar por */}
        <div>
          <Label htmlFor="ordering">Ordenar por</Label>
          <Select
            value={filters.ordering || '-creado'}
            onValueChange={(value) => handleFilterChange('ordering', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Más recientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-creado">Más recientes</SelectItem>
              <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
              <SelectItem value="-nombre">Nombre (Z-A)</SelectItem>
              <SelectItem value="precio">Precio menor</SelectItem>
              <SelectItem value="-precio">Precio mayor</SelectItem>
              <SelectItem value="-ventas">Más vendidos</SelectItem>
              <SelectItem value="stock">Stock disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
