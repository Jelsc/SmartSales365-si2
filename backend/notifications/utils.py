"""
Utilidades para enviar notificaciones push desde cualquier módulo
"""
from .models import DeviceToken, Notification
from .firebase_config import send_multicast_notification, send_topic_notification
import logging

logger = logging.getLogger(__name__)


def notificar_usuario(usuario, titulo, mensaje, tipo='info', data=None):
    """
    Enviar notificación a un usuario específico
    
    Args:
        usuario: Instancia del modelo User
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación ('info', 'promo', 'news', 'alert')
        data: Diccionario con datos adicionales para la app
    
    Returns:
        bool: True si se envió exitosamente, False en caso contrario
    
    Ejemplo:
        from notifications.utils import notificar_usuario
        
        notificar_usuario(
            usuario=conductor.usuario,
            titulo='🚗 Nueva Ruta Asignada',
            mensaje='Se te ha asignado una ruta de entrega',
            tipo='info',
            data={'ruta_id': 123, 'screen': 'mis_rutas'}
        )
    """
    try:
        # Obtener tokens activos del usuario
        tokens = DeviceToken.objects.filter(
            user=usuario,
            is_active=True
        ).values_list('token', flat=True)
        
        if not tokens:
            logger.warning(f'Usuario {usuario.username} no tiene tokens registrados')
            return False
        
        # Crear registro de notificación
        notification = Notification.objects.create(
            user=usuario,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            data=data or {}
        )
        
        # Enviar notificación push
        response = send_multicast_notification(
            list(tokens),
            titulo,
            mensaje,
            data or {}
        )
        
        if response and response.success_count > 0:
            notification.mark_as_sent(f'multicast_{response.success_count}')
            logger.info(f'Notificación enviada a {usuario.username}: {titulo}')
            return True
        else:
            notification.mark_as_failed('No se pudo enviar a ningún dispositivo')
            logger.error(f'Error enviando notificación a {usuario.username}')
            return False
            
    except Exception as e:
        logger.error(f'Excepción al notificar a {usuario.username}: {str(e)}')
        return False


def notificar_usuarios(usuarios, titulo, mensaje, tipo='info', data=None):
    """
    Enviar notificación a múltiples usuarios
    
    Args:
        usuarios: QuerySet o lista de usuarios
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        data: Datos adicionales
    
    Returns:
        dict: {'enviados': int, 'fallidos': int, 'total': int}
    
    Ejemplo:
        from notifications.utils import notificar_usuarios
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        admins = User.objects.filter(is_staff=True)
        
        resultado = notificar_usuarios(
            usuarios=admins,
            titulo='📢 Nuevo Conductor',
            mensaje='Se registró un nuevo conductor en el sistema',
            tipo='info',
            data={'screen': 'conductores'}
        )
    """
    resultados = {'enviados': 0, 'fallidos': 0, 'total': len(usuarios)}
    
    for usuario in usuarios:
        if notificar_usuario(usuario, titulo, mensaje, tipo, data):
            resultados['enviados'] += 1
        else:
            resultados['fallidos'] += 1
    
    logger.info(f'Notificación masiva: {resultados["enviados"]} enviadas, {resultados["fallidos"]} fallidas')
    return resultados


def notificar_por_rol(rol_nombre, titulo, mensaje, tipo='info', data=None):
    """
    Enviar notificación a todos los usuarios con un rol específico
    
    Args:
        rol_nombre: Nombre del rol (ej: 'CONDUCTOR', 'ADMIN')
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        data: Datos adicionales
    
    Returns:
        dict: Resultado del envío
    
    Ejemplo:
        from notifications.utils import notificar_por_rol
        
        notificar_por_rol(
            rol_nombre='CONDUCTOR',
            titulo='📢 Reunión General',
            mensaje='Reunión obligatoria mañana a las 10 AM',
            tipo='alert',
            data={'screen': 'calendario'}
        )
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        # Obtener usuarios con el rol especificado
        usuarios = User.objects.filter(
            grupos__nombre=rol_nombre,
            is_active=True
        ).distinct()
        
        if not usuarios.exists():
            logger.warning(f'No se encontraron usuarios con el rol {rol_nombre}')
            return {'enviados': 0, 'fallidos': 0, 'total': 0}
        
        return notificar_usuarios(usuarios, titulo, mensaje, tipo, data)
        
    except Exception as e:
        logger.error(f'Error al notificar por rol {rol_nombre}: {str(e)}')
        return {'enviados': 0, 'fallidos': 1, 'total': 1}


def notificar_topic(topic, titulo, mensaje, tipo='info', data=None):
    """
    Enviar notificación a un topic (broadcast)
    
    Args:
        topic: Nombre del topic (ej: 'all_users', 'promos')
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        data: Datos adicionales
    
    Returns:
        bool: True si se envió exitosamente
    
    Ejemplo:
        from notifications.utils import notificar_topic
        
        notificar_topic(
            topic='all_users',
            titulo='🎁 Nueva Promoción',
            mensaje='50% de descuento en productos seleccionados',
            tipo='promo',
            data={'descuento': 50, 'screen': 'promociones'}
        )
    """
    try:
        # Crear registro de notificación
        notification = Notification.objects.create(
            topic=topic,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            data=data or {}
        )
        
        # Enviar a topic
        message_id = send_topic_notification(
            topic,
            titulo,
            mensaje,
            data or {}
        )
        
        if message_id:
            notification.mark_as_sent(message_id)
            logger.info(f'Notificación enviada al topic {topic}: {titulo}')
            return True
        else:
            notification.mark_as_failed('Error al enviar a topic')
            logger.error(f'Error enviando notificación al topic {topic}')
            return False
            
    except Exception as e:
        logger.error(f'Excepción al notificar topic {topic}: {str(e)}')
        return False


def notificar_admins(titulo, mensaje, tipo='info', data=None):
    """
    Enviar notificación a todos los administradores
    
    Args:
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        data: Datos adicionales
    
    Returns:
        dict: Resultado del envío
    
    Ejemplo:
        from notifications.utils import notificar_admins
        
        notificar_admins(
            titulo='⚠️ Alerta del Sistema',
            mensaje='Stock bajo en 5 productos',
            tipo='alert',
            data={'screen': 'inventario'}
        )
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    admins = User.objects.filter(is_staff=True, is_active=True)
    return notificar_usuarios(admins, titulo, mensaje, tipo, data)


def notificar_con_retry(usuario, titulo, mensaje, tipo='info', data=None, max_intentos=3):
    """
    Enviar notificación con reintentos automáticos
    
    Args:
        usuario: Instancia del modelo User
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        data: Datos adicionales
        max_intentos: Número máximo de reintentos
    
    Returns:
        bool: True si se envió exitosamente
    
    Ejemplo:
        from notifications.utils import notificar_con_retry
        
        # Notificación crítica con reintentos
        notificar_con_retry(
            usuario=conductor.usuario,
            titulo='🚨 Alerta de Seguridad',
            mensaje='Detectamos actividad inusual en tu cuenta',
            tipo='alert',
            data={'screen': 'security'},
            max_intentos=5
        )
    """
    for intento in range(max_intentos):
        try:
            if notificar_usuario(usuario, titulo, mensaje, tipo, data):
                return True
            
            if intento < max_intentos - 1:
                logger.warning(f'Reintento {intento + 1}/{max_intentos} para notificar a {usuario.username}')
                
        except Exception as e:
            if intento == max_intentos - 1:
                logger.error(f'Error después de {max_intentos} intentos: {str(e)}')
                return False
    
    return False


# Funciones de conveniencia para eventos comunes
def notificar_nuevo_conductor(conductor, creado_por):
    """Notificar a admins cuando se crea un conductor"""
    return notificar_admins(
        titulo='🚗 Nuevo Conductor Registrado',
        mensaje=f'{conductor.nombre_completo} ha sido registrado en el sistema',
        tipo='info',
        data={
            'conductor_id': conductor.id,
            'conductor_nombre': conductor.nombre_completo,
            'creado_por': creado_por.username,
            'screen': 'conductores',
            'action': 'view_detail'
        }
    )


def notificar_asignacion_vehiculo(conductor, vehiculo):
    """Notificar al conductor cuando se le asigna un vehículo"""
    if not hasattr(conductor, 'usuario') or not conductor.usuario:
        return False
    
    return notificar_usuario(
        usuario=conductor.usuario,
        titulo='🚙 Vehículo Asignado',
        mensaje=f'Se te ha asignado el vehículo: {vehiculo.placa}',
        tipo='info',
        data={
            'vehiculo_id': vehiculo.id,
            'vehiculo_placa': vehiculo.placa,
            'conductor_id': conductor.id,
            'screen': 'mis_vehiculos',
            'action': 'view'
        }
    )


def notificar_licencia_por_vencer(conductor, dias_restantes):
    """Notificar al conductor sobre licencia próxima a vencer"""
    if not hasattr(conductor, 'usuario') or not conductor.usuario:
        return False
    
    return notificar_usuario(
        usuario=conductor.usuario,
        titulo='⚠️ Licencia Próxima a Vencer',
        mensaje=f'Tu licencia vence en {dias_restantes} días. Por favor, renovala.',
        tipo='alert',
        data={
            'conductor_id': conductor.id,
            'dias_restantes': dias_restantes,
            'fecha_vencimiento': str(conductor.fecha_venc_licencia),
            'screen': 'mi_licencia',
            'action': 'renovar'
        }
    )


def notificar_cambio_estado_personal(personal, nuevo_estado, cambiado_por):
    """Notificar al personal cuando cambia su estado"""
    if not hasattr(personal, 'usuario') or not personal.usuario:
        return False
    
    if nuevo_estado == 'activo':
        titulo = '✅ Cuenta Activada'
        mensaje = 'Tu cuenta ha sido activada. Ya puedes acceder al sistema.'
        tipo = 'info'
    else:
        titulo = '⚠️ Cuenta Desactivada'
        mensaje = 'Tu cuenta ha sido temporalmente desactivada. Contacta con RRHH.'
        tipo = 'alert'
    
    return notificar_usuario(
        usuario=personal.usuario,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        data={
            'personal_id': personal.id,
            'nuevo_estado': nuevo_estado,
            'cambiado_por': cambiado_por.username,
            'screen': 'profile'
        }
    )


def notificar_promocion_masiva(titulo, mensaje, descuento=None, producto_id=None):
    """Enviar promoción a todos los usuarios"""
    data = {
        'type': 'promo',
        'screen': 'productos',
        'action': 'view_promos'
    }
    
    if descuento:
        data['descuento'] = descuento
    if producto_id:
        data['producto_id'] = producto_id
    
    return notificar_topic(
        topic='all_users',
        titulo=titulo,
        mensaje=mensaje,
        tipo='promo',
        data=data
    )
