import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import type { Categoria } from "@/types";

interface ProductosFiltersProps {
  search: string;
  categoriaFilter: string;
  categorias: Categoria[];
  onSearchChange: (value: string) => void;
  onCategoriaFilterChange: (value: string) => void;
  onSearchSubmit: () => void;
  loading?: boolean;
}

export function ProductosFiltersComponent({ 
  search,
  categoriaFilter,
  categorias,
  onSearchChange,
  onCategoriaFilterChange,
  onSearchSubmit,
  loading = false 
}: ProductosFiltersProps) {

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre, SKU, descripción..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={onSearchSubmit}
              disabled={loading}
              variant="default"
            >
              Buscar
            </Button>
          </div>
          
          <Select 
            value={categoriaFilter ? categoriaFilter : '0'} 
            onValueChange={onCategoriaFilterChange} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas las categorías</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
