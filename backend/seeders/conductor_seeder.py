"""
Seeder para datos de Conductores.
"""
from .base_seeder import BaseSeeder
from datetime import date, timedelta

class ConductorSeeder(BaseSeeder):
    """
    Crea datos de Conductores para el sistema de transporte.
    """
    
    @classmethod
    def run(cls):
        """
        Crea registros de conductores de prueba.
        """
        try:
            from conductores.models import Conductor
            
            # Datos de conductores de prueba
            conductores_data = [
                {
                    "nombre": "Miguel",
                    "apellido": "Torres",
                    "ci": "67890123",
                    "email": "miguel.torres@transporte.com",
                    "telefono": "555-0601",
                    "fecha_nacimiento": date(1983, 4, 18),
                    "nro_licencia": "LIC001",
                    "tipo_licencia": "D",
                    "fecha_venc_licencia": date.today() + timedelta(days=365),
                    "estado": "disponible",
                    "experiencia_anios": 8
                },
                {
                    "nombre": "Sofía",
                    "apellido": "López",
                    "ci": "78901234",
                    "email": "sofia.lopez@transporte.com",
                    "telefono": "555-0701",
                    "fecha_nacimiento": date(1990, 9, 25),
                    "nro_licencia": "LIC002",
                    "tipo_licencia": "D",
                    "fecha_venc_licencia": date.today() + timedelta(days=300),
                    "estado": "disponible",
                    "experiencia_anios": 5
                },
                {
                    "nombre": "Diego",
                    "apellido": "Ramírez",
                    "ci": "89012345",
                    "email": "diego.ramirez@transporte.com",
                    "telefono": "555-0801",
                    "fecha_nacimiento": date(1987, 1, 14),
                    "nro_licencia": "LIC003",
                    "tipo_licencia": "D",
                    "fecha_venc_licencia": date.today() + timedelta(days=180),
                    "estado": "ocupado",
                    "experiencia_anios": 12
                },
                {
                    "nombre": "Valentina",
                    "apellido": "Herrera",
                    "ci": "90123456",
                    "email": "valentina.herrera@transporte.com",
                    "telefono": "555-0901",
                    "fecha_nacimiento": date(1993, 6, 30),
                    "nro_licencia": "LIC004",
                    "tipo_licencia": "C",
                    "fecha_venc_licencia": date.today() + timedelta(days=400),
                    "estado": "descanso",
                    "experiencia_anios": 3
                },
                {
                    "nombre": "Andrés",
                    "apellido": "Mendoza",
                    "ci": "01234567",
                    "email": "andres.mendoza@transporte.com",
                    "telefono": "555-1001",
                    "fecha_nacimiento": date(1985, 10, 7),
                    "nro_licencia": "LIC005",
                    "tipo_licencia": "D",
                    "fecha_venc_licencia": date.today() - timedelta(days=30),  # Licencia vencida
                    "estado": "inactivo",
                    "experiencia_anios": 10
                }
            ]
            
            for data in conductores_data:
                conductor, created = Conductor.objects.get_or_create(
                    nro_licencia=data["nro_licencia"],
                    defaults=data
                )
                if created:
                    print(f"✓ Conductor creado: {conductor.nombre} {conductor.apellido} ({conductor.nro_licencia}) - Estado: {conductor.estado}")
                else:
                    print(f"- Conductor ya existe: {conductor.nombre} {conductor.apellido}")
                    
        except ImportError:
            print("❌ Error: No se pudo importar el modelo Conductor. Verifica que existe en conductores.models.")
        except Exception as e:
            print(f"❌ Error al crear conductores: {str(e)}")
    
    @classmethod
    def should_run(cls):
        """
        El seeder de conductores debe ejecutarse si no existen registros de conductores.
        """
        try:
            from conductores.models import Conductor
            return Conductor.objects.count() == 0
        except ImportError:
            return False
