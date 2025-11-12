# API Endpoints - SmartSales365

## 📦 CARRITO DE COMPRAS

### Base URL: `/api/carrito/`

#### 1. Obtener Mi Carrito
```http
GET /api/carrito/mi_carrito/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
{
  "id": 1,
  "usuario": 1,
  "items": [
    {
      "id": 1,
      "producto_detalle": {
        "id": 1,
        "nombre": "Laptop HP",
        "precio": 1500.00,
        "imagen": "http://..."
      },
      "cantidad": 2,
      "precio_unitario": 1500.00,
      "subtotal": 3000.00,
      "variante": null
    }
  ],
  "total_items": 2,
  "subtotal": 3000.00,
  "total": 3000.00,
  "creado": "2024-01-15T10:30:00Z",
  "actualizado": "2024-01-15T11:00:00Z"
}
```

---

#### 2. Agregar Item al Carrito
```http
POST /api/carrito/agregar_item/
```
**Autenticación:** Requerida  
**Body:**
```json
{
  "producto_id": 1,
  "variante_id": 2,  // opcional
  "cantidad": 1
}
```
**Respuesta:** Carrito completo actualizado

---

#### 3. Actualizar Cantidad de Item
```http
PATCH /api/carrito/actualizar_item/{item_id}/
```
**Autenticación:** Requerida  
**Body:**
```json
{
  "cantidad": 3  // Si es 0, elimina el item
}
```
**Respuesta:**
```json
{
  "message": "Cantidad actualizada",
  "carrito": { /* carrito completo */ }
}
```

---

#### 4. Eliminar Item del Carrito
```http
DELETE /api/carrito/eliminar_item/{item_id}/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
{
  "message": "Item eliminado del carrito",
  "carrito": { /* carrito completo */ }
}
```

---

#### 5. Vaciar Carrito
```http
DELETE /api/carrito/vaciar/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
{
  "message": "Carrito vaciado",
  "carrito": { /* carrito vacío */ }
}
```

---

## 🛍️ PEDIDOS (VENTAS)

### Base URL: `/api/pedidos/`

#### 1. Crear Pedido (desde el carrito)
```http
POST /api/pedidos/
```
**Autenticación:** Requerida  
**Body:**
```json
{
  "direccion": {
    "nombre_completo": "Juan Pérez",
    "telefono": "71234567",
    "email": "juan@example.com",
    "direccion": "Calle 123 #456",
    "referencia": "Cerca del mercado",
    "ciudad": "La Paz",
    "departamento": "La Paz",
    "codigo_postal": "0000"
  },
  "notas_cliente": "Entregar en la mañana",
  "metodo_pago": "efectivo"
}
```
**Respuesta:**
```json
{
  "message": "Pedido creado exitosamente",
  "pedido": {
    "id": 1,
    "numero_pedido": "ORD-20240115-A1B2C3D4",
    "estado": "PENDIENTE",
    "subtotal": 3000.00,
    "descuento": 0.00,
    "impuestos": 0.00,
    "costo_envio": 0.00,
    "total": 3000.00,
    "items": [
      {
        "id": 1,
        "nombre_producto": "Laptop HP",
        "sku": "LAP-HP-001",
        "precio_unitario": 1500.00,
        "cantidad": 2,
        "subtotal": 3000.00
      }
    ],
    "direccion": { /* dirección completa */ },
    "creado": "2024-01-15T12:00:00Z"
  }
}
```

---

#### 2. Listar Mis Pedidos
```http
GET /api/pedidos/mis_pedidos/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
[
  {
    "id": 1,
    "numero_pedido": "ORD-20240115-A1B2C3D4",
    "estado": "PENDIENTE",
    "total": 3000.00,
    "total_items": 2,
    "creado": "2024-01-15T12:00:00Z",
    "actualizado": "2024-01-15T12:00:00Z"
  }
]
```

---

#### 3. Detalle de Pedido
```http
GET /api/pedidos/{id}/detalle/
```
**Autenticación:** Requerida  
**Respuesta:** Pedido completo con items y dirección

---

#### 4. Rastrear Pedido
```http
GET /api/pedidos/{id}/rastrear/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
{
  "numero_pedido": "ORD-20240115-A1B2C3D4",
  "estado_actual": "ENVIADO",
  "timeline": [
    {
      "estado": "PENDIENTE",
      "fecha": "2024-01-15T12:00:00Z",
      "descripcion": "Pedido recibido",
      "completado": true
    },
    {
      "estado": "PAGADO",
      "fecha": "2024-01-15T13:00:00Z",
      "descripcion": "Pago confirmado",
      "completado": true
    },
    {
      "estado": "ENVIADO",
      "fecha": "2024-01-16T09:00:00Z",
      "descripcion": "Pedido enviado",
      "completado": true
    }
  ],
  "direccion_envio": {
    "nombre_completo": "Juan Pérez",
    "telefono": "71234567",
    "direccion": "Calle 123 #456",
    "ciudad": "La Paz",
    "departamento": "La Paz"
  }
}
```

---

#### 5. Actualizar Estado de Pedido (Solo Admin)
```http
PATCH /api/pedidos/{id}/actualizar_estado/
```
**Autenticación:** Requerida (Admin)  
**Body:**
```json
{
  "estado": "PAGADO",
  "notas_internas": "Pago verificado por transferencia"
}
```
**Respuesta:**
```json
{
  "message": "Estado actualizado exitosamente",
  "pedido": { /* pedido completo */ }
}
```

---

## 📊 ESTADOS DE PEDIDO

| Estado | Descripción | Timestamp Automático |
|--------|-------------|---------------------|
| `PENDIENTE` | Pedido creado, esperando pago | `creado` |
| `PAGADO` | Pago confirmado | `pagado_en` |
| `PROCESANDO` | Preparando el pedido | - |
| `ENVIADO` | Pedido en camino | `enviado_en` |
| `ENTREGADO` | Pedido entregado | `entregado_en` |
| `CANCELADO` | Pedido cancelado | - |
| `REEMBOLSADO` | Dinero devuelto | - |

---

## 🔐 AUTENTICACIÓN

Todos los endpoints requieren autenticación mediante token JWT:

```http
Authorization: Bearer <token>
```

Para obtener el token, usar los endpoints de autenticación:
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Registro
- `POST /api/auth/refresh/` - Refresh token

---

## ⚠️ VALIDACIONES

### Carrito
- ✅ Validación de stock disponible antes de agregar
- ✅ Validación de stock al actualizar cantidad
- ✅ Items únicos por producto+variante
- ✅ Solo usuarios autenticados pueden tener carrito

### Pedidos
- ✅ Carrito no puede estar vacío
- ✅ Todos los campos de dirección son requeridos
- ✅ Usuario solo puede ver sus propios pedidos
- ✅ Solo admins pueden actualizar estados
- ✅ Timestamps automáticos según estado

---

## � PAGOS (STRIPE)

### Base URL: `/api/pagos/`

#### 1. Listar Métodos de Pago Disponibles
```http
GET /api/pagos/metodos/
```
**Autenticación:** No requerida  
**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Tarjeta de Crédito/Débito",
    "tipo": "STRIPE",
    "activo": true,
    "descripcion": "Pago seguro con tarjeta de crédito o débito a través de Stripe"
  },
  {
    "id": 4,
    "nombre": "Efectivo",
    "tipo": "EFECTIVO",
    "activo": true,
    "descripcion": "Pago en efectivo contra entrega"
  }
]
```

---

#### 2. Crear Payment Intent (Stripe)
```http
POST /api/pagos/crear_payment_intent/
```
**Autenticación:** Requerida  
**Body:**
```json
{
  "pedido_id": 1
}
```
**Respuesta:**
```json
{
  "success": true,
  "transaccion_id": 1,
  "client_secret": "pi_xxxxx_secret_xxxxx",
  "payment_intent_id": "pi_xxxxx",
  "amount": 300000,
  "currency": "usd",
  "publishable_key": "pk_test_xxxxx"
}
```
**Uso:** El `client_secret` se usa en el frontend con Stripe Elements para confirmar el pago

---

#### 3. Confirmar Pago
```http
POST /api/pagos/confirmar_pago/
```
**Autenticación:** Requerida  
**Body:**
```json
{
  "payment_intent_id": "pi_xxxxx"
}
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Pago confirmado exitosamente",
  "status": "succeeded",
  "transaccion": {
    "id": 1,
    "pedido": 1,
    "metodo_pago": 1,
    "estado": "EXITOSO",
    "monto": 3000.00,
    "moneda": "USD",
    "id_externo": "pi_xxxxx",
    "creado": "2024-01-15T12:00:00Z",
    "procesado_en": "2024-01-15T12:05:00Z"
  }
}
```

---

#### 4. Mis Transacciones
```http
GET /api/pagos/mis_transacciones/
```
**Autenticación:** Requerida  
**Respuesta:**
```json
[
  {
    "id": 1,
    "pedido": 1,
    "metodo_pago": 1,
    "metodo_pago_detalle": {
      "id": 1,
      "nombre": "Tarjeta de Crédito/Débito",
      "tipo": "STRIPE"
    },
    "estado": "EXITOSO",
    "monto": 3000.00,
    "moneda": "USD",
    "id_externo": "pi_xxxxx",
    "creado": "2024-01-15T12:00:00Z",
    "procesado_en": "2024-01-15T12:05:00Z"
  }
]
```

---

#### 5. Webhook de Stripe
```http
POST /api/pagos/webhook/stripe/
```
**Autenticación:** No requerida (usa firma de Stripe)  
**Headers:**
```
Stripe-Signature: <stripe_signature>
```
**Body:** Event de Stripe en formato JSON

**Eventos soportados:**
- `payment_intent.succeeded` - Pago exitoso (actualiza transacción y pedido)
- `payment_intent.payment_failed` - Pago fallido (marca transacción como fallida)
- `charge.refunded` - Reembolso (marca transacción como reembolsada)

---

## 💳 ESTADOS DE TRANSACCIÓN

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE` | Transacción creada, esperando procesamiento |
| `PROCESANDO` | Payment Intent creado, esperando confirmación del usuario |
| `EXITOSO` | Pago procesado exitosamente |
| `FALLIDO` | Pago rechazado o error |
| `CANCELADO` | Transacción cancelada |
| `REEMBOLSADO` | Dinero devuelto al cliente |

---

## 🔐 FLUJO DE PAGO CON STRIPE

### 1. Frontend: Crear Payment Intent
```javascript
// Llamar al backend para crear el payment intent
const response = await fetch('/api/pagos/crear_payment_intent/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ pedido_id: 1 })
});

const { client_secret, publishable_key } = await response.json();
```

### 2. Frontend: Confirmar con Stripe Elements
```javascript
// Usar Stripe Elements para procesar el pago
const stripe = Stripe(publishable_key);
const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Juan Pérez',
      email: 'juan@example.com'
    }
  }
});

if (error) {
  // Mostrar error
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  // Confirmar en el backend
  await fetch('/api/pagos/confirmar_pago/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      payment_intent_id: paymentIntent.id 
    })
  });
}
```

### 3. Backend: Webhook Automático
Stripe enviará automáticamente eventos al webhook cuando:
- El pago se complete
- El pago falle
- Se realice un reembolso

---

##  PRÓXIMOS ENDPOINTS

### E-commerce (Pendiente)
- Signals para actualizar stock automáticamente
- Sistema de cupones y descuentos
- Notificaciones por email de confirmación de pedido

---

## 📝 NOTAS TÉCNICAS

### Snapshots de Precios
Los precios se guardan como snapshot al momento de:
- **Agregar al carrito**: `precio_unitario` captura precio actual del producto
- **Crear pedido**: `ItemPedido` copia todos los datos del producto

Esto asegura que cambios futuros de precio no afecten pedidos anteriores.

### Manejo de Variantes
Si un producto tiene variantes (ej: talla, color):
- `variante_id` es opcional en el carrito
- Si hay variante, el precio se calcula: `producto.precio + variante.precio_adicional`
- Si hay oferta, usa `precio_oferta` en lugar de precio regular

### Número de Pedido
Generado automáticamente con formato: `ORD-YYYYMMDD-UUID8`
- Ejemplo: `ORD-20240115-A1B2C3D4`
- Único por pedido
- Fácil de buscar y rastrear
