from .models import Bitacora
from django.utils.timezone import now

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    return request.META.get('HTTP_USER_AGENT', 'Desconocido')

def registrar_bitacora(request=None, usuario=None, accion="", descripcion="", modulo="GENERAL"):
    """
    Crea un registro en la bitácora.
    Puede recibir el request o directamente el usuario.
    """
    if request and usuario is None:
        usuario = getattr(request, 'user', None)

    ip = get_client_ip(request) if request else None
    user_agent = get_user_agent(request) if request else ""

    Bitacora.objects.create(
        usuario=usuario if usuario and usuario.is_authenticated else None,
        accion=accion,
        descripcion=descripcion,
        fecha_hora=now(),
        ip=ip,
        user_agent=user_agent,
        modulo=modulo
    )