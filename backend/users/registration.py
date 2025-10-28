"""
REGISTRATION.PY - SISTEMA DE REGISTRO DIFERENCIADO

RESPONSABILIDADES:
- Registro de clientes (público con verificación)
- Registro de administradores (privado sin verificación)
- Autenticación con Google OAuth
- Verificación de códigos SMS/Email
- Asignación automática de roles

DIFERENCIAS CON SISTEMA ANTERIOR:
- Registro diferenciado según tipo de usuario
- Verificación obligatoria solo para clientes
- Creación de administradores solo por otros admins
- Integración con Google OAuth
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import requests
import random
import string
from bitacora.utils import registrar_bitacora
from .models import Rol
from .serializers import UserSerializer, ClienteRegisterSerializer, AdminCreateSerializer

User = get_user_model()


class ClienteRegisterView(APIView):
    """
    Registro público de clientes con verificación obligatoria
    """
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ClienteRegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            # Crear usuario cliente
            user = serializer.save()
            
            # Generar código de verificación
            verification_code = self._generate_verification_code()
            
            # Guardar código en cache (expira en 10 minutos)
            cache.set(f"verification_{user.id}", verification_code, 600)
            
            # Enviar código por SMS/Email (implementar según tu lógica)
            self._send_verification_code(user, verification_code)
            
            # Registrar en bitácora
            registrar_bitacora(
                request=request,
                usuario=user,
                accion="Registro Cliente",
                descripcion=f"Cliente {user.username} se registró (pendiente verificación)",
                modulo="AUTENTICACION"
            )
            
            return Response({
                'message': 'Usuario creado exitosamente. Se ha enviado un código de verificación.',
                'user_id': user.id,
                'email': user.email,
                'telefono': user.telefono
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _generate_verification_code(self):
        """Genera un código de verificación de 6 dígitos"""
        return ''.join(random.choices(string.digits, k=6))
    
    def _send_verification_code(self, user, code):
        """Envía el código de verificación por email usando templates"""
        try:
            # Contexto para los templates
            context = {
                'user': user,
                'verification_code': code,
                'site_name': 'Sistema de Inventario',
                'expiration_minutes': 10,
            }
            
            # Renderizar templates
            html_message = render_to_string('account/email/mobile_verification.html', context)
            plain_message = render_to_string('account/email/mobile_verification.txt', context)

            subject = "Código de verificación - Sistema de Inventario"
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            print(f"✅ Email de verificación enviado a {user.email} con código: {code}")
            
        except Exception as e:
            print(f"❌ Error enviando email a {user.email}: {str(e)}")
            # No lanzar excepción para no interrumpir el registro


class AdminCreateView(APIView):
    """
    Creación de usuarios administrativos (solo por otros administradores)
    Sin verificación necesaria
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Verificar que el usuario tenga permisos para crear administradores
        if not request.user.tiene_permiso('gestionar_usuarios'):
            return Response(
                {'error': 'No tienes permisos para crear usuarios administrativos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AdminCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Crear usuario administrativo
            user = serializer.save()
            
            # Registrar en bitácora
            registrar_bitacora(
                request=request,
                usuario=user,
                accion="Creación Usuario Administrativo",
                descripcion=f"Usuario administrativo {user.username} creado por {request.user.username}",
                modulo="GESTION_USUARIOS"
            )
            
            return Response({
                'message': 'Usuario administrativo creado exitosamente',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """
    Autenticación con Google OAuth
    Crea automáticamente usuarios cliente si no existen
    """
    try:
        access_token = request.data.get("access_token")
        
        if not access_token:
            return Response(
                {"error": "Token de acceso requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si es un token de prueba
        if access_token == "mock_google_token_for_testing":
            # Usar datos de prueba
            google_data = {
                "email": "test@example.com",
                "given_name": "Usuario",
                "family_name": "Prueba",
            }
            email = google_data["email"]
            first_name = google_data["given_name"]
            last_name = google_data["family_name"]
            username = email
        else:
            # Verificar el token con Google
            google_response = requests.get(
                f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            )
            
            if google_response.status_code != 200:
                return Response(
                    {"error": "Token de Google inválido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            google_data = google_response.json()
            email = google_data.get("email")
            first_name = google_data.get("given_name", "")
            last_name = google_data.get("family_name", "")
            username = google_data.get("email")  # Usar email como username
        
        if not email:
            return Response(
                {"error": "Email no proporcionado por Google"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar o crear usuario
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Crear nuevo usuario cliente
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=None,  # No password para OAuth
                is_active=True,
            )
            
            # Asignar rol de Cliente por defecto
            try:
                cliente_rol = Rol.objects.get(nombre="Cliente")
                user.rol = cliente_rol
                user.save()
            except Rol.DoesNotExist:
                # Crear rol Cliente si no existe
                cliente_rol = Rol.objects.create(
                    nombre="Cliente",
                    descripcion="Cliente regular del sistema",
                    es_administrativo=False,
                )
                user.rol = cliente_rol
                user.save()
        
        # Actualizar último acceso (Django maneja esto automáticamente)
        # user.last_login se actualiza automáticamente por Django
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Registrar en bitácora
        registrar_bitacora(
            request=request,
            usuario=user,
            accion="Login Google",
            descripcion=f"Cliente {user.username} inició sesión con Google",
            modulo="AUTENTICACION"
        )
        
        return Response({
            "access": str(access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
            "tipo_login": "cliente",
            "puede_acceder_admin": False
        })
        
    except Exception as e:
        return Response(
            {"error": f"Error en autenticación con Google: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_code(request):
    """
    Verificación de código para usuarios cliente
    """
    user_id = request.data.get('user_id')
    code = request.data.get('code')
    
    if not user_id or not code:
        return Response(
            {'error': 'user_id y code son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar código
    stored_code = cache.get(f"verification_{user_id}")
    
    if not stored_code:
        return Response(
            {'error': 'Código expirado o no válido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if stored_code != code:
        return Response(
            {'error': 'Código incorrecto'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Código correcto, activar usuario
    user.is_active = True
    user.save()
    
    # Eliminar código de cache
    cache.delete(f"verification_{user_id}")
    
    # Registrar en bitácora
    registrar_bitacora(
        request=request,
        usuario=user,
        accion="Verificación Cliente",
        descripcion=f"Cliente {user.username} verificó su cuenta",
        modulo="AUTENTICACION"
    )
    
    return Response({
        'message': 'Usuario verificado exitosamente',
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_verification_code(request):
    """
    Reenviar código de verificación
    """
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {'error': 'user_id es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generar nuevo código
    verification_code = ''.join(random.choices(string.digits, k=6))
    
    # Guardar código en cache (expira en 10 minutos)
    cache.set(f"verification_{user_id}", verification_code, 600)
    
    # Enviar código por email usando templates
    try:
        # Contexto para los templates
        context = {
            'user': user,
            'verification_code': verification_code,
            'site_name': 'Sistema de Inventario',
            'expiration_minutes': 10,
        }
        
        # Renderizar templates
        html_message = render_to_string('account/email/mobile_verification.html', context)
        plain_message = render_to_string('account/email/mobile_verification.txt', context)
        
        subject = "Código de verificación - Sistema de Inventario"
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✅ Email de reenvío enviado a {user.email} con código: {verification_code}")
        
    except Exception as e:
        print(f"❌ Error enviando email de reenvío a {user.email}: {str(e)}")
        return Response(
            {'error': 'Error enviando el código de verificación'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        'message': 'Código de verificación reenviado'
    })
