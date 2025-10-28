import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Car, AlertTriangle, CheckCircle } from 'lucide-react';
import { useConductores } from '@/hooks/useConductores';
import { ConductorTable } from './components/table';
import { ConductorFiltersComponent } from './components/filters';
import { ConductorStore } from './components/store';
import { ConductorDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function ConductoresPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [tipoLicenciaFilter, setTipoLicenciaFilter] = useState<string>("all");
  const [licenciaVencidaFilter, setLicenciaVencidaFilter] = useState<string>("all");

  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    licenciasVencidas,
    licenciasPorVencer,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
    loadLicenciasVencidas,
    loadLicenciasPorVencer,
  } = useConductores();

  // Función para cargar datos con filtros y paginación
  const fetchConductores = async (pageNumber = 1, searchQuery = "", estado = "all", tipoLicencia = "all", licenciaVencida = "all") => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(estado !== "all" && { estado }),
      ...(tipoLicencia !== "all" && { tipo_licencia: tipoLicencia }),
      ...(licenciaVencida !== "all" && { licencia_vencida: licenciaVencida === "true" }),
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
    fetchConductores(page, searchDebounced, estadoFilter, tipoLicenciaFilter, licenciaVencidaFilter);
    loadLicenciasVencidas();
    loadLicenciasPorVencer();
  }, [page, searchDebounced, estadoFilter, tipoLicenciaFilter, licenciaVencidaFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (conductor: any) => {
    openStoreModal(conductor);
  };

  const handleDelete = (conductor: any) => {
    openDeleteModal(conductor);
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

  const totalConductores = data?.count || 0;
  const conductoresActivos = data?.results?.filter(c => c.estado === 'disponible').length || 0;
  const conductoresInactivos = totalConductores - conductoresActivos;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Conductores</h1>
            <p className="text-muted-foreground">
              Administra la información de los conductores y sus licencias
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Conductor
          </Button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conductores</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConductores}
            </div>
            <p className="text-xs text-muted-foreground">
              Conductores registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conductores Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {conductoresActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {licenciasVencidas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren renovación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {licenciasPorVencer.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximas a vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Licencias */}
      {(licenciasVencidas.length > 0 || licenciasPorVencer.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Licencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {licenciasVencidas.length > 0 && (
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {licenciasVencidas.length} licencia(s) vencida(s) requieren renovación inmediata
                </span>
              </div>
            )}
            {licenciasPorVencer.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {licenciasPorVencer.length} licencia(s) próxima(s) a vencer en los próximos 30 días
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <ConductorFiltersComponent
        search={search}
        estadoFilter={estadoFilter}
        tipoLicenciaFilter={tipoLicenciaFilter}
        licenciaVencidaFilter={licenciaVencidaFilter}
        onSearchChange={setSearch}
        onEstadoFilterChange={setEstadoFilter}
        onTipoLicenciaFilterChange={setTipoLicenciaFilter}
        onLicenciaVencidaFilterChange={setLicenciaVencidaFilter}
        loading={loading}
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conductores</CardTitle>
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
          
          <ConductorTable
            data={data?.results || []}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              fetchConductores(newPage, searchDebounced, estadoFilter, tipoLicenciaFilter, licenciaVencidaFilter);
            }}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <ConductorStore
        isOpen={isStoreModalOpen}
        onClose={closeStoreModal}
        onSubmit={handleStoreSubmit}
        initialData={selectedItem}
        loading={loading}
      />

      <ConductorDelete
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        conductor={selectedItem}
        loading={loading}
      />
      </div>
    </AdminLayout>
  );
}