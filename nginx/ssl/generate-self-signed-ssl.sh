#!/usr/bin/env bash
# ==============================================================================
# LabCore ELIS OS — Self-Signed SSL Certificate Generator
# Generates high-entropy RSA 2048-bit SAN certificates for staging & local TLS 1.3
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/live"
DOMAIN="${1:-elis.yourhospital.com}"
DAYS_VALID="${2:-365}"

mkdir -p "${TARGET_DIR}"

echo "================================================================="
echo "🔐 Generating Self-Signed TLS 1.3 Certificate for: ${DOMAIN}"
echo "📁 Destination: ${TARGET_DIR}"
echo "================================================================="

openssl req -x509 \
  -newkey rsa:2048 \
  -nodes \
  -sha256 \
  -keyout "${TARGET_DIR}/privkey.pem" \
  -out "${TARGET_DIR}/fullchain.pem" \
  -days "${DAYS_VALID}" \
  -subj "/C=IN/ST=Karnataka/L=Bengaluru/O=LabCore ELIS/OU=Medical Systems/CN=${DOMAIN}" \
  -addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1"

chmod 600 "${TARGET_DIR}/privkey.pem"
chmod 644 "${TARGET_DIR}/fullchain.pem"

echo "✅ Generated: ${TARGET_DIR}/fullchain.pem"
echo "✅ Generated: ${TARGET_DIR}/privkey.pem"
echo "✨ Certificate valid for ${DAYS_VALID} days with SAN: ${DOMAIN}, localhost, 127.0.0.1"
