"""
Seeder para datos de demostración o prueba específicos del proyecto de inventario.
"""
from .base_seeder import BaseSeeder
from django.contrib.auth import get_user_model

User = get_user_model()

class InventarioSeeder(BaseSeeder):
    """
    Crea datos de demostración para el sistema de inventario.
    Coordina la ejecución de todos los seeders específicos.
    """
    
    @classmethod
    def run(cls):
        """
        Ejecuta todos los seeders en el orden correcto.
        """
        print("🚀 Iniciando seeders del sistema de inventario...")
        
        # 1. Asegurar que existan los roles
        from .rol_seeder import RolSeeder
        if RolSeeder.should_run():
            print("📋 Ejecutando seeder de roles...")
            RolSeeder.seed()
        
        # 2. Crear usuarios (incluye superusuario)
        from .user_seeder import UserSeeder
        if UserSeeder.should_run():
            print("👥 Ejecutando seeder de usuarios...")
            UserSeeder.seed()
        
        # 3. Crear personal de la empresa
        from .personal_seeder import PersonalSeeder
        if PersonalSeeder.should_run():
            print("🏢 Ejecutando seeder de personal...")
            PersonalSeeder.seed()
        
        # 4. Crear conductores
        from .conductor_seeder import ConductorSeeder
        if ConductorSeeder.should_run():
            print("🚗 Ejecutando seeder de conductores...")
            ConductorSeeder.seed()
        
        # 5. Vincular algunos usuarios con personal/conductores para pruebas
        cls._link_users_with_profiles()
        
        print("✅ Todos los seeders ejecutados correctamente!")
    
    @classmethod
    def _link_users_with_profiles(cls):
        """
        Vincula algunos usuarios con perfiles de personal y conductores para pruebas.
        """
        try:
            from users.models import CustomUser
            from personal.models import Personal
            from conductores.models import Conductor
            
            # Vincular usuario1 con personal
            try:
                user1 = CustomUser.objects.get(username='usuario1')
                personal1 = Personal.objects.get(email='maria.gonzalez@inventario.com')
                if not user1.personal:
                    user1.personal = personal1
                    user1.save()
                    print(f"✓ Usuario 'usuario1' vinculado con personal: {personal1.nombre} {personal1.apellido}")
            except Exception as e:
                print(f"⚠️ No se pudo vincular usuario1 con personal: {str(e)}")
            
            # Vincular conductor1 con conductor
            try:
                conductor_user = CustomUser.objects.get(username='conductor1')
                conductor_profile = Conductor.objects.get(email='miguel.torres@inventario.com')
                if not conductor_user.conductor:
                    conductor_user.conductor = conductor_profile
                    conductor_user.save()
                    print(f"✓ Usuario 'conductor1' vinculado con conductor: {conductor_profile.nombre} {conductor_profile.apellido}")
            except Exception as e:
                print(f"⚠️ No se pudo vincular conductor1 con conductor: {str(e)}")
                
        except ImportError as e:
            print(f"⚠️ No se pudieron vincular usuarios con perfiles: {str(e)}")
    
    @classmethod
    def should_run(cls):
        """
        Este seeder debería ejecutarse solo en entornos de desarrollo o prueba,
        o cuando la base de datos está vacía.
        """
        try:
            # Verificar si hay datos básicos en el sistema
            from users.models import CustomUser
            from personal.models import Personal
            from conductores.models import Conductor
            
            # Ejecutar si no hay suficientes datos de prueba
            total_data = (
                CustomUser.objects.count() + 
                Personal.objects.count() + 
                Conductor.objects.count()
            )
            
            # Ejecutar si hay menos de 10 registros en total
            return total_data < 10
            
        except ImportError:
            # Si no se pueden importar los modelos, ejecutar por defecto
            return True
