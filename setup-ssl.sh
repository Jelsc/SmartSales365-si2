#!/bin/bash

# Script para configurar HTTPS con Let's Encrypt en Azure
# Ejecutar en el servidor: sudo bash setup-ssl.sh tu-dominio.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Debes proporcionar un dominio"
    echo "Uso: sudo bash setup-ssl.sh tu-dominio.com"
    echo ""
    echo "Ejemplos:"
    echo "  sudo bash setup-ssl.sh smartsales365.duckdns.org"
    echo "  sudo bash setup-ssl.sh smartsales365.tk"
    echo "  sudo bash setup-ssl.sh smartsales365.com"
    exit 1
fi

echo "🔒 Configurando SSL para: $DOMAIN"
echo ""

# 1. Verificar que estamos corriendo como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Error: Este script debe ejecutarse como root (con sudo)"
    exit 1
fi

# 2. Instalar dependencias necesarias
echo "📦 Verificando dependencias..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "Instala Docker primero: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    apt-get update
    apt-get install -y certbot
fi

# 3. Verificar DNS antes de continuar
echo "🔍 Verificando configuración DNS..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ -z "$DOMAIN_IP" ]; then
    echo "❌ Error: No se pudo resolver el dominio $DOMAIN"
    echo "Verifica que el DNS esté configurado correctamente"
    exit 1
fi

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Advertencia: El dominio no apunta a este servidor"
    echo "   IP del servidor: $SERVER_IP"
    echo "   IP del dominio:  $DOMAIN_IP"
    echo ""
    read -p "¿Continuar de todos modos? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# 4. Actualizar nginx.conf con el dominio correcto
echo "📝 Actualizando configuración de Nginx..."
sed -i "s/tu-dominio.com/$DOMAIN/g" nginx.conf

# 5. Detener contenedores si están corriendo
echo "⏸️  Deteniendo contenedores..."
docker compose down

# 6. Obtener certificado SSL
echo "🔐 Obteniendo certificado SSL de Let's Encrypt..."
certbot certonly --standalone \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email admin@$DOMAIN \
    --http-01-port 80

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtenido exitosamente"
    
    # 7. Configurar variables de entorno para producción
    echo "⚙️  Configurando variables de entorno..."
    
    # Backend
    if [ -f "backend/.env" ]; then
        sed -i "s/DEBUG=True/DEBUG=False/g" backend/.env
        if ! grep -q "ALLOWED_HOSTS" backend/.env; then
            echo "ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN" >> backend/.env
        fi
        if ! grep -q "CSRF_TRUSTED_ORIGINS" backend/.env; then
            echo "CSRF_TRUSTED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> backend/.env
        fi
        if ! grep -q "CORS_ALLOWED_ORIGINS" backend/.env; then
            echo "CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> backend/.env
        fi
    fi
    
    # 8. Construir y levantar contenedores con SSL
    echo "🚀 Construyendo y levantando contenedores con HTTPS..."
    docker compose up -d --build
    
    # 9. Configurar renovación automática
    echo "🔄 Configurando renovación automática..."
    CRON_JOB="0 3 * * * certbot renew --post-hook 'cd $(pwd) && docker compose restart nginx' >> /var/log/certbot-renew.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
    
    # 10. Esperar a que los contenedores inicien
    echo "⏳ Esperando a que los servicios inicien..."
    sleep 10
    
    # 11. Verificar estado de contenedores
    echo ""
    echo "📊 Estado de los contenedores:"
    docker compose ps
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ ¡Configuración completada exitosamente!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "   → Frontend (PWA): https://$DOMAIN"
    echo "   → Admin Django:   https://$DOMAIN/admin/"
    echo "   → API:            https://$DOMAIN/api/"
    echo ""
    echo "📱 Instalación de PWA:"
    echo "   1. Abre https://$DOMAIN en tu navegador"
    echo "   2. Busca el ícono de instalación (⊕) en la barra de direcciones"
    echo "   3. Haz clic en 'Instalar SmartSales365'"
    echo ""
    echo "📝 Información importante:"
    echo "   ✅ Certificado SSL válido por 90 días"
    echo "   ✅ Renovación automática configurada (cada día a las 3 AM)"
    echo "   ✅ Logs de renovación: /var/log/certbot-renew.log"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   Ver logs:          docker compose logs -f"
    echo "   Reiniciar:         docker compose restart"
    echo "   Detener:           docker compose down"
    echo "   Estado:            docker compose ps"
    echo "   Renovar SSL:       certbot renew"
    echo ""
    
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Error al obtener el certificado SSL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   1. El dominio $DOMAIN no apunta a este servidor"
    echo "      → IP del servidor: $SERVER_IP"
    echo "      → Verifica en: https://www.whatsmydns.net"
    echo ""
    echo "   2. Los puertos 80 y 443 no están abiertos"
    echo "      → Azure Portal → VM → Redes → Reglas de entrada"
    echo "      → Agregar: Puerto 80 (HTTP) y Puerto 443 (HTTPS)"
    echo ""
    echo "   3. Ya existe un certificado para este dominio"
    echo "      → Ejecuta: certbot certificates"
    echo ""
    echo "   4. Límite de intentos alcanzado (5 por hora)"
    echo "      → Espera 1 hora antes de reintentar"
    echo ""
    exit 1
fi
