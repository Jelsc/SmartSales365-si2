"""
Módulo base para seeders que proporciona funcionalidad común.
"""
from django.db import transaction


class BaseSeeder:
    """
    Clase base para todos los seeders que proporciona funcionalidades comunes.
    """
    
    @classmethod
    def run(cls):
        """
        Método principal para ejecutar el seeder.
        Implementa la lógica específica en las clases hijas.
        """
        raise NotImplementedError("Cada seeder debe implementar su método run()")
    
    @classmethod
    @transaction.atomic
    def seed(cls):
        """
        Ejecuta el seeder dentro de una transacción atómica para garantizar
        la integridad de los datos.
        """
        try:
            cls.run()
            print(f"✅ {cls.__name__} ejecutado correctamente")
            return True
        except Exception as e:
            print(f"❌ Error al ejecutar {cls.__name__}: {str(e)}")
            return False
    
    @classmethod
    def should_run(cls):
        """
        Determina si el seeder debe ejecutarse.
        Por defecto, siempre se ejecuta, pero las clases hijas pueden 
        sobrescribir este método para implementar condiciones específicas.
        """
        return True
