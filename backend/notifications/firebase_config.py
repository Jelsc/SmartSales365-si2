"""
Configuración de Firebase Admin SDK para el backend
Maneja la inicialización y conexión con Firebase Cloud Messaging
"""
import os
from django.conf import settings

# Intentar importar firebase_admin (opcional)
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print('⚠️ firebase-admin no está instalado. Las notificaciones push no estarán disponibles.')
    print('   Instala con: pip install firebase-admin>=6.0.0')

# Variable global para evitar múltiples inicializaciones
_firebase_initialized = False


def initialize_firebase():
    """
    Inicializa Firebase Admin SDK con las credenciales del proyecto
    Se ejecuta automáticamente cuando Django inicia
    """
    global _firebase_initialized
    
    if not FIREBASE_AVAILABLE:
        print('⚠️ Firebase Admin SDK no está disponible')
        return
    
    if _firebase_initialized:
        print('✅ Firebase ya está inicializado')
        return
    
    try:
        # Ruta al archivo de credenciales
        cred_path = os.path.join(settings.BASE_DIR, 'firebase-credentials.json')
        
        if not os.path.exists(cred_path):
            print(f'⚠️ Archivo de credenciales no encontrado: {cred_path}')
            print('   Las notificaciones push no estarán disponibles')
            return
        
        # Inicializar con credenciales
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        
        _firebase_initialized = True
        print('✅ Firebase Admin SDK inicializado correctamente')
        print(f'   Proyecto: {cred.project_id}')
        
    except Exception as e:
        print(f'❌ Error inicializando Firebase: {e}')
        print('   Las notificaciones push no estarán disponibles')


def send_push_notification(token, title, body, data=None):
    """
    Envía una notificación push a un dispositivo específico
    
    Args:
        token (str): Token FCM del dispositivo
        title (str): Título de la notificación
        body (str): Cuerpo del mensaje
        data (dict, optional): Datos adicionales

    Returns:
        str: Message ID si fue exitoso, None si falló
    """
    if not FIREBASE_AVAILABLE or not _firebase_initialized:
        print('❌ Firebase no está disponible o no está inicializado')
        return None
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='@mipmap/ic_launcher',
                    color='#2196F3',  # Azul de SmartSales365
                    sound='default',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        response = messaging.send(message)
        print(f'✅ Notificación enviada exitosamente: {response}')
        return response
        
    except Exception as e:
        print(f'❌ Error enviando notificación: {e}')
        return None


def send_multicast_notification(tokens, title, body, data=None):
    """
    Envía una notificación push a múltiples dispositivos
    
    Args:
        tokens (list): Lista de tokens FCM
        title (str): Título de la notificación
        body (str): Cuerpo del mensaje
        data (dict, optional): Datos adicionales

    Returns:
        BatchResponse: Respuesta del envío masivo
    """
    if not FIREBASE_AVAILABLE or not _firebase_initialized:
        print('❌ Firebase no está disponible o no está inicializado')
        return None
    
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='@mipmap/ic_launcher',
                    color='#2196F3',
                    sound='default',
                ),
            ),
        )
        
        response = messaging.send_multicast(message)
        print(f'✅ Notificaciones enviadas: {response.success_count}/{len(tokens)}')
        
        if response.failure_count > 0:
            print(f'⚠️ Fallaron {response.failure_count} notificaciones')
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    print(f'   Token {idx}: {resp.exception}')
        
        return response
        
    except Exception as e:
        print(f'❌ Error enviando notificaciones multicast: {e}')
        return None


def send_topic_notification(topic, title, body, data=None):
    """
    Envía una notificación a un topic (tema) específico
    Útil para enviar a grupos de usuarios
    
    Args:
        topic (str): Nombre del topic
        title (str): Título de la notificación
        body (str): Cuerpo del mensaje
        data (dict, optional): Datos adicionales

    Returns:
        str: Message ID si fue exitoso, None si falló
    """
    if not FIREBASE_AVAILABLE or not _firebase_initialized:
        print('❌ Firebase no está disponible o no está inicializado')
        return None
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            topic=topic,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='@mipmap/ic_launcher',
                    color='#2196F3',
                    sound='default',
                ),
            ),
        )
        
        response = messaging.send(message)
        print(f'✅ Notificación enviada al topic "{topic}": {response}')
        return response
        
    except Exception as e:
        print(f'❌ Error enviando notificación al topic: {e}')
        return None


def subscribe_to_topic(tokens, topic):
    """
    Suscribe dispositivos a un topic
    
    Args:
        tokens (list): Lista de tokens FCM
        topic (str): Nombre del topic

    Returns:
        TopicManagementResponse: Respuesta de la suscripción
    """
    if not FIREBASE_AVAILABLE or not _firebase_initialized:
        print('❌ Firebase no está disponible o no está inicializado')
        return None
    
    try:
        response = messaging.subscribe_to_topic(tokens, topic)
        print(f'✅ {response.success_count} dispositivos suscritos al topic "{topic}"')
        
        if response.failure_count > 0:
            print(f'⚠️ Fallaron {response.failure_count} suscripciones')
        
        return response
        
    except Exception as e:
        print(f'❌ Error suscribiendo al topic: {e}')
        return None


def unsubscribe_from_topic(tokens, topic):
    """
    Desuscribe dispositivos de un topic
    
    Args:
        tokens (list): Lista de tokens FCM
        topic (str): Nombre del topic

    Returns:
        TopicManagementResponse: Respuesta de la desuscripción
    """
    if not FIREBASE_AVAILABLE or not _firebase_initialized:
        print('❌ Firebase no está disponible o no está inicializado')
        return None
    
    try:
        response = messaging.unsubscribe_from_topic(tokens, topic)
        print(f'✅ {response.success_count} dispositivos desuscritos del topic "{topic}"')
        
        if response.failure_count > 0:
            print(f'⚠️ Fallaron {response.failure_count} desuscripciones')
        
        return response
        
    except Exception as e:
        print(f'❌ Error desuscribiendo del topic: {e}')
        return None
