# 📦 Módulo de Ventas/Pedidos - Administración

## 📋 Descripción General

Sistema completo de gestión de pedidos para administradores. Permite visualizar, filtrar, buscar y actualizar el estado de todos los pedidos del sistema.

## 🎯 Características Implementadas

### ✅ Página Principal de Ventas
- **Ubicación:** `/admin/ventas` y `/admin/pedidos` (mismo componente)
- **Componente:** `ventas.page.tsx`
- Visualización de todos los pedidos en tabla
- Paginación automática
- Actualización manual con botón refresh
- Exportación a CSV (preparado para implementar)

### 🔍 Filtros Avanzados
- **Componente:** `filters.tsx`
- Búsqueda por número de pedido
- Filtro por estado (7 estados disponibles)
- Rango de fechas (desde/hasta)
- Botón para limpiar filtros
- Filtros persistentes al cambiar de página

### 📊 Tabla de Pedidos
- **Componente:** `table.tsx`
- Columnas:
  - Número de pedido (formato: ORD-YYYYMMDD-XXXXX)
  - Cliente (nombre y email)
  - Fecha de creación
  - Estado con badge colorido
  - Total en Bs.
  - Botón "Ver detalle"
- Paginación con navegación completa
- Ordenamiento por fecha (más recientes primero)
- Estado de carga con spinner
- Mensaje cuando no hay resultados

### 🔎 Modal de Detalle
- **Componente:** `detail.tsx`
- **Secciones:**
  1. **Información del Cliente**
     - Nombre completo
     - Email de contacto
  
  2. **Dirección de Envío**
     - Destinatario
     - Teléfono
     - Dirección completa
     - Ciudad y departamento
     - Referencias adicionales
  
  3. **Productos del Pedido**
     - Tabla con productos
     - SKU y variante
     - Cantidad y precio unitario
     - Subtotal por producto
  
  4. **Resumen de Pago**
     - Subtotal de productos
     - Costo de envío
     - Descuentos aplicados
     - Total final
     - Método de pago usado
  
  5. **Timeline del Pedido**
     - Historial completo con fechas
     - Estados: Creado, Pagado, Confirmado, Preparando, Enviado, Entregado, Cancelado
  
  6. **Actualizar Estado**
     - Selector con todos los estados
     - Botón para confirmar cambio
     - Actualización en tiempo real
     - Feedback visual

### 🎨 Estados del Pedido
```typescript
enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',      // Amarillo
  PAGADO = 'PAGADO',            // Verde
  CONFIRMADO = 'CONFIRMADO',     // Azul
  PREPARANDO = 'PREPARANDO',     // Púrpura
  ENVIADO = 'ENVIADO',          // Índigo
  ENTREGADO = 'ENTREGADO',      // Esmeralda
  CANCELADO = 'CANCELADO',      // Rojo
}
```

## 🛠️ Estructura Técnica

### Types (`types/pedido.ts`)
```typescript
- EstadoPedido (enum)
- ItemPedido (interface)
- DireccionEnvio (interface)
- Pedido (interface)
- PedidoDetalle (extends Pedido)
- TimelineItem (interface)
- PedidoFilters (interface)
- PedidosResponse (interface)
- ActualizarEstadoRequest (interface)
- ESTADO_COLORS (mapping)
- ESTADO_LABELS (mapping)
```

### Service (`services/ventasService.ts`)
```typescript
ventasService.getAllPedidos(filters?: PedidoFilters): Promise<PedidosResponse>
ventasService.getPedidoById(id: number): Promise<PedidoDetalle>
ventasService.actualizarEstado(id, data): Promise<Pedido>
ventasService.trackPedido(id: number): Promise<{timeline: any[]}>
ventasService.getEstadisticas(): Promise<Stats> (preparado)
ventasService.exportarPedidos(filters?): Promise<Blob> (preparado)
```

### Hooks (`hooks/usePedidos.ts`)
```typescript
// Hook principal para lista de pedidos
usePedidos(initialFilters?)
  - pedidos: Pedido[]
  - loading: boolean
  - error: string | null
  - pagination: {count, next, previous}
  - filters: PedidoFilters
  - updateFilters(newFilters)
  - changePage(page)
  - refresh()

// Hook para detalle de pedido
usePedidoDetalle(id: number | null)
  - pedido: PedidoDetalle | null
  - loading: boolean
  - error: string | null
  - refresh()

// Hook para actualizar estado
useActualizarEstado()
  - actualizarEstado(id, estado, notas?): Promise<boolean>
  - loading: boolean
```

### Componentes

#### 1. `ventas.page.tsx`
- Layout principal con AdminLayout
- Header con título y botones
- Integración de filtros y tabla
- Manejo de modal de detalle
- Auto-refresh después de actualizar estado

#### 2. `components/filters.tsx`
- Card con 4 inputs de filtro
- Select para estados
- Inputs de fecha
- Input de búsqueda
- Botón limpiar filtros (solo visible si hay filtros activos)

#### 3. `components/table.tsx`
- Table responsive de shadcn/ui
- Paginación con navegación inteligente
- Estados de carga y vacío
- Formateo de fechas con date-fns
- Formateo de moneda en Bs.
- Badges con colores según estado

#### 4. `components/detail.tsx`
- Dialog modal de shadcn/ui
- Scroll vertical automático
- 6 secciones informativas
- Select para cambiar estado
- Validación de cambios
- Notas adicionales del pedido

## 📡 API Endpoints Usados

```
GET  /ventas/pedidos/                    - Lista con filtros y paginación
GET  /ventas/pedidos/{id}/detalle/       - Detalle completo
GET  /ventas/pedidos/{id}/rastrear/      - Timeline
PATCH /ventas/pedidos/{id}/actualizar_estado/ - Cambiar estado
```

### Parámetros de Filtro (Query String)
- `estado`: EstadoPedido
- `fecha_inicio`: YYYY-MM-DD
- `fecha_fin`: YYYY-MM-DD
- `usuario`: number (ID del usuario)
- `search`: string (búsqueda por número de pedido)
- `page`: number
- `page_size`: number (default: 10)

## 🎯 Flujo de Uso

### 1. Ver Pedidos
```
Admin → Sidebar → E-Commerce → Ventas
↓
Se carga lista de pedidos
↓
Tabla muestra: número, cliente, fecha, estado, total
```

### 2. Filtrar Pedidos
```
Usar filtros en card superior
↓
Seleccionar estado (ej: PAGADO)
↓
Seleccionar rango de fechas
↓
Buscar por número específico
↓
Tabla se actualiza automáticamente
```

### 3. Ver Detalle
```
Click en "Ver detalle"
↓
Modal se abre con toda la información
↓
Ver cliente, dirección, productos, pagos, timeline
```

### 4. Actualizar Estado
```
En modal de detalle
↓
Seleccionar nuevo estado en dropdown
↓
Click "Actualizar"
↓
Backend actualiza con timestamp automático
↓
Modal se refresca
↓
Tabla se refresca
↓
Toast de confirmación
```

## 🎨 Estilos y UX

### Colores por Estado
- **PENDIENTE:** bg-yellow-100, text-yellow-800 (⚠️ Requiere atención)
- **PAGADO:** bg-green-100, text-green-800 (✅ Pago confirmado)
- **CONFIRMADO:** bg-blue-100, text-blue-800 (📋 Orden confirmada)
- **PREPARANDO:** bg-purple-100, text-purple-800 (📦 En preparación)
- **ENVIADO:** bg-indigo-100, text-indigo-800 (🚚 En camino)
- **ENTREGADO:** bg-emerald-100, text-emerald-800 (✨ Completado)
- **CANCELADO:** bg-red-100, text-red-800 (❌ Cancelado)

### Formato de Fechas
```typescript
// En tabla: dd/MM/yyyy HH:mm
// Ejemplo: 28/01/2025 14:30

// En timeline: dd/MM/yyyy HH:mm
// Con locale español (es)
```

### Formato de Moneda
```typescript
// Prefijo: Bs.
// Decimales: 2
// Ejemplo: Bs. 1,234.50
```

## 🔐 Permisos y Seguridad

- **Ruta protegida:** Requiere `requireAdmin={true}`
- **Solo administradores** pueden:
  - Ver todos los pedidos
  - Actualizar estados
  - Ver información completa de clientes
  - Acceder a filtros avanzados

## 📱 Responsive Design

- **Mobile (< 640px):**
  - Tabla con scroll horizontal
  - Filtros en columna única
  - Modal ocupa 95% del ancho
  - Botones apilados verticalmente

- **Tablet (640px - 1024px):**
  - Filtros en 2 columnas
  - Tabla completa visible
  - Modal con max-width 4xl

- **Desktop (> 1024px):**
  - Filtros en 4 columnas
  - Tabla amplia
  - Modal centrado
  - Paginación completa visible

## 🚀 Próximas Funcionalidades

### Corto Plazo
- [ ] Exportar pedidos a CSV/Excel
- [ ] Estadísticas de ventas en dashboard
- [ ] Gráficos de ventas por período
- [ ] Notificaciones automáticas al cambiar estado

### Mediano Plazo
- [ ] Impresión de pedidos (formato de factura)
- [ ] Envío de emails automáticos al cliente
- [ ] Tracking de envío con número de guía
- [ ] Comentarios/notas en timeline

### Largo Plazo
- [ ] Integración con sistemas de envío
- [ ] Devoluciones y reembolsos
- [ ] Reportes avanzados
- [ ] Dashboard analytics completo

## 🐛 Debugging

### Ver pedidos en consola
```typescript
// En ventas.page.tsx
console.log('Pedidos cargados:', pedidos);
console.log('Filtros activos:', filters);
console.log('Paginación:', pagination);
```

### Verificar API
```bash
# Obtener todos los pedidos
curl http://localhost:8000/api/ventas/pedidos/

# Filtrar por estado
curl http://localhost:8000/api/ventas/pedidos/?estado=PAGADO

# Obtener detalle
curl http://localhost:8000/api/ventas/pedidos/1/detalle/

# Actualizar estado (requiere auth)
curl -X PATCH http://localhost:8000/api/ventas/pedidos/1/actualizar_estado/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado": "ENVIADO"}'
```

## 📝 Notas de Implementación

1. **Diferencia entre /ventas y /pedidos:**
   - Ambas rutas usan el mismo componente `VentasPage`
   - "Ventas" enfatiza el aspecto financiero
   - "Pedidos" enfatiza el aspecto logístico
   - Internamente son lo mismo

2. **Carrito NO está en admin:**
   - El carrito es exclusivo para clientes
   - Admin solo ve pedidos confirmados
   - Los pedidos se crean desde el carrito del cliente

3. **Auto-refresh:**
   - Después de actualizar estado, se refrescan tanto el modal como la tabla
   - Evita datos desactualizados
   - Mejora la UX

4. **Paginación inteligente:**
   - Muestra páginas alrededor de la actual (n-1, n, n+1)
   - Siempre muestra primera y última
   - Usa "..." para páginas omitidas

## ✅ Checklist de Implementación

- [x] Types creados (`pedido.ts`)
- [x] Service implementado (`ventasService.ts`)
- [x] Hooks creados (`usePedidos.ts`)
- [x] Página principal (`ventas.page.tsx`)
- [x] Componente de filtros (`filters.tsx`)
- [x] Tabla de pedidos (`table.tsx`)
- [x] Modal de detalle (`detail.tsx`)
- [x] Rutas agregadas al router
- [x] Exports en index.ts
- [x] TypeScript sin errores
- [x] Sidebar con enlaces a Ventas y Pedidos
- [x] Integración completa con backend

## 🎓 Aprendizaje

**Conceptos aplicados:**
- Custom hooks con useCallback y useEffect
- Manejo de estado complejo con múltiples filtros
- Paginación con React
- Modales con Dialog de shadcn/ui
- Formateo de fechas y moneda
- TypeScript con tipos estrictos
- Separación de responsabilidades (service/hooks/components)
- UX con estados de carga y feedback

**Patrones de diseño:**
- Container/Presenter (page/components)
- Custom hooks para lógica reutilizable
- Service layer para API calls
- Type-safe con TypeScript estricto
