import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { useProductos } from '@/hooks';
import { ProductosTable } from './components/table';
import { ProductosFiltersComponent } from './components/filters';
import { ProductosStore } from './components/store';
import { ProductosDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';
import type { Categoria } from '@/types';
import { categoriasService } from '@/services';

const ITEMS_PER_PAGE = 10;

export default function ProductosAdminPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

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
  } = useProductos();

  // Función para cargar datos con filtros y paginación
  const fetchProductos = async (pageNumber = 1, searchQuery = "", categoria = "") => {
    const filters: any = {
      page: pageNumber,
      page_size: ITEMS_PER_PAGE,
      ...(searchQuery && { search: searchQuery }),
      ...(categoria && categoria !== '0' && { categoria: parseInt(categoria) }),
      ordering: '-creado',
    };
    
    await loadData(filters);
  };

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await categoriasService.getAll();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    loadCategorias();
  }, []);

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchProductos(page, searchDebounced, categoriaFilter);
  }, [page, searchDebounced, categoriaFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (producto: any) => {
    openStoreModal(producto);
  };

  const handleDelete = (producto: any) => {
    openDeleteModal(producto);
  };

  const handleView = (producto: any) => {
    window.open(`/productos/${producto.id}`, '_blank');
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
      const success = await deleteItem(selectedItem.id);
      if (success) {
        fetchProductos(page, searchDebounced, categoriaFilter);
      }
      return success;
    }
    return false;
  };

  const handleSearchSubmit = () => {
    setPage(1);
    fetchProductos(1, search, categoriaFilter);
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
            <p className="text-muted-foreground">
              Administra el catálogo de productos del sistema
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En el catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.results?.filter(p => p.activo).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles en tienda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Oferta</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.results?.filter(p => p.en_oferta).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Con descuento activo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ProductosFiltersComponent
        search={search}
        categoriaFilter={categoriaFilter}
        categorias={categorias}
        onSearchChange={setSearch}
        onCategoriaFilterChange={setCategoriaFilter}
        onSearchSubmit={handleSearchSubmit}
        loading={loading}
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
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
          
          <ProductosTable
            data={data?.results || []}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              fetchProductos(newPage, searchDebounced, categoriaFilter);
            }}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <ProductosStore
        isOpen={isStoreModalOpen}
        onClose={closeStoreModal}
        onSubmit={handleStoreSubmit}
        initialData={selectedItem}
        loading={loading}
      />

      <ProductosDelete
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        producto={selectedItem}
        loading={loading}
      />
      </div>
    </AdminLayout>
  );
}
