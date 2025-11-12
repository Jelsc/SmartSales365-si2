import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import AppRouter from "./router";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "../context/UserContext";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { PWAUpdatePrompt } from "../components/pwa-update-prompt";
import { PWAInstallButton } from "../components/pwa-install-button";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el elemento 'root' en el HTML.");

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <CartProvider>
          <AppRouter />
          <Toaster position="top-right" />
          <PWAUpdatePrompt />
          <PWAInstallButton />
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);