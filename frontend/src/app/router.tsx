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

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Rutas del cliente con layout */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<HomePage />} />
        </Route>
        
        {/* Rutas de autenticación sin layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/code-verification" element={<CodeVerificationPage />} />
        <Route path="/profile/edit" element={<AccountSettingsPage />} />
        
        {/* Rutas de administración */}
        <Route path="/admin" element={<AdminLoginPage />} />
        {/* Rutas protegidas de administración */}
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requireAdmin={true}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/permisos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PermisosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bitacora"
          element={
            <ProtectedRoute requireAdmin={true}>
              <BitacoraPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/home"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Otras rutas de admin protegidas */}
        <Route
          path="/admin/flotas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Flotas (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conductores"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ConductoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/personal"
          element={
            <ProtectedRoute requireAdmin={true}>
              <PersonalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requireAdmin={true}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mantenimiento"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Mantenimiento (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rutas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Rutas (por implementar)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ventas"
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Ventas (por implementar)</div>
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
