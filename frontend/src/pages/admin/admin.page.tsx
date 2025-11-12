import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import {
  BarChart3,
  Truck,
  Users,
  Settings,
  MapPin,
  UserCog,
  Shield,
  Home,
  Bell,
  Route,
  Car,
  UserCheck,
  ShieldCheck,
  BookOpen,
  ShoppingCart,
  Package,
  LayoutGrid,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarModule {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  route: string;
  options?: ModuleOption[];
}

interface ModuleOption {
  id: string;
  label: string;
  route: string;
  icon?: React.ComponentType<any>;
}

const sidebarModules: SidebarModule[] = [
  {
    id: "usuarios-sistema",
    name: "Usuarios y Seguridad",
    icon: ShieldCheck,
    route: "/admin/usuarios",
    options: [
      {
        id: "usuarios",
        label: "Usuarios",
        route: "/admin/usuarios",
        icon: Users,
      },
      {
        id: "roles",
        label: "Roles",
        route: "/admin/roles",
        icon: UserCog,
      },
      {
        id: "permisos",
        label: "Permisos",
        route: "/admin/permisos",
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: "administracion-interna",
    name: "Administración Interna",
    icon: UserCog,
    route: "/admin/personal",
    options: [
      {
        id: "personal",
        label: "Personal",
        route: "/admin/personal",
        icon: Users,
      },
      {
        id: "conductores",
        label: "Conductores",
        route: "/admin/conductores",
        icon: Truck,
      },
    ],
  },
  {
    id: "e-commerce",
    name: "E-Commerce",
    icon: ShoppingCart,
    route: "/admin/productos",
    options: [
      {
        id: "productos",
        label: "Productos",
        route: "/admin/productos",
        icon: Package,
      },
      {
        id: "categorias",
        label: "Categorías",
        route: "/admin/categorias",
        icon: LayoutGrid,
      },
      {
        id: "ventas",
        label: "Ventas",
        route: "/admin/ventas",
        icon: ShoppingCart,
      },
      {
        id: "pedidos",
        label: "Pedidos",
        route: "/admin/pedidos",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "notificaciones",
    name: "Notificaciones",
    icon: Bell,
    route: "/admin/notificaciones",
    options: [
      {
        id: "ver-notificaciones",
        label: "Ver notificaciones",
        route: "/admin/notificaciones",
        icon: Bell,
      },
    ],
  },
  {
    id: "bitacora",
    name: "Bitácora",
    icon: BookOpen,
    route: "/admin/bitacora",
    options: [
      {
        id: "ver-bitacora",
        label: "Ver bitácora",
        route: "/admin/bitacora",
        icon: BookOpen,
      },
    ],
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<SidebarModule | null>(null);

  // Cerrar con ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openModule = (module: SidebarModule) => {
    setSelected(module);
    setIsOpen(true);
  };

  const goTo = (route: string) => {
    setIsOpen(false);
    navigate(route);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestiona todos los aspectos de tu sistema de transporte
            </p>
          </div>
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sidebarModules.map((module) => (
            <button
              key={module.id}
              className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:bg-blue-50 transition-colors"
              onClick={() => openModule(module)}
            >
              <module.icon className="w-10 h-10 text-blue-600 mb-3" />
              <span className="text-lg font-semibold text-gray-700">
                {module.name}
              </span>
            </button>
          ))}
        </div>

        {/* Modal de opciones */}
        {isOpen && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selected?.icon && (
                    <selected.icon className="w-6 h-6 text-blue-600" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selected?.name}
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-3">
                  {(selected?.options?.length
                    ? selected.options
                    : [
                        {
                          id: "ir",
                          label: "Ir al módulo",
                          route: selected?.route || "/",
                        },
                      ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => opt.route && goTo(opt.route)}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors text-left"
                    >
                      {opt.icon ? (
                        <opt.icon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <span className="inline-block w-5 h-5 rounded bg-blue-100" />
                      )}
                      <span className="font-medium text-gray-700">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}