import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { MoreHorizontal, Eye, Lock, CheckCircle, Shield, Code, Tag } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: string;
}

interface PermissionTableProps {
  data: Permission[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PermissionTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange
}: PermissionTableProps) {
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  const getCategoryBadge = (contentType: string) => {
    const categoryMap: Record<string, { variant: "information" | "success" | "brand" | "warning" | "neutral" | "error"; badgeType: "icon" | "no-icon" | "dot" }> = {
      'autenticación': { variant: 'information', badgeType: 'icon' },
      'gestión_de_usuarios': { variant: 'success', badgeType: 'icon' },
      'operaciones': { variant: 'brand', badgeType: 'icon' },
      'reportes': { variant: 'warning', badgeType: 'icon' },
      'administración': { variant: 'neutral', badgeType: 'no-icon' },
      'monitoreo': { variant: 'information', badgeType: 'dot' },
      'configuración': { variant: 'brand', badgeType: 'no-icon' },
    };

    const category = categoryMap[contentType] || { variant: 'neutral', badgeType: 'no-icon' };
    
    return (
      <Badge 
        variant={category.variant} 
        badgeType={category.badgeType}
        size="sm"
      >
        {contentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleViewDetails = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {permission.name}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {permission.codename}
                  </code>
                </TableCell>
                <TableCell>
                  {getCategoryBadge(permission.content_type)}
                </TableCell>
                <TableCell>
                  <Badge variant="success" badgeType="icon" size="sm">
                    Activo
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(permission)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
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
          <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
            No hay permisos
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Los permisos se cargan automáticamente del sistema.
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

      {/* Modal de detalles */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Detalles del Permiso
            </DialogTitle>
            <DialogDescription>
              Información completa del permiso seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedPermission && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                  </div>
                  <p className="text-lg font-semibold">{selectedPermission.name}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Código</span>
                  </div>
                  <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                    {selectedPermission.codename}
                  </code>
                </div>
              </div>

              {/* Categoría y estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Categoría</span>
                  </div>
                  {getCategoryBadge(selectedPermission.content_type)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Estado</span>
                  </div>
                  <Badge variant="success" badgeType="icon" size="sm">
                    Activo
                  </Badge>
                </div>
              </div>

              {/* Descripción del permiso */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Descripción</span>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Este permiso permite {selectedPermission.name.toLowerCase()}. 
                    Es utilizado para controlar el acceso a funcionalidades específicas del sistema.
                  </p>
                </div>
              </div>

              {/* Información técnica */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Información Técnica</span>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{selectedPermission.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Content Type:</span>
                    <span className="font-mono">{selectedPermission.content_type}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
