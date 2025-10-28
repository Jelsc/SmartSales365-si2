from rest_framework import viewsets, status, permissions, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from bitacora.utils import registrar_bitacora
from .models import Personal
from .serializers import (
    PersonalSerializer,
    PersonalCreateSerializer,
    PersonalUpdateSerializer,
    PersonalEstadoSerializer
)


class PersonalViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de personal - Refactorizado"""
    
    queryset = Personal.objects.all()
    serializer_class = PersonalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['nombre', 'apellido', 'email', 'ci', 'codigo_empleado']
    ordering_fields = ['nombre', 'apellido', 'fecha_creacion', 'fecha_ingreso']
    ordering = ['-fecha_creacion']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == "create":
            return PersonalCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return PersonalUpdateSerializer
        elif self.action == "cambiar_estado":
            return PersonalEstadoSerializer
        return PersonalSerializer

    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()

        # Si el usuario no tiene permisos para gestionar personal, solo puede ver su propio perfil
        if not self.request.user.tiene_permiso('gestionar_personal'):
            try:
                personal_profile = self.request.user.personal_profile.first()
                if personal_profile:
                    return queryset.filter(id=personal_profile.id)
                else:
                    return queryset.none()
            except:
                return queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """Crear un nuevo empleado"""
        if not self.request.user.tiene_permiso('gestionar_personal'):
            raise PermissionDenied("No tienes permisos para crear empleados")
            
        empleado = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Crear",
            descripcion=f"Se creó el empleado {empleado.nombre_completo}",
            modulo="PERSONAL",
        )

    def perform_update(self, serializer):
        """Actualizar un empleado"""
        if not self.request.user.tiene_permiso('gestionar_personal'):
            raise PermissionDenied("No tienes permisos para actualizar empleados")
        
        empleado = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualizar",
            descripcion=f"Se actualizó el empleado {empleado.nombre_completo}",
            modulo="PERSONAL",
        )

    def perform_destroy(self, instance):
        """Eliminar un empleado"""
        if not self.request.user.tiene_permiso('gestionar_personal'):
            raise PermissionDenied("No tienes permisos para eliminar empleados")
        
        nombre_empleado = instance.nombre_completo
        instance.delete()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminar",
            descripcion=f"Se eliminó el empleado {nombre_empleado}",
            modulo="PERSONAL",
        )

    @action(detail=True, methods=["post"])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del empleado"""
        if not request.user.tiene_permiso("gestionar_personal"):
            return Response(
                {"error": "No tienes permisos para cambiar el estado de empleados"},
                status=status.HTTP_403_FORBIDDEN,
            )

        empleado = self.get_object()
        serializer = self.get_serializer(empleado, data=request.data)

        if serializer.is_valid():
            empleado = serializer.save()

            # Registrar en bitácora
            registrar_bitacora(
                request=request,
                usuario=request.user,
                accion="Cambiar Estado",
                descripcion=f"Se cambió el estado del empleado {empleado.nombre_completo} a {'Activo' if empleado.estado else 'Inactivo'}",
                modulo="PERSONAL"
            )
            
            return Response({
                'message': f'Estado del empleado {empleado.nombre_completo} actualizado a {"Activo" if empleado.estado else "Inactivo"}',
                'empleado': PersonalSerializer(empleado).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Estadísticas de personal"""
        if not request.user.tiene_permiso("gestionar_personal"):
            return Response(
                {"error": "No tienes permisos para ver estadísticas"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(estado=True).count(),
            'inactivos': queryset.filter(estado=False).count(),
            'nuevos_este_mes': queryset.filter(
                fecha_creacion__gte=timezone.now().replace(day=1)
            ).count(),
        }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def disponibles_para_usuario(self, request):
        """Lista personal disponible para vincular con usuarios"""
        if not request.user.tiene_permiso("gestionar_usuarios"):
            return Response(
                {"error": "No tienes permisos para ver personal disponible"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Personal activo disponible
        personal_disponible = Personal.objects.filter(
            estado=True
        ).values('id', 'nombre', 'apellido', 'email', 'ci', 'telefono')
        
        return Response(list(personal_disponible))
