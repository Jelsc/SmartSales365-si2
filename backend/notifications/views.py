"""
Views para el sistema de notificaciones push
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import DeviceToken, Notification
from .serializers import (
    DeviceTokenSerializer,
    NotificationSerializer,
    SendNotificationSerializer
)
from .firebase_config import (
    send_push_notification,
    send_multicast_notification,
    send_topic_notification
)


class DeviceTokenViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar tokens de dispositivos FCM
    
    list: Listar tokens del usuario actual
    create: Registrar nuevo token
    retrieve: Obtener detalle de token
    update/partial_update: Actualizar token
    destroy: Eliminar token
    """
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Solo mostrar tokens del usuario actual"""
        return DeviceToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Asignar el usuario actual al crear token"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Endpoint simplificado para registrar token
        POST /api/notifications/tokens/register/
        {
            "token": "firebase_token_here",
            "device_type": "android",
            "device_name": "Samsung Galaxy S21"
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Token registrado exitosamente',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def unregister(self, request):
        """
        Desregistrar un token
        POST /api/notifications/tokens/unregister/
        {"token": "firebase_token_here"}
        """
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count, _ = DeviceToken.objects.filter(
            token=token,
            user=request.user
        ).delete()
        
        if deleted_count > 0:
            return Response({'message': 'Token eliminado exitosamente'})
        else:
            return Response(
                {'error': 'Token no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar notificaciones
    
    list: Listar notificaciones del usuario
    retrieve: Ver detalle de notificación
    my_notifications: Notificaciones no leídas
    mark_as_read: Marcar como leída
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Solo mostrar notificaciones del usuario actual"""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        """
        Obtener notificaciones no leídas del usuario
        GET /api/notifications/my_notifications/
        """
        unread = self.get_queryset().filter(estado='enviada')
        serializer = self.get_serializer(unread, many=True)
        return Response({
            'count': unread.count(),
            'notifications': serializer.data
        })

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marcar notificación como leída
        POST /api/notifications/{id}/mark_as_read/
        """
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notificación marcada como leída',
            'data': self.get_serializer(notification).data
        })

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Marcar todas las notificaciones como leídas
        POST /api/notifications/mark_all_as_read/
        """
        updated = self.get_queryset().filter(estado='enviada').update(
            estado='leida',
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated} notificaciones marcadas como leídas'
        })

    @action(detail=False, methods=['post'])
    def send(self, request):
        """
        Enviar notificación push
        POST /api/notifications/send/
        {
            "user_ids": [1, 2, 3],  // O usar "topic": "all_users"
            "tipo": "promo",
            "titulo": "Nueva oferta",
            "mensaje": "50% de descuento en laptops",
            "data": {"producto_id": 123}
        }
        
        Requiere permisos de administrador
        """
        # Verificar permisos
        if not request.user.is_staff:
            return Response(
                {'error': 'No tiene permisos para enviar notificaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        results = []
        
        # Enviar a usuarios específicos
        if 'user_ids' in data:
            for user_id in data['user_ids']:
                # Obtener tokens activos del usuario
                tokens = DeviceToken.objects.filter(
                    user_id=user_id,
                    is_active=True
                ).values_list('token', flat=True)
                
                if not tokens:
                    results.append({
                        'user_id': user_id,
                        'success': False,
                        'error': 'Usuario sin tokens'
                    })
                    continue
                
                # Crear registro de notificación
                notification = Notification.objects.create(
                    user_id=user_id,
                    tipo=data['tipo'],
                    titulo=data['titulo'],
                    mensaje=data['mensaje'],
                    data=data.get('data', {})
                )
                
                # Enviar a todos los dispositivos del usuario
                response = send_multicast_notification(
                    list(tokens),
                    data['titulo'],
                    data['mensaje'],
                    data.get('data', {})
                )
                
                if response and response.success_count > 0:
                    notification.mark_as_sent(f'multicast_{response.success_count}')
                    results.append({
                        'user_id': user_id,
                        'success': True,
                        'sent_to': response.success_count,
                        'failed': response.failure_count
                    })
                else:
                    notification.mark_as_failed('Error enviando notificación')
                    results.append({
                        'user_id': user_id,
                        'success': False,
                        'error': 'Error en Firebase'
                    })
        
        # Enviar a topic
        elif 'topic' in data:
            # Crear registro de notificación
            notification = Notification.objects.create(
                topic=data['topic'],
                tipo=data['tipo'],
                titulo=data['titulo'],
                mensaje=data['mensaje'],
                data=data.get('data', {})
            )
            
            message_id = send_topic_notification(
                data['topic'],
                data['titulo'],
                data['mensaje'],
                data.get('data', {})
            )
            
            if message_id:
                notification.mark_as_sent(message_id)
                results.append({
                    'topic': data['topic'],
                    'success': True,
                    'message_id': message_id
                })
            else:
                notification.mark_as_failed('Error enviando a topic')
                results.append({
                    'topic': data['topic'],
                    'success': False,
                    'error': 'Error en Firebase'
                })
        
        return Response({
            'message': 'Notificaciones procesadas',
            'results': results
        }, status=status.HTTP_200_OK)
