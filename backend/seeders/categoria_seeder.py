"""
Seeder para categorías de productos
"""
from .base_seeder import BaseSeeder
from productos.models import Categoria


class CategoriaSeeder(BaseSeeder):
    """
    Seeder para crear categorías de productos iniciales
    """
    
    @classmethod
    def run(cls):
        """
        Crear categorías de productos
        """
        categorias = [
            {
                'nombre': 'Electrónica',
                'descripcion': 'Productos electrónicos, computadoras, laptops, tablets y accesorios',
                'activa': True,
            },
            {
                'nombre': 'Celulares y Accesorios',
                'descripcion': 'Smartphones, fundas, cargadores, audífonos y más',
                'activa': True,
            },
            {
                'nombre': 'Computación',
                'descripcion': 'Laptops, PCs, monitores, teclados, mouse y componentes',
                'activa': True,
            },
            {
                'nombre': 'Audio y Video',
                'descripcion': 'Parlantes, audífonos, cámaras, proyectores y equipos de sonido',
                'activa': True,
            },
            {
                'nombre': 'Gaming',
                'descripcion': 'Consolas, videojuegos, accesorios gaming y periféricos',
                'activa': True,
            },
            {
                'nombre': 'Hogar Inteligente',
                'descripcion': 'Dispositivos inteligentes, domótica, asistentes virtuales',
                'activa': True,
            },
            {
                'nombre': 'Fotografía',
                'descripcion': 'Cámaras, lentes, trípodes, iluminación y accesorios',
                'activa': True,
            },
            {
                'nombre': 'Wearables',
                'descripcion': 'Smartwatches, fitness trackers, auriculares inalámbricos',
                'activa': True,
            },
            {
                'nombre': 'Almacenamiento',
                'descripcion': 'Discos duros, SSDs, memorias USB, tarjetas de memoria',
                'activa': True,
            },
            {
                'nombre': 'Redes y Conectividad',
                'descripcion': 'Routers, access points, cables, adaptadores de red',
                'activa': True,
            },
        ]
        
        contador_creados = 0
        contador_existentes = 0
        
        for categoria_data in categorias:
            categoria, created = Categoria.objects.get_or_create(
                nombre=categoria_data['nombre'],
                defaults={
                    'descripcion': categoria_data['descripcion'],
                    'activa': categoria_data['activa'],
                }
            )
            
            if created:
                contador_creados += 1
                print(f"  ✓ Creada: {categoria.nombre}")
            else:
                contador_existentes += 1
                print(f"  ○ Ya existe: {categoria.nombre}")
        
        print(f"\n📊 Resumen:")
        print(f"  • Categorías creadas: {contador_creados}")
        print(f"  • Categorías existentes: {contador_existentes}")
        print(f"  • Total: {contador_creados + contador_existentes}")
