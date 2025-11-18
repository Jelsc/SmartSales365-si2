# 🔧 Configuración de Azure Computer Vision (Docker)

## Paso a Paso para Obtener Credenciales de Azure

### 1. Crear Recurso en Azure Portal

1. **Acceder a Azure Portal:**

   - Ve a https://portal.azure.com
   - Inicia sesión con tu cuenta de Azure
   - Si no tienes cuenta, crea una gratuita en https://azure.microsoft.com/free/

2. **Crear nuevo recurso:**

   - Haz clic en "Crear un recurso" (Create a resource) o el botón "+" en la esquina superior izquierda
   - En el buscador, escribe: **"Computer Vision"**
   - Selecciona **"Computer Vision"** de Microsoft
   - Haz clic en "Crear" (Create)

3. **Configurar el recurso:**

   - **Suscripción:** Selecciona tu suscripción (si tienes varias)
   - **Grupo de recursos:**
     - Crea uno nuevo: "SmartSales365" (o el que prefieras)
     - O selecciona uno existente
   - **Región:** Selecciona la más cercana:
     - **East US** (Estados Unidos Este)
     - **West Europe** (Europa Oeste)
     - **Southeast Asia** (Asia Sudeste)
   - **Nombre:** `smartsales-vision` (debe ser único globalmente, puede que necesites agregar números)
   - **Plan de tarifa:**
     - **F0 (Gratis):** 20 llamadas/minuto, 5,000/mes - **RECOMENDADO para empezar**
     - **S1 (Estándar):** $1 por 1,000 transacciones
   - Marca la casilla de términos y condiciones

4. **Crear:**
   - Haz clic en "Revisar + crear" (Review + create)
   - Espera la validación (debe mostrar "Validación superada")
   - Haz clic en "Crear" (Create)
   - Espera 1-2 minutos a que se complete el despliegue
   - Verás una notificación cuando esté listo

### 2. Obtener Credenciales (Endpoint y Key)

1. **Ir al recurso creado:**

   - Haz clic en "Ir al recurso" (Go to resource) en la notificación
   - O ve a "Todos los recursos" (All resources) en el menú lateral izquierdo
   - Busca y haz clic en tu recurso de Computer Vision (el nombre que pusiste)

2. **Obtener Endpoint y Key:**

   - En el menú izquierdo, busca y haz clic en **"Keys and Endpoint"** (Claves y punto de conexión)
   - Verás dos secciones:

   **a) Endpoint (Punto de conexión):**

   - Copia la URL completa, ejemplo:
     ```
     https://smartsales-vision.cognitiveservices.azure.com/
     ```
   - ⚠️ **IMPORTANTE:** Asegúrate de copiar la barra `/` al final

   **b) Keys (Claves):**

   - Verás **KEY 1** y **KEY 2** (ambas funcionan igual)
   - Copia **KEY 1** (haz clic en el ícono de copiar o selecciona y copia)
   - Ejemplo de formato:
     ```
     a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
     ```

### 3. Configurar en Docker (Backend)

Como estás usando Docker, las variables se cargan desde `backend/.env`:

1. **Crear o editar el archivo `.env` en el backend:**

   ```bash
   # Desde la raíz del proyecto
   cd backend
   nano .env  # o usa tu editor preferido (VS Code, Notepad++, etc.)
   ```

2. **Agregar las siguientes líneas al final del archivo:**

   ```env
   # Azure Computer Vision
   AZURE_VISION_ENDPOINT=https://tu-recurso.cognitiveservices.azure.com/
   AZURE_VISION_KEY=tu-key-aqui
   ```

3. **Reemplazar con tus valores reales:**

   ```env
   # Ejemplo real (NO uses estos valores, son solo ejemplo):
   AZURE_VISION_ENDPOINT=https://smartsales-vision.cognitiveservices.azure.com/
   AZURE_VISION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

4. **Guardar el archivo** (Ctrl+S o Cmd+S)

### 4. Reconstruir y Reiniciar Docker

1. **Reconstruir el contenedor del backend** (para instalar las nuevas dependencias):

   ```bash
   # Desde la raíz del proyecto
   docker-compose build backend
   ```

2. **Reiniciar los contenedores:**

   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Ver los logs para verificar:**
   ```bash
   docker-compose logs -f backend
   ```
   - Si ves errores relacionados con Azure, verifica las credenciales
   - Si no hay errores, la configuración está lista

### 5. Verificar que Funciona

1. **Verificar que las variables están cargadas:**

   ```bash
   docker-compose exec backend python -c "from django.conf import settings; print('Endpoint:', settings.AZURE_VISION_ENDPOINT[:30] if settings.AZURE_VISION_ENDPOINT else 'No configurado'); print('Key:', 'Configurado' if settings.AZURE_VISION_KEY else 'No configurado')"
   ```

2. **Probar el endpoint** (desde tu máquina local o dentro del contenedor):
   ```bash
   # Obtener un token primero (haz login en tu app)
   curl -X POST http://localhost:8000/api/productos/buscar-por-imagen/ \
     -H "Authorization: Bearer TU_TOKEN_AQUI" \
     -F "image=@/ruta/a/tu/imagen.jpg"
   ```

## ⚠️ Notas Importantes para Docker

- **Seguridad:** El archivo `backend/.env` NO debe subirse a git (ya está en `.gitignore`)
- **Variables de entorno:** Docker carga automáticamente las variables desde `backend/.env`
- **Reinicio necesario:** Después de agregar las variables, reinicia los contenedores
- **Límites:** El tier gratuito (F0) tiene límites:
  - 20 llamadas por minuto
  - 5,000 llamadas por mes
  - Monitorea tu uso en Azure Portal → "Métricas"
- **Costo:** El tier S1 cobra aproximadamente $1 por 1,000 transacciones
- **Región:** Elige una región cercana para mejor rendimiento y menor latencia

## 🔍 Verificar que Funciona

1. Abre la app mobile
2. Ve a la pestaña de Productos
3. Toca el ícono de búsqueda por imagen (📷)
4. Selecciona o toma una foto
5. Presiona "Buscar Productos"
6. Deberías ver resultados con porcentajes de similitud

## ❌ Solución de Problemas

### Error: "Búsqueda por imagen no está configurada"

**Solución:**

1. Verifica que las variables estén en `backend/.env`:
   ```bash
   cat backend/.env | grep AZURE_VISION
   ```
2. Verifica que no tengan espacios extra:
   ```env
   AZURE_VISION_ENDPOINT=https://...  # ✅ Correcto
   AZURE_VISION_ENDPOINT = https://...  # ❌ Incorrecto (espacios)
   ```
3. Reinicia los contenedores:
   ```bash
   docker-compose restart backend
   ```

### Error: "401 Unauthorized"

**Solución:**

1. Verifica que la KEY sea correcta (cópiala de nuevo desde Azure Portal)
2. Asegúrate de copiar la KEY completa sin espacios al inicio o final
3. Verifica que no haya caracteres especiales mal copiados
4. Prueba con KEY 2 si KEY 1 no funciona

### Error: "Endpoint incorrecto"

**Solución:**

1. Verifica que el ENDPOINT termine con `/`:
   ```env
   AZURE_VISION_ENDPOINT=https://smartsales-vision.cognitiveservices.azure.com/  # ✅
   AZURE_VISION_ENDPOINT=https://smartsales-vision.cognitiveservices.azure.com   # ❌
   ```
2. Asegúrate de que sea la URL completa (no solo el nombre del recurso)
3. Verifica que no tenga `http://` en lugar de `https://`

### Error: "ModuleNotFoundError: No module named 'azure'"

**Solución:**

1. Reconstruye el contenedor del backend:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

### No encuentra productos similares

**Solución:**

- Esto es normal si no hay productos con imágenes similares en tu catálogo
- Prueba con una imagen de un producto que ya existe en tu catálogo
- Asegúrate de que los productos tengan imágenes cargadas
- El umbral de similitud mínimo es 30% (configurado en el código)

### Verificar configuración dentro del contenedor

```bash
# Entrar al contenedor
docker-compose exec backend bash

# Verificar variables
python -c "from django.conf import settings; print('Endpoint:', settings.AZURE_VISION_ENDPOINT); print('Key:', 'Configurado' if settings.AZURE_VISION_KEY else 'No configurado')"

# Salir del contenedor
exit
```
