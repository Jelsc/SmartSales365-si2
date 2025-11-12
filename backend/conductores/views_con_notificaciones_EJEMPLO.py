"""
EJEMPLO DE IMPLEMENTACIÓN: Integrar notificaciones en conductores/views.py

Este archivo muestra cómo quedaría tu views.py CON notificaciones integradas.
Solo necesitas copiar las partes relevantes a tu archivo real.
"""

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from bitacora.utils import registrar_bitacora
from users.permissions import CanManageConductores, IsOwnerOrAdmin
from .models import Conductor
from .serializers import (
    ConductorSerializer,
    ConductorCreateSerializer,
    ConductorUpdateSerializer,
    ConductorUbicacionSerializer
)

# 🔔 NUEVO: Importar utilidades de notificaciones
from notifications.utils import (
    notificar_admins,
    notificar_usuario,
    notificar_nuevo_conductor,
    notificar_asignacion_vehiculo
)


class ConductorViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de conductores"""

    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_licencia']
    search_fields = ['nombre', 'apellido', 'email', 'ci', 'nro_licencia']
    ordering_fields = ['nombre', 'fecha_creacion', 'fecha_venc_licencia']
    ordering = ['-fecha_creacion']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == "create":
            return ConductorCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ConductorUpdateSerializer
        elif self.action == "actualizar_ubicacion":
            return ConductorUbicacionSerializer
        return ConductorSerializer

    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()

        if not self.request.user.tiene_permiso("gestionar_conductores"):
            if hasattr(self.request.user, "conductor_profile"):
                return queryset.filter(id=self.request.user.conductor_profile.id)
            else:
                return queryset.none()

        licencia_vencida = self.request.query_params.get("licencia_vencida")
        if licencia_vencida is not None:
            hoy = timezone.now().date()
            if licencia_vencida.lower() == "true":
                queryset = queryset.filter(fecha_venc_licencia__lt=hoy)
            elif licencia_vencida.lower() == "false":
                queryset = queryset.filter(fecha_venc_licencia__gte=hoy)

        return queryset

    def perform_create(self, serializer):
        """Crear un nuevo conductor"""
        if not self.request.user.tiene_permiso("gestionar_conductores"):
            raise permissions.PermissionDenied(
                "No tienes permisos para crear conductores"
            )

        conductor = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Crear",
            descripcion=f"Se creó el conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES",
        )

        # 🔔 NUEVO: Notificar a administradores
        try:
            notificar_nuevo_conductor(conductor, self.request.user)
        except Exception as e:
            # Log pero no falla la operación
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error enviando notificación: {str(e)}')

    def perform_update(self, serializer):
        """Actualizar un conductor"""
        if not self.request.user.tiene_permiso("gestionar_conductores"):
            raise permissions.PermissionDenied(
                "No tienes permisos para actualizar conductores"
            )

        conductor_anterior = self.get_object()
        estado_anterior = conductor_anterior.estado
        
        conductor = serializer.save()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualizar",
            descripcion=f"Se actualizó el conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES",
        )

        # 🔔 NUEVO: Notificar si cambió el estado
        if estado_anterior != conductor.estado and hasattr(conductor, 'usuario'):
            try:
                if conductor.estado == 'activo':
                    titulo = '✅ Cuenta Activada'
                    mensaje = 'Tu cuenta de conductor ha sido activada'
                    tipo = 'info'
                else:
                    titulo = '⚠️ Estado Cambiado'
                    mensaje = f'Tu estado cambió a: {conductor.estado}'
                    tipo = 'alert'
                
                notificar_usuario(
                    usuario=conductor.usuario,
                    titulo=titulo,
                    mensaje=mensaje,
                    tipo=tipo,
                    data={
                        'conductor_id': conductor.id,
                        'nuevo_estado': conductor.estado,
                        'screen': 'profile'
                    }
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Error enviando notificación de cambio de estado: {str(e)}')

    def perform_destroy(self, instance):
        """Eliminar un conductor"""
        if not self.request.user.tiene_permiso("gestionar_conductores"):
            raise permissions.PermissionDenied(
                "No tienes permisos para eliminar conductores"
            )

        nombre_conductor = instance.nombre_completo
        instance.delete()

        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminar",
            descripcion=f"Se eliminó el conductor {nombre_conductor}",
            modulo="CONDUCTORES",
        )
    
    @action(detail=True, methods=['post'])
    def actualizar_ubicacion(self, request, pk=None):
        """Actualizar ubicación del conductor"""
        conductor = self.get_object()
        serializer = self.get_serializer(conductor, data=request.data)

        if serializer.is_valid():
            conductor = serializer.save()
            conductor.actualizar_ubicacion(
                serializer.validated_data["ultima_ubicacion_lat"],
                serializer.validated_data["ultima_ubicacion_lng"],
            )

            return Response(
                {
                    "message": "Ubicación actualizada correctamente",
                    "conductor": ConductorSerializer(conductor).data,
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔔 NUEVO: Endpoint para asignar vehículo
    @action(detail=True, methods=['post'])
    def asignar_vehiculo(self, request, pk=None):
        """Asignar vehículo a conductor y notificar"""
        if not self.request.user.tiene_permiso("gestionar_conductores"):
            return Response(
                {"error": "No tienes permisos para asignar vehículos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        conductor = self.get_object()
        vehiculo_id = request.data.get('vehiculo_id')
        
        if not vehiculo_id:
            return Response(
                {"error": "vehiculo_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aquí iría la lógica de asignación real
        # Por ejemplo: conductor.vehiculo_id = vehiculo_id
        # conductor.save()
        
        # Registrar en bitácora
        registrar_bitacora(
            request=request,
            usuario=request.user,
            accion="Asignar Vehículo",
            descripcion=f"Se asignó vehículo {vehiculo_id} al conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES",
        )
        
        # 🔔 Notificar al conductor
        try:
            if hasattr(conductor, 'usuario') and conductor.usuario:
                notificar_usuario(
                    usuario=conductor.usuario,
                    titulo='🚙 Vehículo Asignado',
                    mensaje='Se te ha asignado un nuevo vehículo para tus rutas',
                    tipo='info',
                    data={
                        'vehiculo_id': vehiculo_id,
                        'conductor_id': conductor.id,
                        'screen': 'mis_vehiculos',
                        'action': 'view'
                    }
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error enviando notificación de asignación: {str(e)}')
        
        return Response({
            'message': 'Vehículo asignado correctamente',
            'conductor': ConductorSerializer(conductor).data
        })

    # 🔔 NUEVO: Endpoint para asignar ruta
    @action(detail=True, methods=['post'])
    def asignar_ruta(self, request, pk=None):
        """Asignar ruta a conductor y notificar"""
        if not self.request.user.tiene_permiso("gestionar_conductores"):
            return Response(
                {"error": "No tienes permisos para asignar rutas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        conductor = self.get_object()
        ruta_data = request.data
        
        # Aquí iría la lógica de asignación de ruta
        # Por ejemplo: crear_asignacion_ruta(conductor, ruta_data)
        
        # Registrar en bitácora
        registrar_bitacora(
            request=request,
            usuario=request.user,
            accion="Asignar Ruta",
            descripcion=f"Se asignó ruta al conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES",
        )
        
        # 🔔 Notificar al conductor
        try:
            if hasattr(conductor, 'usuario') and conductor.usuario:
                notificar_usuario(
                    usuario=conductor.usuario,
                    titulo='🗺️ Nueva Ruta Asignada',
                    mensaje='Se te ha asignado una nueva ruta de entrega',
                    tipo='info',
                    data={
                        'ruta': ruta_data,
                        'conductor_id': conductor.id,
                        'screen': 'mis_rutas',
                        'action': 'view'
                    }
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error enviando notificación de ruta: {str(e)}')
        
        return Response({
            'message': 'Ruta asignada correctamente',
            'conductor': ConductorSerializer(conductor).data
        })

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Estadísticas de conductores"""
        if not request.user.tiene_permiso("gestionar_conductores"):
            return Response(
                {"error": "No tienes permisos para ver estadísticas"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()
        
        total = queryset.count()
        activos = queryset.filter(estado="activo").count()
        inactivos = queryset.filter(estado="inactivo").count()
        
        # Licencias por vencer en 30 días
        from datetime import timedelta
        hoy = timezone.now().date()
        fecha_limite = hoy + timedelta(days=30)
        
        licencias_por_vencer = queryset.filter(
            fecha_venc_licencia__gte=hoy,
            fecha_venc_licencia__lte=fecha_limite,
            estado='activo'
        ).count()

        return Response({
            "total": total,
            "activos": activos,
            "inactivos": inactivos,
            "licencias_por_vencer": licencias_por_vencer
        })


# 🔔 NUEVO: Función helper que se puede llamar desde Celery o comandos
def verificar_licencias_por_vencer():
    """
    Función para verificar licencias próximas a vencer y notificar
    Puede ser llamada desde Celery, Django Command, o manualmente
    """
    from datetime import timedelta
    from notifications.utils import notificar_licencia_por_vencer
    import logging
    
    logger = logging.getLogger(__name__)
    hoy = timezone.now().date()
    fecha_limite = hoy + timedelta(days=30)
    
    # Buscar conductores con licencia por vencer
    conductores = Conductor.objects.filter(
        fecha_venc_licencia__gte=hoy,
        fecha_venc_licencia__lte=fecha_limite,
        estado='activo'
    )
    
    logger.info(f'Verificando {conductores.count()} licencias próximas a vencer')
    
    for conductor in conductores:
        dias_restantes = (conductor.fecha_venc_licencia - hoy).days
        
        try:
            notificar_licencia_por_vencer(conductor, dias_restantes)
            logger.info(f'Notificación enviada a {conductor.nombre_completo} - {dias_restantes} días')
        except Exception as e:
            logger.error(f'Error notificando a {conductor.nombre_completo}: {str(e)}')


"""
RESUMEN DE CAMBIOS NECESARIOS:

1. Importar utilidades al inicio:
   from notifications.utils import (
       notificar_admins,
       notificar_usuario,
       notificar_nuevo_conductor,
       notificar_asignacion_vehiculo
   )

2. En perform_create(), después de crear el conductor:
   notificar_nuevo_conductor(conductor, self.request.user)

3. En perform_update(), si cambia el estado:
   notificar_usuario(conductor.usuario, titulo, mensaje, tipo, data)

4. Agregar nuevos endpoints con @action para asignar_vehiculo y asignar_ruta

5. Crear función verificar_licencias_por_vencer() para llamar periódicamente

VENTAJAS:
- ✅ Código limpio y modular
- ✅ Notificaciones no rompen la funcionalidad principal (try/except)
- ✅ Fácil de mantener y extender
- ✅ Reutilización de código con utils
- ✅ Compatible con tu arquitectura existente
"""
