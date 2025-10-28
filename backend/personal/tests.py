from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from .models import Personal

User = get_user_model()


class PersonalAPISimpleTest(APITestCase):
    """Tests simples para la API de Personal - Sin permisos"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="admin123",
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)
        
        self.personal_data = {
            "nombre": "Juan",
            "apellido": "Pérez",
            "ci": "12345678",
            "email": "juan@test.com",
            "telefono": "123456789",
            "fecha_nacimiento": "1990-01-01",
            "codigo_empleado": "EMP001",
            "fecha_ingreso": date.today() - timedelta(days=365),
            "estado": True
        }
    
    def test_create_personal_direct(self):
        """Test de creación directa de personal"""
        personal = Personal.objects.create(**self.personal_data)
        
        self.assertEqual(personal.nombre, "Juan")
        self.assertEqual(personal.apellido, "Pérez")
        self.assertEqual(personal.email, "juan@test.com")
        self.assertEqual(personal.codigo_empleado, "EMP001")
        self.assertTrue(personal.estado)
    
    def test_personal_str_representation(self):
        """Test de representación string"""
        personal = Personal.objects.create(**self.personal_data)
        expected = "Juan Pérez - EMP001"
        self.assertEqual(str(personal), expected)
    
    def test_personal_unique_constraints(self):
        """Test de restricciones de unicidad"""
        Personal.objects.create(**self.personal_data)
        
        # Email único
        personal_data_2 = self.personal_data.copy()
        personal_data_2.update({
            "ci": "87654321",
            "codigo_empleado": "EMP002"
        })
        
        with self.assertRaises(Exception):
            Personal.objects.create(**personal_data_2)
    
    def test_personal_estado_boolean(self):
        """Test de estado como boolean"""
        personal = Personal.objects.create(**self.personal_data)
        
        # Estado por defecto
        self.assertTrue(personal.estado)
        
        # Cambiar estado
        personal.estado = False
        personal.save()
        self.assertFalse(personal.estado)
    
    def test_personal_fechas_automaticas(self):
        """Test de fechas automáticas"""
        personal = Personal.objects.create(**self.personal_data)
        
        self.assertIsNotNone(personal.fecha_creacion)
        self.assertIsNotNone(personal.fecha_actualizacion)
    
    def test_personal_anos_antiguedad(self):
        """Test de cálculo de años de antigüedad"""
        personal = Personal.objects.create(**self.personal_data)
        
        # El empleado tiene 1 año de antigüedad
        self.assertEqual(personal.anos_antiguedad, 1)
    
    def test_personal_puede_acceder_sistema(self):
        """Test de acceso al sistema"""
        personal = Personal.objects.create(**self.personal_data)
        
        # Sin usuario, solo depende del estado
        self.assertTrue(personal.puede_acceder_sistema())
        
        personal.estado = False
        personal.save()
        self.assertFalse(personal.puede_acceder_sistema())
    
    def test_personal_con_usuario(self):
        """Test de personal con usuario vinculado"""
        personal = Personal.objects.create(**self.personal_data)
        personal.usuario = self.user
        personal.save()
        
        # Con usuario activo y personal activo
        self.assertTrue(personal.puede_acceder_sistema())
        
        # Con usuario inactivo
        self.user.is_active = False
        self.user.save()
        self.assertFalse(personal.puede_acceder_sistema())
    
    def test_personal_cambiar_estado(self):
        """Test de cambio de estado"""
        personal = Personal.objects.create(**self.personal_data)
        
        # Cambiar a inactivo
        result = personal.cambiar_estado(False)
        self.assertTrue(result)
        self.assertFalse(personal.estado)
        
        # Cambiar a activo
        result = personal.cambiar_estado(True)
        self.assertTrue(result)
        self.assertTrue(personal.estado)
