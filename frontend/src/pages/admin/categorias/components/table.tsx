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
import { MoreHorizontal, Edit, Trash2, Image as ImageIcon, FolderOpen } from 'lucide-react';
import type { Categoria } from '@/types';

interface CategoriasTableProps {
  data: Categoria[];
  loading: boolean;
  onEdit: (item: Categoria) => void;
  onDelete: (item: Categoria) => void;
}

export function CategoriasTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete 
}: CategoriasTableProps) {
  const getStatusBadge = (categoria: Categoria) => {
    if (!categoria.activa) {
      return <Badge variant="error" badgeType="icon" size="sm">Inactiva</Badge>;
    }
    return <Badge variant="success" badgeType="icon" size="sm">Activa</Badge>;
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
        No se encontraron categorías registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoría</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {categoria.imagen ? (
                      <img
                        src={categoria.imagen}
                        alt={categoria.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FolderOpen className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{categoria.nombre}</p>
                    <p className="text-sm text-gray-500">{categoria.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-gray-600 max-w-md truncate">
                  {categoria.descripcion || '-'}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="brand" badgeType="icon" size="sm">
                  {categoria.productos_count || 0} productos
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="default" badgeType="no-icon" size="sm">
                  {categoria.orden}
                </Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(categoria)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(categoria)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(categoria)}
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
  );
}
