import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { MoreHorizontal, Edit, Trash2, Shield, User } from 'lucide-react';
import type { Role } from '@/types';

interface RoleTableProps {
  data: Role[];
  loading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function RoleTable({
  data,
  loading,
  onEdit,
  onDelete,
  page,
  totalPages,
  onPageChange
}: RoleTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {role.es_administrativo ? (
                      <Shield className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-green-600" />
                    )}
                    {role.nombre}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {role.descripcion}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={role.es_administrativo ? "information" : "success"}
                    badgeType="icon"
                    size="sm"
                  >
                    {role.es_administrativo ? "Administrativo" : "Cliente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="brand" badgeType="no-icon" size="sm">
                    {role.permisos?.length || 0} permisos
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(role.fecha_creacion).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(role)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(role)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
            No hay roles
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza creando un nuevo rol.
          </p>
        </div>
      )}

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
    </div>
  );
}
