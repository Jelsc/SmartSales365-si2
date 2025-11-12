import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { MoreHorizontal, Edit, Trash2, Eye, Package } from 'lucide-react';
import type { Producto } from '@/types';

interface ProductosTableProps {
  data: Producto[];
  loading: boolean;
  onEdit: (item: Producto) => void;
  onDelete: (item: Producto) => void;
  onView?: (item: Producto) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductosTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: ProductosTableProps) {
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(precio);
  };

  const getStatusBadge = (producto: Producto) => {
    if (!producto.activo) {
      return <Badge variant="error" badgeType="icon" size="sm">Inactivo</Badge>;
    }
    return <Badge variant="success" badgeType="icon" size="sm">Activo</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron productos registrados
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((producto) => {
              // Prioridad: campo imagen directo > ProductoImagen principal > primera imagen > sin imagen
              const imagenUrl = producto.imagen || 
                               producto.imagenes?.find(img => img.es_principal)?.imagen || 
                               producto.imagenes?.[0]?.imagen;
              
              return (
                <TableRow key={producto.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {imagenUrl ? (
                          <img
                            src={imagenUrl}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{producto.nombre}</p>
                        {producto.sku && (
                          <Badge variant="brand" badgeType="no-icon" size="sm" className="font-mono">
                            {producto.sku}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {typeof producto.categoria === 'object' && producto.categoria?.nombre 
                        ? producto.categoria.nombre 
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatPrecio(producto.precio_final || producto.precio)}</p>
                      {producto.en_oferta && producto.precio_oferta && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrecio(producto.precio)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={producto.stock > 0 ? 'success' : 'error'}
                      badgeType="icon"
                      size="sm"
                    >
                      {producto.stock} unidades
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(producto)}
                      {producto.en_oferta && (
                        <Badge variant="error" badgeType="no-icon" size="sm">Oferta</Badge>
                      )}
                      {producto.destacado && (
                        <Badge variant="warning" badgeType="no-icon" size="sm">Destacado</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(producto)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver en tienda
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(producto)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(producto)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && onPageChange(page - 1)}
                size="default"
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === page;
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={isActive}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    isActive={page === totalPages}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && onPageChange(page + 1)}
                size="default"
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
