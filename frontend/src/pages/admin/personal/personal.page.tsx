import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import { usePersonal } from '@/hooks/usePersonal';
import { PersonalTable } from './components/table';
import { PersonalFiltersComponent } from './components/filters';
import { PersonalStore } from './components/store';
import { PersonalDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function PersonalPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
  } = usePersonal();

  // Función para cargar datos con filtros y paginación
  const fetchPersonal = async (pageNumber = 1, searchQuery = "", estado = "all") => {
    const filters = {
      ...(searchQuery && { search: searchQuery }),
      ...(estado !== "all" && { estado: estado === "true" }),
    };
    
    await loadData(filters);
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
    fetchPersonal(page, searchDebounced, estadoFilter);
  }, [page, searchDebounced, estadoFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (personal: any) => {
    openStoreModal(personal);
  };

  const handleDelete = (personal: any) => {
    openDeleteModal(personal);
  };

  const handleStoreSubmit = async (data: any) => {
    if (selectedItem) {
      return await updateItem(selectedItem.id, data);
    } else {
      return await createItem(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      return await deleteItem(selectedItem.id);
    }
    return false;
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
            <p className="text-muted-foreground">
              Administra la información del personal de la empresa
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Personal
          </Button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Miembros registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.results?.filter(p => p.estado).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Inactivo</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.results?.filter(p => !p.estado).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Fuera del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <PersonalFiltersComponent
        search={search}
        estadoFilter={estadoFilter}
        onSearchChange={setSearch}
        onEstadoFilterChange={setEstadoFilter}
        loading={loading}
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personal</CardTitle>
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
          
          <PersonalTable
            data={data?.results || []}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              fetchPersonal(newPage, searchDebounced, estadoFilter);
            }}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <PersonalStore
        isOpen={isStoreModalOpen}
        onClose={closeStoreModal}
        onSubmit={handleStoreSubmit}
        initialData={selectedItem}
        loading={loading}
      />

      <PersonalDelete
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        personal={selectedItem}
        loading={loading}
      />
      </div>
    </AdminLayout>
  );
}