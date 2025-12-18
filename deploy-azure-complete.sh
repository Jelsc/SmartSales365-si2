#!/bin/bash

# ============================================================================
# 🚀 SCRIPT DE DESPLIEGUE AUTOMÁTICO EN AZURE CON DUCKDNS
# ============================================================================
# SmartSales365 - Despliegue completo con SSL usando Let's Encrypt y DuckDNS
# Soporta tanto HTTP challenge como DNS challenge
# ============================================================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${MAGENTA}🔹 $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================================================
# PASO 1: OBTENER INFORMACIÓN DEL USUARIO
# ============================================================================

print_header "🦆 CONFIGURACIÓN DE DUCKDNS"

read -p "Ingresa tu subdominio de DuckDNS (sin .duckdns.org): " SUBDOMAIN
if [ -z "$SUBDOMAIN" ]; then
    print_error "El subdominio no puede estar vacío"
    exit 1
fi

DOMAIN="${SUBDOMAIN}.duckdns.org"
print_info "Dominio completo: $DOMAIN"

read -p "Ingresa tu TOKEN de DuckDNS: " DUCKDNS_TOKEN
if [ -z "$DUCKDNS_TOKEN" ]; then
    print_error "El token de DuckDNS no puede estar vacío"
    exit 1
fi

# Preguntar método de validación
echo ""
print_info "Método de validación SSL:"
echo "  1) HTTP Challenge (requiere puertos 80/443 abiertos)"
echo "  2) DNS Challenge (más confiable para DuckDNS)"
read -p "Selecciona método (1 o 2) [2]: " SSL_METHOD
SSL_METHOD=${SSL_METHOD:-2}

# ============================================================================
# PASO 2: VERIFICAR REQUISITOS
# ============================================================================

print_header "📦 VERIFICANDO REQUISITOS"

# Verificar que estamos corriendo como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root (con sudo)"
    exit 1
fi
print_success "Ejecutando como root"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker no está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    print_success "Docker instalado"
else
    print_success "Docker ya está instalado"
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose no está instalado. Instalando..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado"
else
    print_success "Docker Compose ya está instalado"
fi

# Verificar Certbot
if ! command -v certbot &> /dev/null; then
    print_warning "Certbot no está instalado. Instalando..."
    apt-get update -qq
    apt-get install -y certbot python3-pip
    print_success "Certbot instalado"
else
    print_success "Certbot ya está instalado"
fi

# Si se eligió DNS challenge, instalar plugin
if [ "$SSL_METHOD" == "2" ]; then
    print_step "Verificando plugin certbot-dns-duckdns..."
    if ! python3 -c "import certbot_dns_duckdns" 2>/dev/null; then
        print_warning "Plugin certbot-dns-duckdns no está instalado. Instalando..."
        pip3 install certbot-dns-duckdns
        print_success "Plugin instalado"
    else
        print_success "Plugin certbot-dns-duckdns ya está instalado"
    fi
fi

# ============================================================================
# PASO 3: CONFIGURAR FIREWALL
# ============================================================================

print_header "🛡️  CONFIGURANDO FIREWALL"

# Configurar UFW si está instalado
if command -v ufw &> /dev/null; then
    print_step "Configurando UFW..."
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    print_success "Puertos 22, 80 y 443 permitidos en UFW"
else
    print_info "UFW no está instalado (no es crítico)"
fi

# ============================================================================
# PASO 4: ACTUALIZAR DUCKDNS CON IP ACTUAL
# ============================================================================

print_header "🔗 ACTUALIZANDO DUCKDNS"

print_step "Obteniendo IP pública..."
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipecho.net/plain)
if [ -z "$SERVER_IP" ]; then
    print_error "No se pudo obtener la IP pública del servidor"
    exit 1
fi
print_success "IP del servidor: $SERVER_IP"

print_step "Actualizando DuckDNS..."
UPDATE_RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=$SUBDOMAIN&token=$DUCKDNS_TOKEN&ip=$SERVER_IP")

if [ "$UPDATE_RESPONSE" == "OK" ]; then
    print_success "DuckDNS actualizado correctamente"
else
    print_error "Error al actualizar DuckDNS: $UPDATE_RESPONSE"
    exit 1
fi

# Esperar propagación DNS
print_info "Esperando propagación DNS (30 segundos)..."
sleep 30

# Verificar DNS
print_step "Verificando configuración DNS..."
DOMAIN_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -n1)

if [ -z "$DOMAIN_IP" ]; then
    print_warning "No se pudo resolver el dominio $DOMAIN todavía"
    print_info "Puede que necesites esperar más tiempo para la propagación DNS"
elif [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    print_warning "El dominio apunta a $DOMAIN_IP pero tu servidor es $SERVER_IP"
    print_info "Esto puede deberse a propagación DNS lenta"
else
    print_success "DNS configurado correctamente: $DOMAIN → $SERVER_IP"
fi

# ============================================================================
# PASO 5: CONFIGURAR ACTUALIZACIÓN AUTOMÁTICA DE DUCKDNS
# ============================================================================

print_header "🔄 CONFIGURANDO ACTUALIZACIÓN AUTOMÁTICA DE DUCKDNS"

# Crear script de actualización
cat > /root/duckdns-update.sh << EOF
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=$SUBDOMAIN&token=$DUCKDNS_TOKEN&ip=" >/dev/null 2>&1
EOF

chmod +x /root/duckdns-update.sh

# Agregar a crontab (cada 5 minutos)
CRON_CMD="*/5 * * * * /root/duckdns-update.sh"
(crontab -l 2>/dev/null | grep -v "duckdns-update.sh"; echo "$CRON_CMD") | crontab -

print_success "Actualización automática configurada (cada 5 minutos)"

# ============================================================================
# PASO 6: CONFIGURAR VARIABLES DE ENTORNO
# ============================================================================

print_header "⚙️  CONFIGURANDO VARIABLES DE ENTORNO"

# Backup de archivos .env si existen
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backup de backend/.env creado"
fi

if [ -f "frontend/.env" ]; then
    cp frontend/.env frontend/.env.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backup de frontend/.env creado"
fi

# Configurar backend/.env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
fi

# Actualizar dominio en backend/.env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" backend/.env
sed -i "s|FRONTEND_URL_ALT=.*|FRONTEND_URL_ALT=https://$DOMAIN|g" backend/.env
sed -i "s|DJANGO_DEBUG=1|DJANGO_DEBUG=0|g" backend/.env
sed -i "s|DEBUG=True|DEBUG=False|g" backend/.env
sed -i "s|DJANGO_ALLOWED_HOSTS=.*|DJANGO_ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1|g" backend/.env
sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1|g" backend/.env

# Agregar si no existen
grep -q "CSRF_TRUSTED_ORIGINS" backend/.env || echo "CSRF_TRUSTED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> backend/.env
grep -q "CORS_ALLOWED_ORIGINS" backend/.env || echo "CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> backend/.env

print_success "Backend configurado para: https://$DOMAIN"

# Configurar frontend/.env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
fi

sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN|g" frontend/.env

print_success "Frontend configurado para: https://$DOMAIN"

# ============================================================================
# PASO 7: ACTUALIZAR NGINX.CONF
# ============================================================================

print_header "📝 ACTUALIZANDO CONFIGURACIÓN DE NGINX"

# Backup de nginx.conf
if [ -f "nginx.conf" ]; then
    cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Actualizar nginx.conf con el dominio correcto
sed -i "s/tu-dominio.com/$DOMAIN/g" nginx.conf
sed -i "s/server_name .*;/server_name $DOMAIN www.$DOMAIN;/g" nginx.conf

print_success "Nginx configurado para: $DOMAIN"

# ============================================================================
# PASO 8: DETENER CONTENEDORES SI ESTÁN CORRIENDO
# ============================================================================

print_header "⏸️  DETENIENDO CONTENEDORES EXISTENTES"

if docker compose ps 2>/dev/null | grep -q "Up"; then
    docker compose down
    print_success "Contenedores detenidos"
else
    print_info "No hay contenedores corriendo"
fi

# Liberar puertos si están ocupados
print_step "Liberando puertos 80 y 443..."
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true

# ============================================================================
# PASO 9: OBTENER CERTIFICADO SSL
# ============================================================================

print_header "🔐 OBTENIENDO CERTIFICADO SSL DE LET'S ENCRYPT"

# Verificar si ya existe un certificado
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "Ya existe un certificado para $DOMAIN"
    read -p "¿Renovar certificado existente? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        certbot renew --force-renewal
        print_success "Certificado renovado"
    else
        print_info "Usando certificado existente"
    fi
else
    print_step "Obteniendo nuevo certificado..."
    
    if [ "$SSL_METHOD" == "2" ]; then
        # DNS Challenge (más confiable para DuckDNS)
        print_info "Usando DNS Challenge..."
        
        # Crear archivo de credenciales
        mkdir -p /root/.secrets
        echo "dns_duckdns_token=$DUCKDNS_TOKEN" > /root/.secrets/duckdns.ini
        chmod 600 /root/.secrets/duckdns.ini
        
        certbot certonly \
            --authenticator dns-duckdns \
            --dns-duckdns-credentials /root/.secrets/duckdns.ini \
            --dns-duckdns-propagation-seconds 60 \
            -d $DOMAIN \
            --non-interactive \
            --agree-tos \
            --email admin@$DOMAIN
        
        CERTBOT_EXIT=$?
    else
        # HTTP Challenge (requiere puertos abiertos)
        print_info "Usando HTTP Challenge..."
        
        certbot certonly --standalone \
            -d $DOMAIN \
            --non-interactive \
            --agree-tos \
            --email admin@$DOMAIN \
            --http-01-port 80 \
            --preferred-challenges http
        
        CERTBOT_EXIT=$?
    fi
    
    if [ $CERTBOT_EXIT -eq 0 ]; then
        print_success "Certificado SSL obtenido exitosamente"
    else
        print_error "Error al obtener el certificado SSL"
        echo ""
        print_info "Posibles soluciones:"
        
        if [ "$SSL_METHOD" == "1" ]; then
            echo "  1. Verifica que los puertos 80 y 443 estén abiertos en Azure Portal"
            echo "  2. Verifica que no haya firewall bloqueando el tráfico"
            echo "  3. Intenta con DNS Challenge ejecutando: SSL_METHOD=2"
        else
            echo "  1. Verifica que el token de DuckDNS sea correcto"
            echo "  2. Verifica que el DNS apunte correctamente al servidor"
            echo "  3. Espera más tiempo para la propagación DNS"
        fi
        
        echo ""
        print_warning "Puedes intentar nuevamente en unos minutos"
        exit 1
    fi
fi

# Verificar que los archivos de certificado existan
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_error "No se encontró el certificado en /etc/letsencrypt/live/$DOMAIN/"
    exit 1
fi

# ============================================================================
# PASO 10: CONFIGURAR RENOVACIÓN AUTOMÁTICA DE SSL
# ============================================================================

print_header "🔄 CONFIGURANDO RENOVACIÓN AUTOMÁTICA DE SSL"

CRON_JOB="0 3 * * * certbot renew --post-hook 'cd $(pwd) && docker compose restart nginx' >> /var/log/certbot-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

print_success "Renovación automática configurada (diaria a las 3 AM)"

# ============================================================================
# PASO 11: LEVANTAR CONTENEDORES CON SSL
# ============================================================================

print_header "🚀 LEVANTANDO CONTENEDORES CON HTTPS"

docker compose up -d --build

if [ $? -eq 0 ]; then
    print_success "Contenedores levantados correctamente"
else
    print_error "Error al levantar los contenedores"
    docker compose logs
    exit 1
fi

# Esperar a que los servicios inicien
print_info "Esperando a que los servicios inicien (30 segundos)..."
sleep 30

# ============================================================================
# PASO 12: VERIFICAR ESTADO
# ============================================================================

print_header "📊 ESTADO DE LOS CONTENEDORES"

docker compose ps

echo ""
print_step "Verificando acceso a la aplicación..."
if curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
    print_success "Aplicación accesible en https://$DOMAIN"
else
    print_warning "La aplicación podría tardar unos minutos en estar lista"
fi

# ============================================================================
# PASO 13: RESUMEN FINAL
# ============================================================================

print_header "✅ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!"

echo ""
echo -e "${GREEN}🌐 Tu aplicación está disponible en:${NC}"
echo -e "   ${BLUE}→ Frontend (PWA):${NC} https://$DOMAIN"
echo -e "   ${BLUE}→ Admin Django:${NC}   https://$DOMAIN/admin/"
echo -e "   ${BLUE}→ API REST:${NC}       https://$DOMAIN/api/"
echo -e "   ${BLUE}→ MailHog:${NC}        http://$SERVER_IP:8025"
echo ""

echo -e "${YELLOW}📱 Para instalar la PWA:${NC}"
echo "   1. Abre https://$DOMAIN en tu navegador"
echo "   2. Busca el ícono de instalación (⊕) en la barra de direcciones"
echo "   3. Haz clic en 'Instalar SmartSales365'"
echo ""

echo -e "${YELLOW}🎤 Características habilitadas:${NC}"
echo "   ✅ Reconocimiento de voz (gracias a HTTPS)"
echo "   ✅ Notificaciones Push (PWA)"
echo "   ✅ Instalación como app nativa"
echo "   ✅ Modo offline (Service Worker)"
echo ""

echo -e "${YELLOW}📝 Información importante:${NC}"
echo "   ✅ Certificado SSL válido por 90 días"
echo "   ✅ Renovación automática de SSL configurada"
echo "   ✅ Actualización automática de DuckDNS configurada"
echo "   ✅ Método de validación: $([ "$SSL_METHOD" == "2" ] && echo "DNS Challenge" || echo "HTTP Challenge")"
echo "   ✅ Logs de renovación: /var/log/certbot-renew.log"
echo ""

echo -e "${YELLOW}🔧 Comandos útiles:${NC}"
echo "   Ver logs:             docker compose logs -f"
echo "   Ver logs backend:     docker compose logs -f backend"
echo "   Ver logs frontend:    docker compose logs -f frontend"
echo "   Ver logs nginx:       docker compose logs -f nginx"
echo "   Reiniciar todo:       docker compose restart"
echo "   Detener todo:         docker compose down"
echo "   Estado:               docker compose ps"
echo "   Renovar SSL:          sudo certbot renew"
echo "   Verificar SSL:        sudo certbot certificates"
echo "   Actualizar DuckDNS:   /root/duckdns-update.sh"
echo ""

echo -e "${YELLOW}🔍 Verificación Azure Portal:${NC}"
echo "   VM → Redes → Reglas de seguridad de entrada"
echo "   Debe tener:"
echo "   - Puerto 22 (SSH)"
echo "   - Puerto 80 (HTTP)"
echo "   - Puerto 443 (HTTPS)"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}¡Tu aplicación está lista para usar! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Guardar información de configuración
cat > /root/smartsales365-config.txt << EOF
╔════════════════════════════════════════════════════════════════╗
║           Configuración de SmartSales365                       ║
╚════════════════════════════════════════════════════════════════╝

📅 Fecha de instalación: $(date)

🌐 Información del servidor:
   - Dominio: $DOMAIN
   - IP del servidor: $SERVER_IP
   - Token de DuckDNS: $DUCKDNS_TOKEN
   - Método SSL: $([ "$SSL_METHOD" == "2" ] && echo "DNS Challenge" || echo "HTTP Challenge")

🔗 URLs:
   - Frontend: https://$DOMAIN
   - Admin: https://$DOMAIN/admin/
   - API: https://$DOMAIN/api/
   - MailHog: http://$SERVER_IP:8025

🔐 Certificados SSL:
   - Ubicación: /etc/letsencrypt/live/$DOMAIN/
   - Validez: 90 días
   - Renovación automática: Diaria a las 3 AM

🔄 Automatizaciones:
   - Actualización DuckDNS: Cada 5 minutos
   - Renovación SSL: Diaria a las 3 AM
   - Logs: /var/log/certbot-renew.log

🔧 Comandos útiles:
   docker compose logs -f          # Ver todos los logs
   docker compose restart          # Reiniciar servicios
   docker compose down             # Detener todo
   docker compose ps               # Ver estado
   sudo certbot renew              # Renovar SSL manualmente
   sudo certbot certificates       # Ver certificados
   /root/duckdns-update.sh        # Actualizar DuckDNS

📂 Archivos importantes:
   - Configuración backend: $(pwd)/backend/.env
   - Configuración frontend: $(pwd)/frontend/.env
   - Configuración Nginx: $(pwd)/nginx.conf
   - Script DuckDNS: /root/duckdns-update.sh
   - Credenciales DuckDNS: /root/.secrets/duckdns.ini

🆘 Soporte:
   - Logs de Certbot: /var/log/letsencrypt/letsencrypt.log
   - Logs de renovación: /var/log/certbot-renew.log
   - Logs de Docker: docker compose logs

╔════════════════════════════════════════════════════════════════╗
║  ¡Tu aplicación SmartSales365 está lista para producción!     ║
╚════════════════════════════════════════════════════════════════╝
EOF

print_success "Configuración guardada en: /root/smartsales365-config.txt"

# Mostrar siguiente paso
echo ""
print_info "Siguiente paso: Abre https://$DOMAIN en tu navegador"
