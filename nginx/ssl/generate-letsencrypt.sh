#!/usr/bin/env bash
# ==============================================================================
# LabCore ELIS OS — Certbot Let's Encrypt Production SSL Provisioner
# Requests and configures genuine CA-signed TLS 1.3 certificates via ACME challenge
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-elis.yourhospital.com}"
EMAIL="${2:-admin@yourhospital.com}"
CERTBOT_DIR="./certbot"

echo "================================================================="
echo "🌐 Requesting Let's Encrypt Production SSL Certificate"
echo "📌 Domain: ${DOMAIN}"
echo "📧 Email:  ${EMAIL}"
echo "================================================================="

mkdir -p "${CERTBOT_DIR}/conf" "${CERTBOT_DIR}/www" "./nginx/ssl/live"

# Check if Nginx is already running for HTTP-01 challenge
if docker compose -f docker-compose.prod.yml ps | grep -q labcore-nginx-prod; then
    echo "ℹ️ labcore-nginx-prod is active. Executing ACME Webroot challenge..."
    docker run --rm \
        -v "$(pwd)/${CERTBOT_DIR}/conf:/etc/letsencrypt" \
        -v "$(pwd)/${CERTBOT_DIR}/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d "${DOMAIN}"
else
    echo "ℹ️ Starting temporary standalone Certbot on port 80..."
    docker run --rm -p 80:80 \
        -v "$(pwd)/${CERTBOT_DIR}/conf:/etc/letsencrypt" \
        -v "$(pwd)/${CERTBOT_DIR}/www:/var/www/certbot" \
        certbot/certbot certonly \
        --standalone \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d "${DOMAIN}"
fi

# Link or copy certificates to nginx/ssl/live for immediate mounting
if [ -f "${CERTBOT_DIR}/conf/live/${DOMAIN}/fullchain.pem" ]; then
    cp -L "${CERTBOT_DIR}/conf/live/${DOMAIN}/fullchain.pem" ./nginx/ssl/live/fullchain.pem
    cp -L "${CERTBOT_DIR}/conf/live/${DOMAIN}/privkey.pem" ./nginx/ssl/live/privkey.pem
    chmod 600 ./nginx/ssl/live/privkey.pem
    chmod 644 ./nginx/ssl/live/fullchain.pem
    echo "✅ Let's Encrypt certificate successfully installed in ./nginx/ssl/live/"
    
    # Reload Nginx if container is running
    if docker compose -f docker-compose.prod.yml ps | grep -q labcore-nginx-prod; then
        docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
        echo "🔄 Nginx configuration reloaded with new certificate."
    fi
else
    echo "⚠️ Certificate generation did not output expected fullchain.pem. Retaining fallback certificates."
fi
