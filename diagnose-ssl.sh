#!/bin/bash

# Script de diagnóstico SSL
# Ejecutar: sudo bash diagnose-ssl.sh mesasmartsales.duckdns.org

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Debes proporcionar un dominio"
    echo "Uso: sudo bash diagnose-ssl.sh tu-dominio.com"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DIAGNÓSTICO SSL para: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. IP del servidor
echo "📍 1. IP del Servidor:"
SERVER_IP=$(curl -s ifconfig.me)
echo "   $SERVER_IP"
echo ""

# 2. Resolución DNS
echo "🌐 2. Resolución DNS:"
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
echo "   $DOMAIN → $DOMAIN_IP"
if [ "$SERVER_IP" == "$DOMAIN_IP" ]; then
    echo "   ✅ DNS configurado correctamente"
else
    echo "   ❌ DNS NO apunta a este servidor"
fi
echo ""

# 3. Puertos abiertos localmente
echo "🔌 3. Puertos en escucha (local):"
netstat -tuln 2>/dev/null | grep -E ":80 |:443 " || ss -tuln 2>/dev/null | grep -E ":80 |:443 " || echo "   ℹ️  Ningún proceso escuchando en 80/443"
echo ""

# 4. Firewall UFW
echo "🛡️  4. Estado del Firewall (UFW):"
if command -v ufw &> /dev/null; then
    ufw status | grep -E "Status|80|443"
else
    echo "   ℹ️  UFW no instalado"
fi
echo ""

# 5. Reglas de iptables
echo "🔥 5. Reglas de iptables:"
iptables -L INPUT -n | grep -E "tcp dpt:80|tcp dpt:443" || echo "   ℹ️  No hay reglas específicas para 80/443"
echo ""

# 6. Probar conectividad externa al puerto 80
echo "🌍 6. Conectividad externa (puerto 80):"
echo "   Probando desde el servidor..."

# Iniciar servidor temporal en puerto 8000
python3 -m http.server 8000 >/dev/null 2>&1 &
HTTP_PID=$!
sleep 2

# Probar conexión local
if curl -s --connect-timeout 3 http://localhost:8000 >/dev/null 2>&1; then
    echo "   ✅ Conexión local OK"
else
    echo "   ❌ No se puede conectar localmente"
fi

# Detener servidor temporal
kill $HTTP_PID 2>/dev/null

# Probar desde servicio externo
echo "   Probando desde servicio externo..."
EXTERNAL_CHECK=$(curl -s --max-time 5 "https://ping.eu/action.php?atype=4&host=$SERVER_IP:80" | grep -i "reachable\|success\|200" || echo "")
if [ -n "$EXTERNAL_CHECK" ]; then
    echo "   ✅ Puerto 80 accesible desde internet"
else
    echo "   ❌ Puerto 80 NO accesible desde internet"
fi
echo ""

# 7. Certificados existentes
echo "📜 7. Certificados SSL existentes:"
if [ -d "/etc/letsencrypt/live" ]; then
    ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "   ℹ️  Sin certificados"
else
    echo "   ℹ️  Sin certificados"
fi
echo ""

# 8. Logs de certbot
echo "📋 8. Últimas líneas de logs de Certbot:"
if [ -f "/var/log/letsencrypt/letsencrypt.log" ]; then
    tail -n 20 /var/log/letsencrypt/letsencrypt.log
else
    echo "   ℹ️  Sin logs de certbot"
fi
echo ""

# 9. Verificar DNS CAA
echo "🔐 9. Registros CAA del dominio:"
dig CAA $DOMAIN +short || echo "   ℹ️  Sin registros CAA (esto es normal para DuckDNS)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 RECOMENDACIONES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "❌ PROBLEMA CRÍTICO: DNS no apunta a este servidor"
    echo "   Solución: Actualiza el DNS en DuckDNS"
    echo ""
fi

if ! ufw status 2>/dev/null | grep -q "80.*ALLOW"; then
    echo "⚠️  Puerto 80 no permitido en UFW"
    echo "   Solución: sudo ufw allow 80/tcp"
    echo ""
fi

if ! ufw status 2>/dev/null | grep -q "443.*ALLOW"; then
    echo "⚠️  Puerto 443 no permitido en UFW"
    echo "   Solución: sudo ufw allow 443/tcp"
    echo ""
fi

echo "💡 Para dominios DuckDNS, se recomienda:"
echo "   1. Usar DNS challenge en lugar de HTTP challenge"
echo "   2. Ejecutar: sudo bash setup-ssl.sh $DOMAIN"
echo "   3. Cuando pregunte por el token, proporcionarlo"
echo ""

echo "🔧 Verificar en Azure Portal:"
echo "   → VM → Redes → Reglas de seguridad de entrada"
echo "   → Asegurar reglas para puertos 80 y 443 con origen '*'"
echo ""
