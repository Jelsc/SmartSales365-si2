import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Lock, CheckCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionTable } from './components/table';
import { PermissionFiltersComponent } from './components/filters';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function PermisosPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");

  const {
    permisos,
    loading,
    error,
    loadPermisos,
    getPaginatedPermisos,
    clearError,
  } = usePermissions();

  // Función para cargar datos con filtros y paginación
  const fetchPermisos = async (pageNumber = 1, searchQuery = "", categoria = "all") => {
    // Solo cargar permisos una vez al montar el componente
    if (!permisos) {
      await loadPermisos();
    }
  };

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchPermisos(page, searchDebounced, categoriaFilter);
  }, [page, searchDebounced, categoriaFilter]);

  // Obtener permisos paginados y filtrados
  const paginatedPermisos = getPaginatedPermisos(page, ITEMS_PER_PAGE, searchDebounced, categoriaFilter);
  const totalPages = Math.ceil((paginatedPermisos.count || 0) / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Permisos</h1>
            <p className="text-muted-foreground">
              Visualiza y administra los permisos del sistema
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Los permisos son definidos automáticamente por el sistema
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permisos</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paginatedPermisos.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Permisos disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Autenticación</CardTitle>
              <Lock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {paginatedPermisos.results?.filter(p => p.categoria === 'Autenticación').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Permisos de acceso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestión</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {paginatedPermisos.results?.filter(p => p.categoria === 'Gestión de Usuarios').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Permisos administrativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operaciones</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {paginatedPermisos.results?.filter(p => p.categoria === 'Operaciones').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Permisos operativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <PermissionFiltersComponent
          search={search}
          categoriaFilter={categoriaFilter}
          onSearchChange={setSearch}
          onCategoriaFilterChange={setCategoriaFilter}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearError}
                  className="mt-2"
                >
                  Cerrar
                </Button>
              </div>
            )}
            
            <PermissionTable
              data={paginatedPermisos.results || []}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
