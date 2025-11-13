import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/home/home.page";
import LoginPage from "@/pages/auth/login.page";
import RegisterPage from "@/pages/auth/register.page";
import CodeVerificationPage from "@/pages/auth/code-verification.page";
import AdminPage from "@/pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/admin-login.page";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import RolesPage from "@/pages/admin/roles/roles.page";
import PermisosPage from "@/pages/admin/permisos/permisos.page";
import BitacoraPage from "@/pages/admin/bitacora.page";
import PersonalPage from "@/pages/admin/personal/personal.page";
import ConductoresPage from "@/pages/admin/conductores/driver.page";
import UsuariosPage from "@/pages/admin/users/users.page";
import AccountSettingsPage from "@/pages/auth/account-settings.page";
import ClientLayout from "@/app/layout/client-layout";
import ProductosPage from "@/pages/client/productos/productos.page";
import ProductoDetallePage from "@/pages/client/productos/producto-detalle.page";
import ProductosAdminPage from "@/pages/admin/productos/productos.page";
import { CategoriasAdminPage } from "@/pages/admin/categorias/categorias.page";
import VentasPage from "@/pages/admin/ventas/ventas.page";
import OfertasPage from "@/pages/client/productos/ofertas.page";
import CarritoPage from "@/pages/client/carrito/carrito.page";
import CheckoutPage from "@/pages/client/checkout/checkout.page";
import MisPedidosPage from "@/pages/client/mis-pedidos/mis-pedidos.page";
import PedidoDetallePage from "@/pages/client/mis-pedidos/pedido-detalle.page";
import BuscarPage from "@/pages/client/buscar/buscar.page";
import DashboardPage from "@/pages/admin/dashboard/dashboard.page";
import ReportesPage from "@/pages/admin/reportes/reportes.page";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Rutas del cliente con layout */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/:id" element={<ProductoDetallePage />} />
          <Route path="ofertas" element={<OfertasPage />} />
          <Route path="buscar" element={<BuscarPage />} />
          
          {/* Rutas de carrito (requiere autenticación) */}
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <CarritoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mis-pedidos"
            element={
              <ProtectedRoute>
                <MisPedidosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mis-pedidos/:id"
            element={
              <ProtectedRoute>
                <PedidoDetallePage />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Rutas de autenticación sin layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/code-verification" element={<CodeVerificationPage />} />
        <Route path="/profile/edit" element={<AccountSettingsPage />} />
        
        {/* Rutas de administración */}
        <Route path="/panel" element={<AdminLoginPage />} />
        {/* Rutas protegidas de administración */}
        <Route
          path="/panel/roles"
          element={
            <ProtectedRoute requireAdmin={true}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/permisos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PermisosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/bitacora"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BitacoraPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/home"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/reportes"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ReportesPage />
            </ProtectedRoute>
          }
        />

        {/* Otras rutas de admin protegidas */}
        <Route
          path="/panel/flotas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Flotas (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/conductores"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ConductoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/personal"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PersonalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/usuarios"
          element={
            <ProtectedRoute requireAdmin={true}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/mantenimiento"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Mantenimiento (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/rutas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Rutas (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/ventas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <VentasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/productos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ProductosAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/categorias"
          element={
            <ProtectedRoute requireAdmin={true}>
              <CategoriasAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/pedidos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <VentasPage />
            </ProtectedRoute>
          }
        />

        {/* rutas protegidas de usuario */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <div>Perfil de usuario (protegido)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viajes"
          element={
            <ProtectedRoute>
              <div>Mis viajes (protegido)</div>
            </ProtectedRoute>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}
