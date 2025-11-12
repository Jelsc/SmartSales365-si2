"""
Seeder para productos de ejemplo
"""
from decimal import Decimal
from .base_seeder import BaseSeeder
from productos.models import Categoria, Producto


class ProductoSeeder(BaseSeeder):
    """
    Seeder para crear productos de ejemplo
    """
    
    @classmethod
    def run(cls):
        """
        Crear productos de ejemplo en diferentes categorías
        """
        # Obtener categorías (deben existir previamente)
        try:
            cat_electronica = Categoria.objects.get(nombre='Electrónica')
            cat_celulares = Categoria.objects.get(nombre='Celulares y Accesorios')
            cat_computacion = Categoria.objects.get(nombre='Computación')
            cat_audio = Categoria.objects.get(nombre='Audio y Video')
            cat_gaming = Categoria.objects.get(nombre='Gaming')
            cat_wearables = Categoria.objects.get(nombre='Wearables')
        except Categoria.DoesNotExist as e:
            print(f"❌ Error: {e}")
            print("⚠️  Ejecuta primero el CategoriaSeeder")
            return
        
        productos = [
            # Electrónica
            {
                'nombre': 'Laptop HP Pavilion 15',
                'descripcion': 'Laptop HP Pavilion 15.6" Intel Core i5 12GB RAM 512GB SSD, ideal para trabajo y estudio',
                'precio': Decimal('5500.00'),
                'stock': 15,
                'categoria': cat_computacion,
                'sku': 'LAP-HP-PAV15-001',
                'activo': True,
            },
            {
                'nombre': 'MacBook Air M2',
                'descripcion': 'Apple MacBook Air 13.6" chip M2 8GB RAM 256GB SSD, rendimiento excepcional',
                'precio': Decimal('12500.00'),
                'precio_oferta': Decimal('11999.00'),
                'stock': 8,
                'categoria': cat_computacion,
                'sku': 'LAP-APL-M2-001',
                'activo': True,
            },
            
            # Celulares
            {
                'nombre': 'iPhone 15 Pro',
                'descripcion': 'Apple iPhone 15 Pro 128GB, pantalla Super Retina XDR 6.1", chip A17 Pro',
                'precio': Decimal('9999.00'),
                'precio_oferta': Decimal('9499.00'),
                'stock': 20,
                'categoria': cat_celulares,
                'sku': 'CEL-APL-15PRO-128',
                'activo': True,
            },
            {
                'nombre': 'Samsung Galaxy S24',
                'descripcion': 'Samsung Galaxy S24 256GB, pantalla Dynamic AMOLED 6.2", Snapdragon 8 Gen 3',
                'precio': Decimal('7899.00'),
                'stock': 25,
                'categoria': cat_celulares,
                'sku': 'CEL-SAM-S24-256',
                'activo': True,
            },
            {
                'nombre': 'Xiaomi Redmi Note 13 Pro',
                'descripcion': 'Xiaomi Redmi Note 13 Pro 128GB, pantalla AMOLED 6.67", MediaTek Dimensity 7200',
                'precio': Decimal('2499.00'),
                'precio_oferta': Decimal('2199.00'),
                'stock': 40,
                'categoria': cat_celulares,
                'sku': 'CEL-XIA-N13P-128',
                'activo': True,
            },
            
            # Audio y Video
            {
                'nombre': 'AirPods Pro 2',
                'descripcion': 'Apple AirPods Pro 2da generación, cancelación activa de ruido, audio espacial',
                'precio': Decimal('2199.00'),
                'stock': 30,
                'categoria': cat_audio,
                'sku': 'AUD-APL-APRO2-001',
                'activo': True,
            },
            {
                'nombre': 'Sony WH-1000XM5',
                'descripcion': 'Audífonos Sony WH-1000XM5, cancelación de ruido líder en la industria, 30h batería',
                'precio': Decimal('3299.00'),
                'precio_oferta': Decimal('2999.00'),
                'stock': 18,
                'categoria': cat_audio,
                'sku': 'AUD-SON-XM5-001',
                'activo': True,
            },
            {
                'nombre': 'JBL Flip 6',
                'descripcion': 'Parlante portátil JBL Flip 6, resistente al agua IP67, 12h batería, sonido potente',
                'precio': Decimal('899.00'),
                'stock': 35,
                'categoria': cat_audio,
                'sku': 'PAR-JBL-FLP6-001',
                'activo': True,
            },
            
            # Gaming
            {
                'nombre': 'PlayStation 5',
                'descripcion': 'Consola Sony PlayStation 5, 825GB SSD, Ray Tracing, 4K 120fps',
                'precio': Decimal('5999.00'),
                'stock': 12,
                'categoria': cat_gaming,
                'sku': 'GAM-SON-PS5-825',
                'activo': True,
            },
            {
                'nombre': 'Xbox Series X',
                'descripcion': 'Consola Microsoft Xbox Series X, 1TB SSD, 4K nativo, Ray Tracing',
                'precio': Decimal('5499.00'),
                'precio_oferta': Decimal('4999.00'),
                'stock': 10,
                'categoria': cat_gaming,
                'sku': 'GAM-MSF-XSX-1TB',
                'activo': True,
            },
            {
                'nombre': 'Logitech G502 HERO',
                'descripcion': 'Mouse gaming Logitech G502 HERO, 25.600 DPI, 11 botones programables, RGB',
                'precio': Decimal('549.00'),
                'stock': 45,
                'categoria': cat_gaming,
                'sku': 'GAM-LOG-G502-001',
                'activo': True,
            },
            
            # Computación
            {
                'nombre': 'Monitor LG UltraGear 27"',
                'descripcion': 'Monitor gaming LG UltraGear 27" 144Hz, 1ms, QHD 2560x1440, HDR10',
                'precio': Decimal('2899.00'),
                'precio_oferta': Decimal('2599.00'),
                'stock': 22,
                'categoria': cat_computacion,
                'sku': 'MON-LG-UG27-001',
                'activo': True,
            },
            {
                'nombre': 'Teclado Mecánico Razer BlackWidow V3',
                'descripcion': 'Teclado mecánico Razer BlackWidow V3, switches Green, RGB Chroma, reposamuñecas',
                'precio': Decimal('1299.00'),
                'stock': 28,
                'categoria': cat_computacion,
                'sku': 'TEC-RAZ-BWV3-001',
                'activo': True,
            },
            {
                'nombre': 'SSD Samsung 980 PRO 1TB',
                'descripcion': 'SSD NVMe Samsung 980 PRO 1TB, PCIe 4.0, hasta 7000 MB/s lectura',
                'precio': Decimal('1099.00'),
                'stock': 38,
                'categoria': cat_computacion,
                'sku': 'SSD-SAM-980P-1TB',
                'activo': True,
            },
            
            # Wearables
            {
                'nombre': 'Apple Watch Series 9',
                'descripcion': 'Apple Watch Series 9 GPS 45mm, pantalla Always-On, sensor salud avanzado',
                'precio': Decimal('4299.00'),
                'stock': 16,
                'categoria': cat_wearables,
                'sku': 'WEA-APL-AW9-45',
                'activo': True,
            },
            {
                'nombre': 'Samsung Galaxy Watch 6',
                'descripcion': 'Samsung Galaxy Watch 6 44mm, monitoreo salud 24/7, resistente al agua',
                'precio': Decimal('2999.00'),
                'precio_oferta': Decimal('2699.00'),
                'stock': 24,
                'categoria': cat_wearables,
                'sku': 'WEA-SAM-GW6-44',
                'activo': True,
            },
            {
                'nombre': 'Fitbit Charge 6',
                'descripcion': 'Fitbit Charge 6, rastreador fitness con GPS, monitoreo frecuencia cardíaca, 7 días batería',
                'precio': Decimal('1299.00'),
                'stock': 32,
                'categoria': cat_wearables,
                'sku': 'WEA-FIT-CH6-001',
                'activo': True,
            },
            
            # Más productos de Electrónica
            {
                'nombre': 'iPad Pro 12.9" M2',
                'descripcion': 'Apple iPad Pro 12.9" chip M2 128GB, pantalla Liquid Retina XDR, Apple Pencil compatible',
                'precio': Decimal('10999.00'),
                'stock': 14,
                'categoria': cat_electronica,
                'sku': 'TAB-APL-IPM2-129',
                'activo': True,
            },
            {
                'nombre': 'Kindle Paperwhite',
                'descripcion': 'Amazon Kindle Paperwhite 11va Gen, 16GB, pantalla 6.8" sin reflejos, resistente al agua',
                'precio': Decimal('1299.00'),
                'precio_oferta': Decimal('1099.00'),
                'stock': 26,
                'categoria': cat_electronica,
                'sku': 'ELR-AMZ-KPW-16',
                'activo': True,
            },
            {
                'nombre': 'Webcam Logitech C920',
                'descripcion': 'Webcam Logitech C920 Full HD 1080p, micrófono estéreo, ideal para streaming',
                'precio': Decimal('699.00'),
                'stock': 42,
                'categoria': cat_electronica,
                'sku': 'WEB-LOG-C920-001',
                'activo': True,
            },
        ]
        
        contador_creados = 0
        contador_existentes = 0
        
        for producto_data in productos:
            producto, created = Producto.objects.get_or_create(
                sku=producto_data['sku'],
                defaults=producto_data
            )
            
            if created:
                contador_creados += 1
                precio_str = f"Bs. {producto.precio}"
                if producto.precio_oferta:
                    precio_str += f" → Bs. {producto.precio_oferta} (OFERTA)"
                print(f"  ✓ Creado: {producto.nombre} - {precio_str}")
            else:
                contador_existentes += 1
                print(f"  ○ Ya existe: {producto.nombre}")
        
        print(f"\n📊 Resumen:")
        print(f"  • Productos creados: {contador_creados}")
        print(f"  • Productos existentes: {contador_existentes}")
        print(f"  • Total: {contador_creados + contador_existentes}")
        
        # Estadísticas por categoría
        print(f"\n📈 Productos por categoría:")
        for categoria in Categoria.objects.all():
            total = Producto.objects.filter(categoria=categoria).count()
            if total > 0:
                print(f"  • {categoria.nombre}: {total} productos")
