"""
Seeder para crear los roles iniciales del sistema.
"""

from .base_seeder import BaseSeeder


class RolSeeder(BaseSeeder):
    """
    Crea los roles iniciales del sistema.
    """

    @classmethod
    def run(cls):
        """
        Crea los roles predefinidos del sistema si no existen.
        """
        try:
            from users.models import Rol
            from users.constants import ROLES_CONFIG

            # Usar la configuración de roles desde constants.py
            roles_data = []
            for nombre_rol, config in ROLES_CONFIG.items():
                roles_data.append({
                    "nombre": nombre_rol,
                    "descripcion": config["descripcion"],
                    "es_administrativo": config["es_administrativo"],
                    "permisos": config["permisos"],
                })

            for role_data in roles_data:
                rol, created = Rol.objects.get_or_create(
                    nombre=role_data["nombre"], defaults=role_data
                )
                if created:
                    print(f"✓ Rol creado: {rol.nombre}")
                else:
                    # Actualizar permisos si el rol ya existe
                    rol.permisos = role_data["permisos"]
                    rol.descripcion = role_data["descripcion"]
                    rol.es_administrativo = role_data["es_administrativo"]
                    rol.save()
                    print(f"✓ Rol actualizado: {rol.nombre}")

        except ImportError:
            print(
                "❌ Error: No se pudo importar el modelo Rol. Verifica que existe en users.models."
            )

    @classmethod
    def should_run(cls):
        """
        El seeder de roles debe ejecutarse siempre para garantizar que existan todos los roles.
        """
        try:
            from users.models import Rol
            from users.constants import ROLES_CONFIG

            # Ejecutar si no existen todos los roles esperados
            roles_esperados = list(ROLES_CONFIG.keys())
            roles_existentes = set(Rol.objects.values_list("nombre", flat=True))
            return not all(rol in roles_existentes for rol in roles_esperados)
        except:
            # Si hay error al verificar, mejor ejecutar el seeder
            return True
