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
import { Search, Filter, X, Users, Shield, User } from 'lucide-react';
import type { UserFilters } from '@/types';

interface UsuarioFiltersProps {
  search: string;
  rolFilter: string;
  activeFilter: string;
  onSearchChange: (value: string) => void;
  onRolFilterChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  loading?: boolean;
}

export function UsuarioFiltersComponent({ 
  search,
  rolFilter,
  activeFilter,
  onSearchChange,
  onRolFilterChange,
  onActiveFilterChange,
  loading = false 
}: UsuarioFiltersProps) {

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por username, nombre, email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <Select value={rolFilter} onValueChange={onRolFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="Administrador">Administrador</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Operador">Operador</SelectItem>
              <SelectItem value="Conductor">Conductor</SelectItem>
              <SelectItem value="Cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>


          <Select value={activeFilter} onValueChange={onActiveFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
