# Este archivo permite que la carpeta seeders sea reconocida como un paquete de Python

# Importar todos los seeders para que estén disponibles
from .base_seeder import BaseSeeder
from .user_seeder import UserSeeder
from .rol_seeder import RolSeeder
from .conductor_seeder import ConductorSeeder
from .transporte_seeder import InventarioSeeder
from .personal_seeder import PersonalSeeder
from .categoria_seeder import CategoriaSeeder
from .producto_seeder import ProductoSeeder
from .metodo_pago_seeder import MetodoPagoSeeder
from .pedido_seeder import PedidoSeeder

__all__ = [
    'BaseSeeder',
    'UserSeeder',
    'RolSeeder',
    'ConductorSeeder',
    'InventarioSeeder',
    'PersonalSeeder',
    'CategoriaSeeder',
    'ProductoSeeder',
    'MetodoPagoSeeder',
    'PedidoSeeder',
]


