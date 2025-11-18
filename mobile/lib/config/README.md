# Configuración de Credenciales y API

Este directorio contiene archivos de configuración para servicios externos y la API.

## Stripe

### Configuración Inicial

1. **Copia el archivo de ejemplo:**

   ```bash
   cp lib/config/stripe_config.example.dart lib/config/stripe_config.dart
   ```

2. **Obtén tu clave pública de Stripe:**

   - Ve a https://dashboard.stripe.com/apikeys
   - Copia tu **Publishable key** (formato: `pk_test_...` o `pk_live_...`)

3. **Edita `stripe_config.dart`:**
   - Reemplaza `'TU_PUBLISHABLE_KEY_AQUI'` con tu clave real
   - Guarda el archivo

### Seguridad

- ✅ El archivo `stripe_config.dart` está en `.gitignore` y **NO se subirá al repositorio**
- ✅ El archivo `stripe_config.example.dart` es solo un template y puede estar en el repositorio
- ⚠️ **NUNCA** subas credenciales al repositorio
- ⚠️ La **Publishable Key** puede ser expuesta en el cliente (es segura)
- ⚠️ La **Secret Key** debe estar SOLO en el backend (nunca en mobile)

### Uso en el Código

El servicio de pagos (`PaymentService`) carga automáticamente la configuración:

```dart
import '../config/stripe_config.dart';

// La clave se obtiene automáticamente
final key = StripeConfig.getPublishableKey();
```

### Validación

El archivo de configuración valida automáticamente que:

- La clave no esté vacía
- La clave tenga el formato correcto (`pk_test_...` o `pk_live_...`)
- La clave no sea el valor por defecto

Si la configuración no es válida, se lanzará una excepción con un mensaje claro.

## API Configuration

### Configuración Simple

La URL base del backend se configura manualmente editando `api_url.dart`:

1. **Copia el archivo de ejemplo:**

   ```bash
   cp lib/config/api_url.example.dart lib/config/api_url.dart
   ```

2. **Edita la IP:**

   - Abre `mobile/lib/config/api_url.dart`
   - Cambia el valor de `serverIP` de `'TU_IP_AQUI'` a tu IP real (local o Azure)
   - Reinicia la app

### Seguridad

- ✅ El archivo `api_url.dart` está en `.gitignore` y **NO se subirá al repositorio**
- ✅ El archivo `api_url.example.dart` es solo un template y puede estar en el repositorio
- ⚠️ **NUNCA** subas tu IP real al repositorio

2. **Uso en servicios:**

   ```dart
   import '../config/api_config.dart';

   // Obtener URL base (síncrono, no async)
   final baseUrl = ApiConfig.getBaseUrl();

   // Construir URL de endpoint
   final url = ApiConfig.buildUrl('/api/productos/');

   // Construir URL de imagen
   final imageUrl = ApiConfig.buildImageUrl('/media/productos/imagen.jpg');
   ```

### Ejemplo de Configuración

```dart
// En api_url.dart
class ApiUrl {
  static const String serverIP = '192.168.0.143';  // Local
  // static const String serverIP = '20.123.45.67';  // Azure
  static const String port = '8000';

  static String get baseUrl => 'http://$serverIP:$port';
}
```

## Imágenes de Productos

Las imágenes de productos se manejan automáticamente:

- El backend devuelve URLs absolutas completas
- Si alguna imagen viene como URL relativa, se construye automáticamente usando `ApiConfig`
- Helper disponible en `lib/utils/image_helper.dart` para casos especiales

### Uso del Helper de Imágenes

```dart
import '../utils/image_helper.dart';

// Construir URL de imagen (maneja absolutas y relativas)
final imageUrl = ImageHelper.buildImageUrl(producto.imagen);

// Verificar si una URL es válida
if (ImageHelper.isValidImageUrl(imageUrl)) {
  // Mostrar imagen
}
```
