"""
Utilidades para enviar notificaciones push desde cualquier módulo
"""

from .models import DeviceToken, Notification
from .firebase_config import send_multicast_notification, send_topic_notification
import logging

logger = logging.getLogger(__name__)


def _convert_data_to_strings(data):
    """
    Convierte todos los valores de un diccionario a strings.
    Firebase Cloud Messaging requiere que todos los valores en 'data' sean strings.

    Args:
        data: Diccionario con datos (puede contener valores de cualquier tipo)

    Returns:
        dict: Diccionario con todos los valores convertidos a strings
    """
    if not data:
        return {}

    result = {}
    for key, value in data.items():
        if value is None:
            result[key] = ""
        elif isinstance(value, (int, float, bool)):
            result[key] = str(value)
        elif isinstance(value, (list, dict)):
            # Para listas y diccionarios, convertir a string JSON
            import json

            result[key] = json.dumps(value)
        else:
            result[key] = str(value)

    return result


def notificar_usuario(usuario, titulo, mensaje, tipo="info", data=None):
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
        tokens = DeviceToken.objects.filter(user=usuario, is_active=True).values_list(
            "token", flat=True
        )

        if not tokens:
            logger.warning(f"Usuario {usuario.username} no tiene tokens registrados")
            return False

        # Crear registro de notificación (guardar data original, no strings)
        notification = Notification.objects.create(
            user=usuario, tipo=tipo, titulo=titulo, mensaje=mensaje, data=data or {}
        )

        # Enviar notificación push (convertir data a strings para Firebase)
        data_strings = _convert_data_to_strings(data or {})
        response = send_multicast_notification(
            list(tokens), titulo, mensaje, data_strings
        )

        if response and response.success_count > 0:
            notification.mark_as_sent(f"multicast_{response.success_count}")
            logger.info(f"Notificación enviada a {usuario.username}: {titulo}")
            return True
        else:
            notification.mark_as_failed("No se pudo enviar a ningún dispositivo")
            logger.error(f"Error enviando notificación a {usuario.username}")
            return False

    except Exception as e:
        logger.error(f"Excepción al notificar a {usuario.username}: {str(e)}")
        return False


def notificar_usuarios(usuarios, titulo, mensaje, tipo="info", data=None):
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
    resultados = {"enviados": 0, "fallidos": 0, "total": len(usuarios)}

    for usuario in usuarios:
        if notificar_usuario(usuario, titulo, mensaje, tipo, data):
            resultados["enviados"] += 1
        else:
            resultados["fallidos"] += 1

    logger.info(
        f"Notificación masiva: {resultados['enviados']} enviadas, {resultados['fallidos']} fallidas"
    )
    return resultados


def notificar_por_rol(rol_nombre, titulo, mensaje, tipo="info", data=None):
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
            grupos__nombre=rol_nombre, is_active=True
        ).distinct()

        if not usuarios.exists():
            logger.warning(f"No se encontraron usuarios con el rol {rol_nombre}")
            return {"enviados": 0, "fallidos": 0, "total": 0}

        return notificar_usuarios(usuarios, titulo, mensaje, tipo, data)

    except Exception as e:
        logger.error(f"Error al notificar por rol {rol_nombre}: {str(e)}")
        return {"enviados": 0, "fallidos": 1, "total": 1}


def notificar_topic(topic, titulo, mensaje, tipo="info", data=None):
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
            topic=topic, tipo=tipo, titulo=titulo, mensaje=mensaje, data=data or {}
        )

        # Enviar a topic (convertir data a strings para Firebase)
        data_strings = _convert_data_to_strings(data or {})
        message_id = send_topic_notification(topic, titulo, mensaje, data_strings)

        if message_id:
            notification.mark_as_sent(message_id)
            logger.info(f"Notificación enviada al topic {topic}: {titulo}")
            return True
        else:
            notification.mark_as_failed("Error al enviar a topic")
            logger.error(f"Error enviando notificación al topic {topic}")
            return False

    except Exception as e:
        logger.error(f"Excepción al notificar topic {topic}: {str(e)}")
        return False


def notificar_admins(titulo, mensaje, tipo="info", data=None):
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


def notificar_con_retry(
    usuario, titulo, mensaje, tipo="info", data=None, max_intentos=3
):
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
                logger.warning(
                    f"Reintento {intento + 1}/{max_intentos} para notificar a {usuario.username}"
                )

        except Exception as e:
            if intento == max_intentos - 1:
                logger.error(f"Error después de {max_intentos} intentos: {str(e)}")
                return False

    return False


# Funciones de conveniencia para eventos comunes
def notificar_nuevo_conductor(conductor, creado_por):
    """Notificar a admins cuando se crea un conductor"""
    return notificar_admins(
        titulo="🚗 Nuevo Conductor Registrado",
        mensaje=f"{conductor.nombre_completo} ha sido registrado en el sistema",
        tipo="info",
        data={
            "conductor_id": str(conductor.id),
            "conductor_nombre": conductor.nombre_completo,
            "creado_por": creado_por.username,
            "screen": "conductores",
            "action": "view_detail",
        },
    )


def notificar_asignacion_vehiculo(conductor, vehiculo):
    """Notificar al conductor cuando se le asigna un vehículo"""
    if not hasattr(conductor, "usuario") or not conductor.usuario:
        return False

    return notificar_usuario(
        usuario=conductor.usuario,
        titulo="🚙 Vehículo Asignado",
        mensaje=f"Se te ha asignado el vehículo: {vehiculo.placa}",
        tipo="info",
        data={
            "vehiculo_id": str(vehiculo.id),
            "vehiculo_placa": vehiculo.placa,
            "conductor_id": str(conductor.id),
            "screen": "mis_vehiculos",
            "action": "view",
        },
    )


def notificar_licencia_por_vencer(conductor, dias_restantes):
    """Notificar al conductor sobre licencia próxima a vencer"""
    if not hasattr(conductor, "usuario") or not conductor.usuario:
        return False

    return notificar_usuario(
        usuario=conductor.usuario,
        titulo="⚠️ Licencia Próxima a Vencer",
        mensaje=f"Tu licencia vence en {dias_restantes} días. Por favor, renovala.",
        tipo="alert",
        data={
            "conductor_id": str(conductor.id),
            "dias_restantes": str(dias_restantes),
            "fecha_vencimiento": str(conductor.fecha_venc_licencia),
            "screen": "mi_licencia",
            "action": "renovar",
        },
    )


def notificar_cambio_estado_personal(personal, nuevo_estado, cambiado_por):
    """Notificar al personal cuando cambia su estado"""
    if not hasattr(personal, "usuario") or not personal.usuario:
        return False

    if nuevo_estado == "activo":
        titulo = "✅ Cuenta Activada"
        mensaje = "Tu cuenta ha sido activada. Ya puedes acceder al sistema."
        tipo = "info"
    else:
        titulo = "⚠️ Cuenta Desactivada"
        mensaje = "Tu cuenta ha sido temporalmente desactivada. Contacta con RRHH."
        tipo = "alert"

    return notificar_usuario(
        usuario=personal.usuario,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        data={
            "personal_id": str(personal.id),
            "nuevo_estado": nuevo_estado,
            "cambiado_por": cambiado_por.username,
            "screen": "profile",
        },
    )


def notificar_promocion_masiva(titulo, mensaje, descuento=None, producto_id=None):
    """Enviar promoción a todos los usuarios"""
    data = {"type": "promo", "screen": "productos", "action": "view_promos"}

    if descuento:
        data["descuento"] = str(descuento)
    if producto_id:
        data["producto_id"] = str(producto_id)

    return notificar_topic(
        topic="all_users", titulo=titulo, mensaje=mensaje, tipo="promo", data=data
    )


# ========== FUNCIONES ESPECÍFICAS PARA ECOMMERCE/INVENTARIO ==========


def notificar_login_exitoso(usuario, dispositivo_info=None):
    """
    Notificar al usuario sobre login exitoso

    Args:
        usuario: Instancia del modelo User
        dispositivo_info: Dict con info del dispositivo (opcional)

    Returns:
        bool: True si se envió exitosamente
    """
    from django.utils import timezone

    dispositivo = (
        dispositivo_info.get("device", "dispositivo desconocido")
        if dispositivo_info
        else "dispositivo desconocido"
    )
    ubicacion = dispositivo_info.get("location", "") if dispositivo_info else ""

    mensaje = f"Inicio de sesión exitoso desde {dispositivo}"
    if ubicacion:
        mensaje += f" en {ubicacion}"
    mensaje += f" a las {timezone.now().strftime('%H:%M')}"

    return notificar_usuario(
        usuario=usuario,
        titulo="🔐 Inicio de Sesión",
        mensaje=mensaje,
        tipo="sistema",
        data={
            "screen": "home",
            "action": "login",
            "timestamp": str(timezone.now()),
            "device_info": str(dispositivo_info) if dispositivo_info else "",
        },
    )


def notificar_nuevo_pedido(pedido):
    """
    Notificar al cliente cuando se crea su pedido
    Notificar a admins sobre nuevo pedido

    Args:
        pedido: Instancia del modelo Pedido

    Returns:
        dict: Resultados del envío
    """
    resultados = {"cliente": False, "admins": {"enviados": 0, "fallidos": 0}}

    # Notificar al cliente
    if pedido.usuario:
        resultados["cliente"] = notificar_usuario(
            usuario=pedido.usuario,
            titulo="📦 Pedido Creado",
            mensaje=f"Tu pedido #{pedido.numero_pedido} ha sido creado exitosamente. Total: ${pedido.total}",
            tipo="pedido",
            data={
                "pedido_id": str(pedido.id),
                "numero_pedido": pedido.numero_pedido,
                "total": str(pedido.total),
                "screen": "pedidos",
                "action": "view_detail",
            },
        )

    # Notificar a administradores
    resultados["admins"] = notificar_admins(
        titulo="🛒 Nuevo Pedido",
        mensaje=f"Nuevo pedido #{pedido.numero_pedido} por ${pedido.total} de {pedido.usuario.get_full_name() or pedido.usuario.email}",
        tipo="pedido",
        data={
            "pedido_id": str(pedido.id),
            "numero_pedido": pedido.numero_pedido,
            "usuario_id": str(pedido.usuario.id),
            "total": str(pedido.total),
            "screen": "admin_pedidos",
            "action": "view_detail",
        },
    )

    return resultados


def notificar_cambio_estado_pedido(pedido, estado_anterior, estado_nuevo):
    """
    Notificar al cliente cuando cambia el estado de su pedido

    Args:
        pedido: Instancia del modelo Pedido
        estado_anterior: Estado anterior del pedido
        estado_nuevo: Nuevo estado del pedido

    Returns:
        bool: True si se envió exitosamente
    """
    if not pedido.usuario:
        return False

    # Mapeo de estados a mensajes
    mensajes_estado = {
        "PAGADO": {
            "titulo": "✅ Pago Confirmado",
            "mensaje": f"Tu pedido #{pedido.numero_pedido} ha sido pagado exitosamente. Preparándolo para envío...",
        },
        "PROCESANDO": {
            "titulo": "🔄 Pedido en Proceso",
            "mensaje": f"Tu pedido #{pedido.numero_pedido} está siendo procesado",
        },
        "ENVIADO": {
            "titulo": "🚚 Pedido Enviado",
            "mensaje": f"Tu pedido #{pedido.numero_pedido} ha sido enviado. ¡Estará pronto en tu domicilio!",
        },
        "ENTREGADO": {
            "titulo": "🎉 Pedido Entregado",
            "mensaje": f"¡Tu pedido #{pedido.numero_pedido} ha sido entregado! Gracias por tu compra.",
        },
        "CANCELADO": {
            "titulo": "❌ Pedido Cancelado",
            "mensaje": f"Tu pedido #{pedido.numero_pedido} ha sido cancelado",
        },
        "REEMBOLSADO": {
            "titulo": "💰 Reembolso Procesado",
            "mensaje": f"El reembolso de tu pedido #{pedido.numero_pedido} ha sido procesado",
        },
    }

    if estado_nuevo not in mensajes_estado:
        return False

    info = mensajes_estado[estado_nuevo]
    tipo = "alerta" if estado_nuevo in ["CANCELADO", "REEMBOLSADO"] else "pedido"

    return notificar_usuario(
        usuario=pedido.usuario,
        titulo=info["titulo"],
        mensaje=info["mensaje"],
        tipo=tipo,
        data={
            "pedido_id": str(pedido.id),
            "numero_pedido": pedido.numero_pedido,
            "estado_anterior": estado_anterior,
            "estado_nuevo": estado_nuevo,
            "screen": "pedidos",
            "action": "view_detail",
        },
    )


def notificar_pago_exitoso(transaccion):
    """
    Notificar al cliente cuando su pago es confirmado

    Args:
        transaccion: Instancia del modelo TransaccionPago

    Returns:
        bool: True si se envió exitosamente
    """
    if not transaccion.pedido.usuario:
        return False

    return notificar_usuario(
        usuario=transaccion.pedido.usuario,
        titulo="💳 Pago Confirmado",
        mensaje=f"Tu pago de ${transaccion.monto} para el pedido #{transaccion.pedido.numero_pedido} ha sido confirmado",
        tipo="pedido",
        data={
            "transaccion_id": str(transaccion.id),
            "pedido_id": str(transaccion.pedido.id),
            "numero_pedido": transaccion.pedido.numero_pedido,
            "monto": str(transaccion.monto),
            "screen": "pedidos",
            "action": "view_detail",
        },
    )


def notificar_pago_fallido(transaccion, error_mensaje=None):
    """
    Notificar al cliente cuando su pago falla

    Args:
        transaccion: Instancia del modelo TransaccionPago
        error_mensaje: Mensaje de error (opcional)

    Returns:
        bool: True si se envió exitosamente
    """
    if not transaccion.pedido.usuario:
        return False

    mensaje = f"Tu pago de ${transaccion.monto} para el pedido #{transaccion.pedido.numero_pedido} no pudo ser procesado"
    if error_mensaje:
        mensaje += f". Error: {error_mensaje}"

    return notificar_usuario(
        usuario=transaccion.pedido.usuario,
        titulo="⚠️ Pago Fallido",
        mensaje=mensaje,
        tipo="alerta",
        data={
            "transaccion_id": str(transaccion.id),
            "pedido_id": str(transaccion.pedido.id),
            "numero_pedido": transaccion.pedido.numero_pedido,
            "monto": str(transaccion.monto),
            "error": error_mensaje or "Error desconocido",
            "screen": "checkout",
            "action": "retry_payment",
        },
    )


def notificar_producto_bajo_stock(producto, stock_actual):
    """
    Notificar a administradores sobre producto con bajo stock

    Args:
        producto: Instancia del modelo Producto
        stock_actual: Stock actual del producto

    Returns:
        dict: Resultado del envío a admins
    """
    return notificar_admins(
        titulo="⚠️ Stock Bajo",
        mensaje=f'El producto "{producto.nombre}" tiene bajo stock: {stock_actual} unidades (mínimo: {producto.stock_minimo})',
        tipo="alerta",
        data={
            "producto_id": str(producto.id),
            "producto_nombre": producto.nombre,
            "stock_actual": str(stock_actual),
            "stock_minimo": str(producto.stock_minimo),
            "categoria_id": str(producto.categoria.id) if producto.categoria else "",
            "screen": "admin_productos",
            "action": "view_detail",
        },
    )


def notificar_producto_sin_stock(producto):
    """
    Notificar a administradores sobre producto sin stock

    Args:
        producto: Instancia del modelo Producto

    Returns:
        dict: Resultado del envío a admins
    """
    return notificar_admins(
        titulo="🚨 Producto Sin Stock",
        mensaje=f'El producto "{producto.nombre}" se ha quedado sin stock',
        tipo="alerta",
        data={
            "producto_id": str(producto.id),
            "producto_nombre": producto.nombre,
            "categoria_id": str(producto.categoria.id) if producto.categoria else "",
            "screen": "admin_productos",
            "action": "view_detail",
        },
    )


def notificar_nuevo_producto(producto, creado_por):
    """
    Notificar a clientes sobre nuevo producto disponible

    Args:
        producto: Instancia del modelo Producto
        creado_por: Usuario que creó el producto

    Returns:
        bool: True si se envió exitosamente
    """
    # Solo notificar si el producto está activo
    if not producto.activo:
        return False

    titulo = "🆕 Nuevo Producto"
    if producto.en_oferta:
        titulo = "🎉 ¡Nueva Oferta!"
        mensaje = f"{producto.nombre} ahora disponible con {producto.descuento_porcentaje}% de descuento"
    else:
        mensaje = f"¡Nuevo producto disponible: {producto.nombre}!"

    data = {
        "producto_id": str(producto.id),
        "producto_nombre": producto.nombre,
        "slug": producto.slug,
        "screen": "productos",
        "action": "view_detail",
    }

    # Si hay categoría, suscribir a ese topic
    if producto.categoria:
        topic = f"categoria_{producto.categoria.slug}"
        return notificar_topic(
            topic=topic,
            titulo=titulo,
            mensaje=mensaje,
            tipo="promo" if producto.en_oferta else "info",
            data=data,
        )
    else:
        # Notificar a todos los usuarios
        return notificar_topic(
            topic="all_users",
            titulo=titulo,
            mensaje=mensaje,
            tipo="promo" if producto.en_oferta else "info",
            data=data,
        )


def notificar_stock_restaurado(producto, stock_anterior, stock_nuevo):
    """
    Notificar a clientes cuando se restaura stock de un producto que estaba agotado

    Args:
        producto: Instancia del modelo Producto
        stock_anterior: Stock anterior
        stock_nuevo: Stock nuevo

    Returns:
        bool: True si se envió exitosamente
    """
    # Solo notificar si pasó de 0 a mayor que 0
    if stock_anterior > 0 or stock_nuevo <= 0:
        return False

    if not producto.activo:
        return False

    return notificar_topic(
        topic="all_users",
        titulo="✅ Producto Disponible",
        mensaje=f"¡{producto.nombre} está nuevamente disponible!",
        tipo="info",
        data={
            "producto_id": str(producto.id),
            "producto_nombre": producto.nombre,
            "slug": producto.slug,
            "stock_nuevo": str(stock_nuevo),
            "screen": "productos",
            "action": "view_detail",
        },
    )
