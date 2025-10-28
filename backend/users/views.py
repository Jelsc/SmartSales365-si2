"""
VIEWS.PY - VISTAS CRUD SIMPLIFICADAS

RESPONSABILIDADES:
- CRUD de usuarios
- CRUD de roles
- Gestión de perfiles
- Cambio de contraseñas
- Dashboard y estadísticas

DIFERENCIAS CON SISTEMA ANTERIOR:
- Vistas más simples y enfocadas
- Menos duplicación de código
- Mejor organización por funcionalidad
- Permisos más claros
"""

from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from bitacora.utils import registrar_bitacora
from .models import Rol
from .serializers import (
    UserSerializer,
    RolSerializer,
    UserProfileSerializer, 
    ChangePasswordSerializer
)
from .permissions import (
    IsAdminPortalUser, 
    CanManageUsers, 
    CanManageRoles, 
    IsOwnerOrAdmin
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    Vista para gestión completa de usuarios (CRUD)
    Solo administradores pueden gestionar usuarios
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminPortalUser, CanManageUsers]
    
    def get_queryset(self):
        """Obtener usuarios según permisos del usuario"""
        if self.request.user.is_superuser:
            return User.objects.all()
        else:
            # Los administradores normales solo ven usuarios no superusuarios
            return User.objects.filter(is_superuser=False)

    def perform_create(self, serializer):
        """Crear usuario con bitácora"""
        user = serializer.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Creación Usuario",
            descripcion=f"Usuario {user.username} creado por {self.request.user.username}",
            modulo="GESTION_USUARIOS"
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver, actualizar y eliminar usuarios
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminPortalUser, CanManageUsers]
    
    def get_queryset(self):
        """Obtener usuarios según permisos del usuario"""
        if self.request.user.is_superuser:
            return User.objects.all()
        else:
            return User.objects.filter(is_superuser=False)
    
    def perform_update(self, serializer):
        """Actualizar usuario con bitácora"""
        user = serializer.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualización Usuario",
            descripcion=f"Usuario {user.username} actualizado por {self.request.user.username}",
            modulo="GESTION_USUARIOS"
        )
    
    def perform_destroy(self, instance):
        """Eliminar usuario con bitácora"""
        username = instance.username
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminación Usuario",
            descripcion=f"Usuario {username} eliminado por {self.request.user.username}",
            modulo="GESTION_USUARIOS"
        )
        
        instance.delete()


class RolViewSet(generics.ListCreateAPIView):
    """
    Vista para listar y crear roles
    Solo administradores pueden gestionar roles
    """
    serializer_class = RolSerializer
    permission_classes = [IsAdminPortalUser, CanManageRoles]
    queryset = Rol.objects.all()
    
    def perform_create(self, serializer):
        """Crear rol con bitácora"""
        rol = serializer.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Creación Rol",
            descripcion=f"Rol {rol.nombre} creado por {self.request.user.username}",
            modulo="GESTION_ROLES"
        )


class RolDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver, actualizar y eliminar roles
    """
    serializer_class = RolSerializer
    permission_classes = [IsAdminPortalUser, CanManageRoles]
    queryset = Rol.objects.all()
    
    def perform_update(self, serializer):
        """Actualizar rol con bitácora"""
        rol = serializer.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualización Rol",
            descripcion=f"Rol {rol.nombre} actualizado por {self.request.user.username}",
            modulo="GESTION_ROLES"
        )
    
    def perform_destroy(self, instance):
        """Eliminar rol con bitácora"""
        nombre = instance.nombre
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminación Rol",
            descripcion=f"Rol {nombre} eliminado por {self.request.user.username}",
            modulo="GESTION_ROLES"
        )
        
        instance.delete()


class UserProfileView(APIView):
    """
    Vista para gestionar el perfil del usuario autenticado
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtener perfil del usuario"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Actualizar perfil del usuario"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            registrar_bitacora(
                request=request,
                usuario=request.user,
                accion="Actualización Perfil",
                descripcion=f"Perfil actualizado por {request.user.username}",
                modulo="PERFIL"
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Vista para cambiar contraseña del usuario autenticado
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Cambiar contraseña"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Cambiar contraseña
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            registrar_bitacora(
                request=request,
                usuario=request.user,
                accion="Cambio Contraseña",
                descripcion=f"Contraseña cambiada por {request.user.username}",
                modulo="PERFIL"
            )
            
            return Response({'message': 'Contraseña cambiada exitosamente'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_search(request):
    """
    Búsqueda de usuarios
    """
    query = request.GET.get('q', '')
    tipo = request.GET.get('tipo', '')
    
    if not query:
        return Response({'error': 'Parámetro de búsqueda requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Construir consulta
    q = Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
    
    # Filtrar por tipo si se especifica
    if tipo == 'administrativo':
        q &= Q(rol__es_administrativo=True)
    elif tipo == 'cliente':
        q &= Q(rol__es_administrativo=False)
    
    # Obtener usuarios
    usuarios = User.objects.filter(q)[:20]  # Limitar a 20 resultados
    
    serializer = UserSerializer(usuarios, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    Estadísticas de usuarios
    """
    if not request.user.es_administrativo:
        return Response({'error': 'Acceso denegado'}, status=status.HTTP_403_FORBIDDEN)

    stats = {
        'total_usuarios': User.objects.count(),
        'usuarios_activos': User.objects.filter(is_active=True).count(),
        'usuarios_inactivos': User.objects.filter(is_active=False).count(),
        'administrativos': User.objects.filter(rol__es_administrativo=True).count(),
        'clientes': User.objects.filter(rol__es_administrativo=False).count(),
        'superusuarios': User.objects.filter(is_superuser=True).count(),
    }
    
    # Estadísticas por rol
    roles_stats = []
    for rol in Rol.objects.all():
        roles_stats.append({
            'nombre': rol.nombre,
            'cantidad': User.objects.filter(rol=rol).count()
        })
    
    stats['por_rol'] = roles_stats

    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_user_status(request, user_id):
    """
    Activar/desactivar usuario
    """
    if not request.user.tiene_permiso('gestionar_usuarios'):
        return Response({'error': 'No tienes permisos para esta acción'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # No permitir desactivar superusuarios
    if user.is_superuser and not request.user.is_superuser:
        return Response({'error': 'No puedes desactivar superusuarios'}, status=status.HTTP_403_FORBIDDEN)
    
    # Cambiar estado
    user.is_active = not user.is_active
    user.save()
    
    estado = "activado" if user.is_active else "desactivado"
    
    registrar_bitacora(
        request=request,
        usuario=request.user,
        accion="Cambio Estado Usuario",
        descripcion=f"Usuario {user.username} {estado} por {request.user.username}",
        modulo="GESTION_USUARIOS"
    )
    
    return Response({
        'message': f'Usuario {estado} exitosamente',
        'is_active': user.is_active
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request, user_id):
    """
    Obtener permisos de un usuario específico
    """
    if not request.user.tiene_permiso('gestionar_usuarios'):
        return Response({'error': 'No tienes permisos para esta acción'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    permisos = user.get_permisos()
    
    return Response({
        'usuario': user.username,
        'rol': user.rol.nombre if user.rol else 'Sin rol',
        'permisos': permisos,
        'es_administrativo': user.es_administrativo,
        'puede_acceder_admin': user.puede_acceder_admin
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_permissions(request):
    """
    Obtener todos los permisos disponibles del sistema
    """
    if not request.user.tiene_permiso('gestionar_roles'):
        return Response({'error': 'No tienes permisos para ver permisos'}, status=status.HTTP_403_FORBIDDEN)
    
    from .constants import ALL_PERMISSIONS
    
    # Convertir permisos a formato esperado por el frontend
    permissions_list = []
    for i, permiso in enumerate(ALL_PERMISSIONS):
        permissions_list.append({
            'id': i + 1,
            'name': permiso.replace('_', ' ').title(),
            'codename': permiso,
            'content_type': 'custom_permission'
        })
    
    return Response(permissions_list)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_permissions_by_group(request):
    """
    Obtener permisos agrupados por categoría
    """
    if not request.user.tiene_permiso('gestionar_roles'):
        return Response({'error': 'No tienes permisos para ver permisos'}, status=status.HTTP_403_FORBIDDEN)
    
    from .constants import (
        AUTH_PERMISSIONS,
        USER_MANAGEMENT_PERMISSIONS,
        ROLE_MANAGEMENT_PERMISSIONS,
        DRIVER_MANAGEMENT_PERMISSIONS,
        STAFF_MANAGEMENT_PERMISSIONS,
        REPORT_PERMISSIONS,
        DASHBOARD_PERMISSIONS,
        CLIENT_PERMISSIONS,
        AUDIT_PERMISSIONS
    )
    
    groups = {
        'Autenticación': AUTH_PERMISSIONS,
        'Gestión de Usuarios': USER_MANAGEMENT_PERMISSIONS,
        'Gestión de Roles': ROLE_MANAGEMENT_PERMISSIONS,
        'Gestión de Conductores': DRIVER_MANAGEMENT_PERMISSIONS,
        'Gestión de Personal': STAFF_MANAGEMENT_PERMISSIONS,
        'Reportes': REPORT_PERMISSIONS,
        'Dashboard': DASHBOARD_PERMISSIONS,
        'Cliente': CLIENT_PERMISSIONS,
        'Bitácora': AUDIT_PERMISSIONS
    }
    
    # Convertir a formato esperado por el frontend
    formatted_groups = {}
    for group_name, permissions in groups.items():
        formatted_groups[group_name] = [
            {
                'id': i + 1,
                'name': permiso.replace('_', ' ').title(),
                'codename': permiso,
                'content_type': group_name.lower().replace(' ', '_')
            }
            for i, permiso in enumerate(permissions)
        ]
    
    return Response(formatted_groups)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_personal_disponible(request):
    """
    Obtener personal disponible para vincular con usuarios
    """
    if not request.user.tiene_permiso('gestionar_usuarios'):
        return Response({'error': 'No tienes permisos para ver personal disponible'}, status=status.HTTP_403_FORBIDDEN)

    try:
        from personal.models import Personal

        # Personal que está activo (ahora se verifica desde users.models.CustomUser)
        personal_disponible = Personal.objects.filter(
            estado=True
        ).values('id', 'nombre', 'apellido', 'email', 'ci', 'telefono')
        
        return Response(list(personal_disponible))
    except ImportError:
        return Response({'error': 'Módulo de personal no disponible'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_conductores_disponibles(request):
    """
    Obtener conductores disponibles para vincular con usuarios
    """
    if not request.user.tiene_permiso('gestionar_usuarios'):
        return Response({'error': 'No tienes permisos para ver conductores disponibles'}, status=status.HTTP_403_FORBIDDEN)

    try:
        from conductores.models import Conductor

        # Conductores que están disponibles (ahora se verifica desde users.models.CustomUser)
        conductores_disponibles = Conductor.objects.filter(
            estado='disponible'
        ).values('id', 'nombre', 'apellido', 'email', 'ci', 'telefono', 'nro_licencia')

        return Response(list(conductores_disponibles))
    except ImportError:
        return Response({'error': 'Módulo de conductores no disponible'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)