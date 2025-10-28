import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getBitacora } from "@/services/bitacoraService";
import type { BitacoraLog } from "@/types/bitacora";

const ITEMS_PER_PAGE = 10;

const BitacoraPage: React.FC = () => {
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [rol, setRol] = useState<string>("all");

  const fetchLogs = async (pageNumber = 1, searchQuery = "", rolFilter = "all") => {
    setLoading(true);
    try {
      // Convertir "all" a cadena vacía para el backend
      const actualRolFilter = rolFilter === "all" ? "" : rolFilter;
      const data = await getBitacora(pageNumber, searchQuery, actualRolFilter);
      setLogs(data.results);
      setTotal(data.count);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error al cargar la bitácora:", error);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search, rol);
  }, [page, search, rol]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bitácora del Sistema</h1>
            <p className="text-muted-foreground">
              Visualiza la bitácora del sistema
            </p>
          </div>
        </div>
      
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Bitácora del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador + Filtro */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="w-full md:w-2/3">
                <Input
                  type="text"
                  placeholder="Buscar por usuario, acción, rol..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="w-full md:w-1/3">
                <Select
                  value={rol}
                  onValueChange={(value: string) => setRol(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Operador">Operador</SelectItem>
                    <SelectItem value="Conductor">Conductor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <p>Cargando registros...</p>
            ) : logs.length === 0 ? (
              <p>No hay registros de actividad.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Fecha/Hora</TableCell>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell>Acción</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>User Agent</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {log.fecha_hora
                              ? new Date(log.fecha_hora).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {log.usuario
                              ? `${log.usuario.first_name ?? ""} ${
                                  log.usuario.last_name ?? ""
                                }`.trim()
                              : "Sistema"}
                          </TableCell>
                          <TableCell>{log.usuario?.rol ?? "N/A"}</TableCell>
                          <TableCell>{log.accion ?? "-"}</TableCell>
                          <TableCell>{log.descripcion ?? "-"}</TableCell>
                          <TableCell>
                            <div className="hidden md:block">{log.ip ?? "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="hidden lg:block">
                              {log.user_agent ?? "-"}
                            </div>
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
                          onClick={() => page > 1 && fetchLogs(page - 1, search, rol)}
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
                              onClick={() => fetchLogs(pageNumber, search, rol)}
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
                              onClick={() => fetchLogs(totalPages, search, rol)}
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
                          onClick={() => page < totalPages && fetchLogs(page + 1, search, rol)}
                          size="default"
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BitacoraPage;