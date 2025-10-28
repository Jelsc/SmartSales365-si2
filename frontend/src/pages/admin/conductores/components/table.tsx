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
import { MoreHorizontal, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import type { Conductor } from '@/types';

interface ConductorTableProps {
  data: Conductor[];
  loading: boolean;
  onEdit: (item: Conductor) => void;
  onDelete: (item: Conductor) => void;
  onView?: (item: Conductor) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ConductorTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: ConductorTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (esActivo: boolean) => {
    return (
      <Badge 
        variant={esActivo ? "success" : "error"} 
        badgeType="icon"
        size="sm"
      >
        {esActivo ? "Activo" : "Inactivo"}
      </Badge>
    );
  };

  const getLicenseStatusBadge = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return (
        <Badge variant="error" badgeType="icon" size="sm">
          Vencida
        </Badge>
      );
    } else if (diasRestantes <= 30) {
      return (
        <Badge variant="warning" badgeType="icon" size="sm">
          Por vencer ({diasRestantes} días)
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" badgeType="dot" size="sm">
          Vigente
        </Badge>
      );
    }
  };

  const getLicenseNumberBadge = (nroLicencia: string) => {
    return (
      <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
        {nroLicencia}
      </Badge>
    );
  };

  const getOperationalStatusBadge = (estado: string) => {
    const variants: Record<string, "success" | "warning" | "information" | "error" | "neutral"> = {
      'disponible': 'success',
      'ocupado': 'warning',
      'descanso': 'information',
      'inactivo': 'error',
    };

    const labels: Record<string, string> = {
      'disponible': 'Disponible',
      'ocupado': 'Ocupado',
      'descanso': 'Descanso',
      'inactivo': 'Inactivo',
    };

    const badgeTypes: Record<string, "icon" | "dot" | "no-icon"> = {
      'disponible': 'dot',
      'ocupado': 'icon',
      'descanso': 'icon',
      'inactivo': 'icon',
    };

    return (
      <Badge 
        variant={variants[estado] || 'neutral'} 
        badgeType={badgeTypes[estado] || 'no-icon'}
        size="sm"
      >
        {labels[estado] || estado}
      </Badge>
    );
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
        No se encontraron conductores registrados
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Nro. Licencia</TableHead>
              <TableHead>Vencimiento Licencia</TableHead>
              <TableHead>Experiencia</TableHead>
              <TableHead>Estado Operacional</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((conductor) => (
              <TableRow key={conductor.id}>
                <TableCell className="font-medium">
                  {conductor.nombre} {conductor.apellido}
                </TableCell>
                <TableCell>{conductor.email}</TableCell>
                <TableCell>{conductor.telefono}</TableCell>
                <TableCell>{getLicenseNumberBadge(conductor.nro_licencia)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">{formatDate(conductor.fecha_venc_licencia)}</div>
                    {getLicenseStatusBadge(conductor.fecha_venc_licencia)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="brand" badgeType="no-icon" size="sm">
                    {conductor.experiencia_anios} años
                  </Badge>
                </TableCell>
                <TableCell>{getOperationalStatusBadge(conductor.estado)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(conductor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(conductor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(conductor)}
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
