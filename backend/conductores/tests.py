from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import date, timedelta
from .models import Conductor
from personal.models import Personal

User = get_user_model()


class ConductorModelTest(TestCase):
    """Tests para el modelo Conductor"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.conductor = Conductor.objects.create(
            nombre="Juan",
            apellido="Pérez",
            ci="12345678",
            email="juan@test.com",
            telefono="123456789",
            fecha_nacimiento="1990-01-01",
            nro_licencia="LIC123456",
            tipo_licencia="B",
            fecha_venc_licencia=date.today() + timedelta(days=365),
            experiencia_anios=5
        )
    
    def test_conductor_creation(self):
        """Test de creación de conductor"""
        self.assertEqual(self.conductor.nro_licencia, "LIC123456")
        self.assertEqual(self.conductor.tipo_licencia, "B")
        self.assertEqual(self.conductor.estado, "disponible")  # Estado por defecto
        self.assertEqual(self.conductor.experiencia_anios, 5)
        # El conductor no tiene usuario asignado en este test
        self.assertIsNone(self.conductor.usuario)
    
    def test_nombre_completo(self):
        """Test del property nombre_completo"""
        self.assertEqual(self.conductor.nombre_completo, "Juan Pérez")
    
    def test_licencia_vencida(self):
        """Test del property licencia_vencida"""
        # Licencia válida
        self.assertFalse(self.conductor.licencia_vencida)
        
        # Licencia vencida
        self.conductor.fecha_venc_licencia = date.today() - timedelta(days=1)
        self.conductor.save()
        self.assertTrue(self.conductor.licencia_vencida)
    
    def test_dias_para_vencer_licencia(self):
        """Test del property dias_para_vencer_licencia"""
        # Licencia válida
        dias_restantes = (self.conductor.fecha_venc_licencia - date.today()).days
        self.assertEqual(self.conductor.dias_para_vencer_licencia, dias_restantes)
        
        # Licencia vencida
        self.conductor.fecha_venc_licencia = date.today() - timedelta(days=5)
        self.conductor.save()
        self.assertEqual(self.conductor.dias_para_vencer_licencia, -5)
    
    def test_nro_licencia_unico(self):
        """Test de unicidad de número de licencia"""
        personal2 = Personal.objects.create(
            nombre="Pedro",
            apellido="García",
            ci="87654321",
            email="pedro@test.com",
            telefono="987654321",
            fecha_nacimiento="1985-05-15",
            codigo_empleado="EMP003",
            fecha_ingreso=date.today()
        )
        
        with self.assertRaises(IntegrityError):
            Conductor.objects.create(
                nombre="Pedro",
                apellido="García",
                ci="87654321",
                email="pedro@test.com",
                telefono="987654321",
                fecha_nacimiento="1985-05-15",
                nro_licencia="LIC123456",  # Misma licencia
                tipo_licencia="C",
                fecha_venc_licencia="2026-06-30",
                experiencia_anios=3
            )
    
    def test_experiencia_anios_positiva(self):
        """Test de que experiencia_anios sea positiva"""
        self.conductor.experiencia_anios = -1
        with self.assertRaises(ValidationError):
            self.conductor.full_clean()
    
    def test_cambiar_estado(self):
        """Test del método cambiar_estado"""
        # Cambiar a estado ocupado
        result = self.conductor.cambiar_estado('ocupado')
        self.assertTrue(result)
        self.assertEqual(self.conductor.estado, 'ocupado')
        
        # Cambiar a estado descanso
        result = self.conductor.cambiar_estado('descanso')
        self.assertTrue(result)
        self.assertEqual(self.conductor.estado, 'descanso')
        
        # Estado inválido
        result = self.conductor.cambiar_estado('estado_invalido')
        self.assertFalse(result)
    
    def test_estado_usuario(self):
        """Test del property estado_usuario"""
        # Sin usuario, estado_usuario es 'sin_usuario'
        self.assertEqual(self.conductor.estado_usuario, "sin_usuario")
        
        # Con usuario activo, estado_usuario es 'activo'
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            username="testuser2",
            email="test2@test.com",
            password="testpass"
        )
        self.conductor.usuario = user
        self.conductor.save()
        self.assertEqual(self.conductor.estado_usuario, "activo")
    
    def test_licencia_proxima_vencer(self):
        """Test del property licencia_proxima_vencer"""
        # Licencia que vence en 30 días
        self.conductor.fecha_venc_licencia = date.today() + timedelta(days=30)
        self.conductor.save()
        # Verificar que la licencia vence en 30 días
        self.assertEqual(self.conductor.dias_para_vencer_licencia, 30)
        
        # Licencia que vence en 60 días
        self.conductor.fecha_venc_licencia = date.today() + timedelta(days=60)
        self.conductor.save()
        self.assertEqual(self.conductor.dias_para_vencer_licencia, 60)


class ConductorAdminTest(TestCase):
    """Tests para el admin de conductores"""
    
    def setUp(self):
        """Configuración inicial"""
        self.conductor = Conductor.objects.create(
            nombre="María",
            apellido="López",
            ci="11223344",
            email="maria@test.com",
            telefono="555555555",
            fecha_nacimiento="1988-03-15",
            nro_licencia="LIC789012",
            tipo_licencia="D",
            fecha_venc_licencia=date.today() + timedelta(days=180),
            experiencia_anios=8
        )
    
    def test_conductor_str_representation(self):
        """Test de representación string del conductor"""
        expected = f"{self.conductor.nombre} {self.conductor.apellido} - {self.conductor.nro_licencia}"
        self.assertEqual(str(self.conductor), expected)
    
    def test_conductor_verbose_names(self):
        """Test de nombres verbose del modelo"""
        self.assertEqual(Conductor._meta.verbose_name, "Conductor")
        self.assertEqual(Conductor._meta.verbose_name_plural, "Conductores")