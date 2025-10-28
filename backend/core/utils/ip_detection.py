"""
Utilidad para detectar automáticamente la IP pública o dirección del servidor.
Especialmente útil para despliegues en AWS EC2 u otros entornos cloud.
"""
import os
import json
import socket
import urllib.request
import urllib.error
import logging

logger = logging.getLogger(__name__)


def get_public_ip():
    """
    Detecta la IP pública del servidor.
    Útil para despliegues en AWS EC2 y otros proveedores cloud.
    
    Returns:
        str: IP pública detectada o None si no se puede detectar
    """
    # Métodos para obtener IP pública, en orden de prioridad
    ip_detection_methods = [
        _get_aws_instance_ip,       # AWS EC2 Metadata (más rápido para AWS)
        _get_ip_from_external_api,   # APIs externas (fallback)
        _get_local_ip                # IP local (último recurso)
    ]
    
    # Intentar cada método hasta que uno funcione
    for method in ip_detection_methods:
        try:
            ip = method()
            if ip:
                logger.info(f"📡 IP detectada por {method.__name__}: {ip}")
                return ip
        except Exception as e:
            logger.debug(f"Error al detectar IP con {method.__name__}: {e}")
    
    # Si ninguno funciona, devolver None
    logger.warning("❌ No se pudo detectar la IP pública. Usar configuración manual.")
    return None


def _get_aws_instance_ip():
    """
    Obtiene la IP pública de la instancia EC2 desde los metadatos de AWS.
    Este método es mucho más rápido y confiable cuando se ejecuta en EC2.
    
    Returns:
        str: IP pública de la instancia EC2 o None si no se puede obtener
    """
    try:
        # Tiempo límite corto para no bloquear si no estamos en EC2
        req = urllib.request.Request(
            "http://169.254.169.254/latest/meta-data/public-ipv4",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=1) as response:
            return response.read().decode('utf-8').strip()
    except (urllib.error.URLError, socket.timeout):
        # No estamos en AWS o no tenemos acceso a los metadatos
        return None


def _get_ip_from_external_api():
    """
    Obtiene la IP pública consultando un servicio externo.
    
    Returns:
        str: IP pública detectada o None si no se puede obtener
    """
    # Lista de servicios para obtener IP, probando cada uno hasta que funcione
    ip_services = [
        "https://api.ipify.org?format=json",      # Servicio popular y confiable
        "https://ifconfig.me/ip",                 # Alternativa simple
        "https://icanhazip.com",                  # Otra alternativa
    ]
    
    for service in ip_services:
        try:
            req = urllib.request.Request(
                service,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=3) as response:
                content = response.read().decode('utf-8').strip()
                # Algunos servicios devuelven JSON, otros solo la IP
                if '{' in content:
                    return json.loads(content)["ip"]
                else:
                    return content
        except Exception:
            continue
    
    return None


def _get_local_ip():
    """
    Intenta obtener una IP local que podría ser accesible en la red.
    Este método es una última opción y puede no ser accesible desde internet.
    
    Returns:
        str: Dirección IP local o None
    """
    try:
        # Crear una conexión a un servidor externo para determinar interfaz
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        # Si falla, intentar con hostname
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return None


def get_hostname():
    """
    Obtiene el nombre de host de la máquina
    
    Returns:
        str: Hostname de la máquina
    """
    return socket.gethostname()


def get_server_url(port=8000, use_ssl=False):
    """
    Construye la URL del servidor basada en la IP detectada
    
    Args:
        port (int): Puerto del servidor
        use_ssl (bool): Si debe usar https en lugar de http
    
    Returns:
        str: URL completa del servidor
    """
    protocol = "https" if use_ssl else "http"
    ip = get_public_ip() or "localhost"
    return f"{protocol}://{ip}:{port}"


if __name__ == "__main__":
    # Configuración de logging para pruebas
    logging.basicConfig(level=logging.INFO)
    
    # Si se ejecuta directamente, mostrar la IP
    detected_ip = get_public_ip()
    hostname = get_hostname()
    server_url = get_server_url()
    
    print(f"🖥️ Hostname: {hostname}")
    print(f"🔍 Dirección IP detectada: {detected_ip}")
    print(f"🌐 URL del servidor: {server_url}")