import React, { useEffect } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import { useCategorias } from '@/hooks';
import { CategoriasTable } from './components/table';
import { CategoriasStore } from './components/store';
import { CategoriasDelete } from './components/delete';

export function CategoriasAdminPage() {
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
  } = useCategorias();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (categoria: any) => {
    openStoreModal(categoria);
  };

  const handleDelete = (categoria: any) => {
    openDeleteModal(categoria);
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
      // Ya no es necesario llamar loadData() aquí, el hook lo hace automáticamente
    }
    return false;
  };

  // Calcular estadísticas
  const totalCategorias = data.length;
  const categoriasActivas = data.filter(c => c.activa).length;
  const categoriasInactivas = data.filter(c => !c.activa).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-600">Administra las categorías de productos</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Categoría
          </Button>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategorias}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{categoriasActivas}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactivas</p>
                <p className="text-2xl font-bold text-red-600">{categoriasInactivas}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabla de categorías */}
        <Card className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <CategoriasTable
            data={data}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        {/* Modales */}
        <CategoriasStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
        />

        <CategoriasDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          categoria={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
