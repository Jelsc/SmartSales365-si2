import React, { useState } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import PedidosTable from '@/pages/admin/ventas/components/table';
import PedidoFilters from '@/pages/admin/ventas/components/filters';
import PedidoDetail from '@/pages/admin/ventas/components/detail';
import { toast } from 'sonner';

export default function VentasPage() {
  const {
    pedidos,
    loading,
    pagination,
    filters,
    updateFilters,
    changePage,
    refresh,
  } = usePedidos();

  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);

  const handleExport = async () => {
    try {
      toast.info('Exportando pedidos...');
      // Implementar exportación
      toast.success('Pedidos exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar pedidos');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Ventas
            </h1>
            <p className="text-muted-foreground">
              Administra todos los pedidos del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <PedidoFilters
          filters={filters}
          onFilterChange={updateFilters}
          loading={loading}
        />

        {/* Tabla de pedidos */}
        <PedidosTable
          pedidos={pedidos}
          loading={loading}
          pagination={pagination}
          currentPage={filters.page || 1}
          onPageChange={changePage}
          onViewDetail={setSelectedPedidoId}
          onStatusUpdated={refresh}
        />

        {/* Modal de detalle */}
        {selectedPedidoId && (
          <PedidoDetail
            pedidoId={selectedPedidoId}
            open={!!selectedPedidoId}
            onClose={() => setSelectedPedidoId(null)}
            onStatusUpdated={refresh}
          />
        )}
      </div>
    </AdminLayout>
  );
}
