import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, Package } from 'lucide-react';
import type { Pedido } from '@/types/pedido';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/types/pedido';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PedidosTableProps {
  pedidos: Pedido[];
  loading: boolean;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewDetail: (pedidoId: number) => void;
  onStatusUpdated: () => void;
}

export default function PedidosTable({
  pedidos,
  loading,
  pagination,
  currentPage,
  onPageChange,
  onViewDetail,
}: PedidosTableProps) {
  const pageSize = 10;
  const totalPages = Math.ceil(pagination.count / pageSize);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toFixed(2)}`;
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  if (!loading && pedidos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay pedidos
        </h3>
        <p className="text-gray-600">
          No se encontraron pedidos con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número de Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-medium">
                  {pedido.numero_pedido}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {pedido.usuario_nombre || 'Cliente'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {pedido.usuario_email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(pedido.creado)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={ESTADO_COLORS[pedido.estado]}
                  >
                    {ESTADO_LABELS[pedido.estado]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(pedido.total)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(pedido.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="border-t p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Mostrar solo algunas páginas alrededor de la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <span className="px-4">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    currentPage < totalPages && onPageChange(currentPage + 1)
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-sm text-gray-600 text-center mt-2">
            Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, pagination.count)} de{' '}
            {pagination.count} pedidos
          </div>
        </div>
      )}
    </div>
  );
}
