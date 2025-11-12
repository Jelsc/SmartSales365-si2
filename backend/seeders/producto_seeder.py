from seeders.base_seeder import BaseSeeder
from productos.models import Producto, Categoria


class ProductoSeeder(BaseSeeder):
    """
    Seeder para crear productos de prueba
    """
    
    @classmethod
    def should_run(cls):
        """Ejecutar solo si no hay productos"""
        return Producto.objects.count() == 0
    
    @classmethod
    def run(cls):
        """Crear categorías y productos de prueba"""
        print("ℹ️ Creando categorías...")
        
        # Crear categorías
        categorias_data = [
            {
                'nombre': 'Electrónica',
                'descripcion': 'Dispositivos electrónicos y accesorios',
                'activo': True
            },
            {
                'nombre': 'Ropa',
                'descripcion': 'Prendas de vestir y accesorios de moda',
                'activo': True
            },
            {
                'nombre': 'Hogar',
                'descripcion': 'Artículos para el hogar y decoración',
                'activo': True
            },
            {
                'nombre': 'Deportes',
                'descripcion': 'Equipamiento deportivo y fitness',
                'activo': True
            },
            {
                'nombre': 'Libros',
                'descripcion': 'Libros físicos y digitales',
                'activo': True
            }
        ]
        
        categorias = {}
        for cat_data in categorias_data:
            categoria, created = Categoria.objects.get_or_create(
                nombre=cat_data['nombre'],
                defaults=cat_data
            )
            categorias[cat_data['nombre']] = categoria
            if created:
                print(f"✓ Categoría creada: {categoria.nombre}")
        
        print("ℹ️ Creando productos...")
        
        # Productos de Electrónica
        productos_data = [
            {
                'nombre': 'Laptop HP ProBook 450 G9',
                'descripcion': 'Laptop profesional con Intel Core i5, 8GB RAM, 256GB SSD, pantalla 15.6"',
                'precio': 4500.00,
                'imagen': 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08195940.png',
                'stock': 15,
                'categoria': categorias['Electrónica'],
                'destacado': True
            },
            {
                'nombre': 'Audífonos Sony WH-1000XM4',
                'descripcion': 'Audífonos inalámbricos con cancelación de ruido activa, 30h de batería',
                'precio': 850.00,
                'imagen': 'https://www.sony.com.bo/image/5d02da5df552836db894cead8a68f5f3?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
                'stock': 25,
                'categoria': categorias['Electrónica'],
                'destacado': True
            },
            {
                'nombre': 'Mouse Logitech MX Master 3',
                'descripcion': 'Mouse ergonómico inalámbrico para productividad',
                'precio': 320.00,
                'imagen': 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png',
                'stock': 40,
                'categoria': categorias['Electrónica'],
                'destacado': False
            },
            {
                'nombre': 'Teclado Mecánico Keychron K2',
                'descripcion': 'Teclado mecánico inalámbrico retroiluminado RGB',
                'precio': 450.00,
                'imagen': 'https://www.keychron.com/cdn/shop/products/Keychron-K2-wireless-mechanical-keyboard-for-Mac-Windows-iOS-Gateron-switch-red-with-type-C-RGB-white-backlight-aluminum-frame_1800x1800.jpg',
                'stock': 20,
                'categoria': categorias['Electrónica'],
                'destacado': False
            },
            {
                'nombre': 'Monitor Samsung 27" 4K',
                'descripcion': 'Monitor UHD 4K de 27 pulgadas, tecnología IPS',
                'precio': 1800.00,
                'imagen': 'https://images.samsung.com/is/image/samsung/p6pim/bo/lu28e590ds-zb/gallery/bo-ue590-lu28e590ds-zb-front-black-thumb-231862653',
                'stock': 10,
                'categoria': categorias['Electrónica'],
                'destacado': True
            },
            
            # Productos de Ropa
            {
                'nombre': 'Camiseta Nike Dri-FIT',
                'descripcion': 'Camiseta deportiva de secado rápido, disponible en varios colores',
                'precio': 150.00,
                'imagen': 'https://nikebolivia.vtexassets.com/arquivos/ids/279844-800-800?v=638472772863830000&width=800&height=800&aspect=true',
                'stock': 50,
                'categoria': categorias['Ropa'],
                'destacado': False
            },
            {
                'nombre': 'Jeans Levi\'s 501 Original',
                'descripcion': 'Jean clásico de corte recto, 100% algodón',
                'precio': 420.00,
                'imagen': 'https://lsco.scene7.com/is/image/lsco/005012101-front-pdp-lse?fmt=jpeg&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=2000&hei=1840',
                'stock': 30,
                'categoria': categorias['Ropa'],
                'destacado': False
            },
            {
                'nombre': 'Zapatillas Adidas Ultraboost',
                'descripcion': 'Zapatillas running con tecnología Boost para máximo retorno de energía',
                'precio': 680.00,
                'imagen': 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Zapatillas_Ultraboost_Light_Negro_GY9350_01_standard.jpg',
                'stock': 25,
                'categoria': categorias['Ropa'],
                'destacado': True
            },
            
            # Productos de Hogar
            {
                'nombre': 'Cafetera Nespresso Vertuo',
                'descripcion': 'Máquina de café con sistema de cápsulas, prepara café y espresso',
                'precio': 950.00,
                'imagen': 'https://www.nespresso.com/ecom/medias/sys_master/public/13836890857502/VertuoPop-Black-dsk-1300x1300-A.png',
                'stock': 15,
                'categoria': categorias['Hogar'],
                'destacado': True
            },
            {
                'nombre': 'Aspiradora Robot iRobot Roomba',
                'descripcion': 'Aspiradora inteligente con navegación automática y app móvil',
                'precio': 1200.00,
                'imagen': 'https://media.croma.com/image/upload/v1661759059/Croma%20Assets/Small%20Appliances/Vacuum%20Cleaner/Images/255031_d0nq4f.png',
                'stock': 8,
                'categoria': categorias['Hogar'],
                'destacado': True
            },
            {
                'nombre': 'Set de Sartenes Tefal',
                'descripcion': 'Set de 3 sartenes antiadherentes con mango removible',
                'precio': 350.00,
                'imagen': 'https://m.media-amazon.com/images/I/71I8ZxYc9CL._AC_SL1500_.jpg',
                'stock': 20,
                'categoria': categorias['Hogar'],
                'destacado': False
            },
            
            # Productos de Deportes
            {
                'nombre': 'Bicicleta MTB Trek Marlin 7',
                'descripcion': 'Bicicleta de montaña aro 29, suspensión delantera, 21 velocidades',
                'precio': 3500.00,
                'imagen': 'https://trek.scene7.com/is/image/TrekBicycleProducts/Marlin7_23_36709_A_Primary',
                'stock': 5,
                'categoria': categorias['Deportes'],
                'destacado': True
            },
            {
                'nombre': 'Pesas Ajustables 20kg',
                'descripcion': 'Set de mancuernas ajustables de 2.5kg a 20kg por mancuerna',
                'precio': 480.00,
                'imagen': 'https://m.media-amazon.com/images/I/61P3Z+nILWL._AC_SL1500_.jpg',
                'stock': 12,
                'categoria': categorias['Deportes'],
                'destacado': False
            },
            {
                'nombre': 'Colchoneta Yoga Premium',
                'descripcion': 'Colchoneta de yoga antideslizante 6mm con bolso de transporte',
                'precio': 180.00,
                'imagen': 'https://m.media-amazon.com/images/I/71F1EjMKzKL._AC_SL1500_.jpg',
                'stock': 35,
                'categoria': categorias['Deportes'],
                'destacado': False
            },
            
            # Productos de Libros
            {
                'nombre': 'Cien Años de Soledad - Gabriel García Márquez',
                'descripcion': 'Edición especial del clásico de la literatura latinoamericana',
                'precio': 85.00,
                'imagen': 'https://images.cdn1.buscalibre.com/fit-in/360x360/61/8d/618d227e8967274cd9589a549adff52d.jpg',
                'stock': 50,
                'categoria': categorias['Libros'],
                'destacado': False
            },
            {
                'nombre': '1984 - George Orwell',
                'descripcion': 'Novela distópica sobre el totalitarismo y la vigilancia',
                'precio': 75.00,
                'imagen': 'https://images.cdn3.buscalibre.com/fit-in/360x360/8f/6e/8f6e4d6a8ffb9b111c56a5c5e5b0ab53.jpg',
                'stock': 40,
                'categoria': categorias['Libros'],
                'destacado': False
            },
            {
                'nombre': 'El Principito - Antoine de Saint-Exupéry',
                'descripcion': 'Edición ilustrada del libro más traducido del mundo',
                'precio': 65.00,
                'imagen': 'https://images.cdn3.buscalibre.com/fit-in/360x360/e6/e8/e6e8a4a0b66e3c5e5a2de9e7c85bcd18.jpg',
                'stock': 60,
                'categoria': categorias['Libros'],
                'destacado': True
            }
        ]
        
        for prod_data in productos_data:
            producto, created = Producto.objects.get_or_create(
                nombre=prod_data['nombre'],
                defaults=prod_data
            )
            if created:
                print(f"✓ Producto creado: {producto.nombre} - Bs. {producto.precio}")
        
        # Resumen
        total_categorias = Categoria.objects.count()
        total_productos = Producto.objects.count()
        total_destacados = Producto.objects.filter(destacado=True).count()
        
        print(f"\n📊 Resumen:")
        print(f"✓ {total_categorias} categorías creadas")
        print(f"✓ {total_productos} productos creados")
        print(f"✓ {total_destacados} productos destacados")
