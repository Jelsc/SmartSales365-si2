import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Shield } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { RoleTable } from './components/table';
import { RoleFiltersComponent } from './components/filters';
import { RoleStore } from './components/store';
import { RoleDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function RolesPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [esAdministrativoFilter, setEsAdministrativoFilter] = useState<string>("all");

  const {
    roles,
    permissions,
    loading,
    error,
    selectedRole,
    isStoreModalOpen,
    isDeleteModalOpen,
    loadRoles,
    loadPermissions,
    createRole,
    updateRole,
    deleteRole,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
  } = useRoles();

  // Función para cargar datos con filtros y paginación
  const fetchRoles = async (pageNumber = 1, searchQuery = "", esAdministrativo = "all") => {
    const filters = {
      ...(searchQuery && { search: searchQuery }),
      ...(esAdministrativo !== "all" && { es_administrativo: esAdministrativo === "true" }),
    };
    
    await loadRoles(filters);
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
    fetchRoles(page, searchDebounced, esAdministrativoFilter);
    loadPermissions(); // Cargar permisos al montar el componente
  }, [page, searchDebounced, esAdministrativoFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (role: any) => {
    openStoreModal(role);
  };

  const handleDelete = (role: any) => {
    openDeleteModal(role);
  };

  const handleStoreSubmit = async (data: any) => {
    if (selectedRole) {
      return await updateRole(selectedRole.id, data);
    } else {
      return await createRole(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedRole) {
      return await deleteRole(selectedRole.id);
    }
    return false;
  };

  const totalPages = Math.ceil((roles?.count || 0) / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
            <p className="text-muted-foreground">
              Administra los roles y permisos del sistema
            </p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto "
          >
            <Plus className="h-4 w-4" />
            Agregar Rol
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Roles registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles Administrativos</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {roles?.results?.filter(r => r.es_administrativo).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Con permisos de administración
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles de Cliente</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {roles?.results?.filter(r => !r.es_administrativo).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Para usuarios finales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <RoleFiltersComponent
          search={search}
          esAdministrativoFilter={esAdministrativoFilter}
          onSearchChange={setSearch}
          onEsAdministrativoFilterChange={setEsAdministrativoFilter}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Roles</CardTitle>
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
            
            <RoleTable
              data={roles?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchRoles(newPage, searchDebounced, esAdministrativoFilter);
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <RoleStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedRole}
          loading={loading}
          permissions={permissions}
        />

        <RoleDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          role={selectedRole}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
