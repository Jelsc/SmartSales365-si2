# 🚀 Sistema de Detección Automática de Entorno

## ✨ Características Principales

Este proyecto incluye un **sistema inteligente de detección automática** que configura las URLs de la API sin necesidad de configuración manual, funcionando perfectamente en:

- 🏠 **Desarrollo Local** (`localhost:5173` → `localhost:8000`)
- 🐳 **Docker Local** (`localhost:5173` → `localhost:8000`)
- ☁️ **Producción/Nube** (`cualquier-ip:5173` → `misma-ip:8000`)
- 🔄 **IP Dinámicas** - Si la IP cambia, se adapta automáticamente
- 🛡️ **AWS EC2** - Detecta automáticamente la IP pública de la instancia

## 🧠 Cómo Funciona la Detección Automática

### Frontend (React + Vite)

El frontend detecta automáticamente la URL correcta para conectar con el backend:

```typescript
// frontend/src/lib/api.ts
export function getApiBaseUrl(): string {
  // 1. Si hay variable de entorno, úsala
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl;

  // 2. Detección automática basada en window.location
  const { protocol, hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // 🏠 Entorno local → localhost:8000
    return `${protocol}//localhost:8000`;
  } else {
    // ☁️ Entorno de producción → misma-ip:8000
    return `${protocol}//${hostname}:8000`;
  }
}
```

### Backend (Django)

El backend configura automáticamente los hosts permitidos y CORS:

```python
# backend/core/settings.py
def get_allowed_hosts():
    """Configura automáticamente hosts permitidos"""
    return ["*"]  # Máxima compatibilidad

def configure_cors():
    """Configura CORS automáticamente"""
    return True, []  # Permite todos los orígenes
```

## 🔍 Detección de IP en AWS EC2

El sistema incluye una utilidad específica para detectar la IP pública en AWS EC2:

```python
# backend/detect_ip.py - Ejecuta este script para ver la IP detectada
python detect_ip.py
```

Este script:
1. Intenta obtener la IP desde los metadatos de EC2 (más rápido)
2. Si falla, usa servicios públicos de detección de IP como fallback
3. Si todo falla, usa la IP local

## 🎯 Casos de Uso Automáticos

| Entorno              | Frontend URL               | API URL                    | Configuración Necesaria |
| -------------------- | -------------------------- | -------------------------- | ----------------------- |
| **Desarrollo Local** | `http://localhost:5173`    | `http://localhost:8000`    | ✅ NINGUNA              |
| **Docker Local**     | `http://localhost:5173`    | `http://localhost:8000`    | ✅ NINGUNA              |
| **EC2 (Ejemplo)**    | `http://3.230.69.204:5173` | `http://3.230.69.204:8000` | ✅ NINGUNA              |
| **IP Nueva**         | `http://1.2.3.4:5173`      | `http://1.2.3.4:8000`      | ✅ NINGUNA              |
| **Dominio**          | `https://miapp.com:5173`   | `https://miapp.com:8000`   | ✅ NINGUNA              |

## 🚀 Comandos de Despliegue en AWS EC2

### Lanzamiento Automático

```bash
# 1. Clonar el repositorio en tu instancia EC2
git clone <URL-DEL-REPO>
cd transporte-si2

# 2. Copiar los archivos de ejemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Ejecutar con Docker (¡todo se configura automáticamente!)
docker compose up -d --build

# 4. Verificar la IP detectada y URLs
docker compose logs backend | grep -E "IP|URL|Host"
```

## 📋 Logs de Depuración

El sistema incluye logs automáticos que muestran la configuración:

```bash
# Frontend (Consola del navegador)
🏠 [API] Entorno local detectado → localhost:8000
🎯 [API] URL final de la API: http://localhost:8000

# Backend (Consola del servidor)
🌐 [Django] Hosts automáticos configurados: ['*']
🌍 [Django] CORS configurado para permitir TODOS los orígenes
🎨 [Django] Frontend URLs configuradas: http://localhost:5173, http://127.0.0.1:5173
```

## 🛠️ Solución de Problemas

### ❌ Problema: API no conecta desde EC2

```bash
# Verificar la detección de IP
docker compose exec backend python detect_ip.py

# Verificar que los puertos estén abiertos en AWS
# - Puerto 8000 (backend)
# - Puerto 5173 (frontend)
```

### ❌ Problema: CORS bloqueado

```bash
# El sistema permite todos los orígenes por defecto
# Si necesitas restricciones específicas, configura:
CORS_ALLOW_ALL_ORIGINS=False
FRONTEND_URL=http://tu-frontend-especifico:5173
```

### ❌ Problema: IP cambió en la nube

```bash
# ✅ No hay problema - se detecta automáticamente
# Reinicia los contenedores para refrescar la detección de IP:
docker compose restart
```

## 🎉 Beneficios del Sistema Automático

1. **🔄 Zero Configuration**: Funciona sin configuración inicial
2. **🌐 Universal**: Compatible con cualquier IP o dominio
3. **🐳 Docker Friendly**: Se adapta a contenedores automáticamente
4. **☁️ Cloud Ready**: Funciona en cualquier proveedor de nube
5. **🛡️ Error Resistant**: Si la IP cambia, sigue funcionando
6. **📊 Debug Friendly**: Logs claros para depuración

---

**¡Despliega en cualquier entorno sin configuración! 🚀**