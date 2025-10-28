"""
Seeder para datos de Personal de la empresa.
"""
from .base_seeder import BaseSeeder
from datetime import date, timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class PersonalSeeder(BaseSeeder):
    """
    Crea datos de Personal para el sistema de transporte.
    """
    
    @classmethod
    def run(cls):
        """
        Crea registros de personal de prueba.
        """
        try:
            from personal.models import Personal
            
            # Datos de personal de prueba
            personal_data = [
                {
                    "nombre": "María",
                    "apellido": "González",
                    "ci": "12345678",
                    "email": "maria.gonzalez@transporte.com",
                    "telefono": "555-0101",
                    "fecha_nacimiento": date(1985, 3, 15),
                    "codigo_empleado": "EMP001",
                    "fecha_ingreso": date(2020, 1, 15),
                    "estado": True,
                    "telefono_emergencia": "555-0102",
                    "contacto_emergencia": "Juan González (Esposo)"
                },
                {
                    "nombre": "Carlos",
                    "apellido": "Rodríguez",
                    "ci": "23456789",
                    "email": "carlos.rodriguez@transporte.com",
                    "telefono": "555-0201",
                    "fecha_nacimiento": date(1988, 7, 22),
                    "codigo_empleado": "EMP002",
                    "fecha_ingreso": date(2019, 6, 10),
                    "estado": True,
                    "telefono_emergencia": "555-0202",
                    "contacto_emergencia": "Ana Rodríguez (Hermana)"
                },
                {
                    "nombre": "Laura",
                    "apellido": "Martínez",
                    "ci": "34567890",
                    "email": "laura.martinez@transporte.com",
                    "telefono": "555-0301",
                    "fecha_nacimiento": date(1992, 11, 8),
                    "codigo_empleado": "EMP003",
                    "fecha_ingreso": date(2021, 3, 1),
                    "estado": True,
                    "telefono_emergencia": "555-0302",
                    "contacto_emergencia": "Pedro Martínez (Padre)"
                },
                {
                    "nombre": "Roberto",
                    "apellido": "Silva",
                    "ci": "45678901",
                    "email": "roberto.silva@transporte.com",
                    "telefono": "555-0401",
                    "fecha_nacimiento": date(1980, 5, 12),
                    "codigo_empleado": "EMP004",
                    "fecha_ingreso": date(2018, 9, 15),
                    "estado": True,
                    "telefono_emergencia": "555-0402",
                    "contacto_emergencia": "Carmen Silva (Madre)"
                },
                {
                    "nombre": "Ana",
                    "apellido": "Fernández",
                    "ci": "56789012",
                    "email": "ana.fernandez@transporte.com",
                    "telefono": "555-0501",
                    "fecha_nacimiento": date(1995, 12, 3),
                    "codigo_empleado": "EMP005",
                    "fecha_ingreso": date(2022, 2, 14),
                    "estado": False,  # Empleado inactivo
                    "telefono_emergencia": "555-0502",
                    "contacto_emergencia": "Luis Fernández (Hermano)"
                }
            ]
            
            for data in personal_data:
                personal, created = Personal.objects.get_or_create(
                    ci=data["ci"],
                    defaults=data
                )
                if created:
                    print(f"✓ Personal creado: {personal.nombre} {personal.apellido} ({personal.codigo_empleado})")
                else:
                    print(f"- Personal ya existe: {personal.nombre} {personal.apellido}")
                    
        except ImportError:
            print("❌ Error: No se pudo importar el modelo Personal. Verifica que existe en personal.models.")
        except Exception as e:
            print(f"❌ Error al crear personal: {str(e)}")
    
    @classmethod
    def should_run(cls):
        """
        El seeder de personal debe ejecutarse si no existen registros de personal.
        """
        try:
            from personal.models import Personal
            return Personal.objects.count() == 0
        except ImportError:
            return False
