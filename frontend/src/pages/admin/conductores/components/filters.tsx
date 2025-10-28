import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, AlertTriangle } from 'lucide-react';
import type { ConductorFilters } from '@/types';

interface ConductorFiltersProps {
  search: string;
  estadoFilter: string;
  tipoLicenciaFilter: string;
  licenciaVencidaFilter: string;
  onSearchChange: (value: string) => void;
  onEstadoFilterChange: (value: string) => void;
  onTipoLicenciaFilterChange: (value: string) => void;
  onLicenciaVencidaFilterChange: (value: string) => void;
  loading?: boolean;
}

export function ConductorFiltersComponent({ 
  search,
  estadoFilter,
  tipoLicenciaFilter,
  licenciaVencidaFilter,
  onSearchChange,
  onEstadoFilterChange,
  onTipoLicenciaFilterChange,
  onLicenciaVencidaFilterChange,
  loading = false 
}: ConductorFiltersProps) {

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, email, licencia..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado operacional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="ocupado">Ocupado</SelectItem>
              <SelectItem value="descanso">Descanso</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoLicenciaFilter} onValueChange={onTipoLicenciaFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de licencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
              <SelectItem value="B">Tipo B - Vehículos particulares</SelectItem>
              <SelectItem value="C">Tipo C - Vehículos de carga liviana</SelectItem>
              <SelectItem value="D">Tipo D - Vehículos de carga pesada</SelectItem>
              <SelectItem value="E">Tipo E - Vehículos de transporte público</SelectItem>
            </SelectContent>
          </Select>

          <Select value={licenciaVencidaFilter} onValueChange={onLicenciaVencidaFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado licencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Licencias vencidas</SelectItem>
              <SelectItem value="false">Licencias vigentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
