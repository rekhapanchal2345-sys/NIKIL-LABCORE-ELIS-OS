#!/usr/bin/env bash
# ==============================================================================
# LabCore ELIS OS — Automated Production Server Provisioning Script
# Target Platform: Ubuntu 24.04 LTS / 22.04 LTS (x86_64)
# Hardware Profile: Min 4 vCPU, 8GB RAM, 100GB NVMe/SSD
# Compliance: DPDP Act 2023, NABH Digital Health Guidelines, OWASP Level 2
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}🏥 NIKIL-LABCORE-ELIS-OS — PRODUCTION SERVER PROVISIONING SCRIPT${NC}"
echo -e "${CYAN}========================================================================${NC}"

# 1. ROOT PRIVILEGE CHECK
if [ "${EUID}" -ne 0 ]; then
    echo -e "${RED}❌ ERROR: This script must be executed as root or with sudo privileges.${NC}"
    exit 1
fi

# 2. HARDWARE SPECIFICATION AUDIT
echo -e "\n${BLUE}[1/8] Verifying Server Hardware Specifications...${NC}"
CPU_CORES=$(nproc)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))
DISK_AVAIL_GB=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')

echo -e "  • Detected CPU Cores : ${CPU_CORES}"
echo -e "  • Detected Total RAM : ${TOTAL_RAM_GB} GB"
echo -e "  • Detected Free Disk : ${DISK_AVAIL_GB} GB"

if [ "${CPU_CORES}" -lt 4 ]; then
    echo -e "${YELLOW}  ⚠️ WARNING: Detected ${CPU_CORES} cores. Recommended minimum is 4 vCPUs for enterprise hospital workloads.${NC}"
else
    echo -e "${GREEN}  ✓ CPU Cores meet hospital grade criteria.${NC}"
fi

if [ "${TOTAL_RAM_GB}" -lt 7 ]; then
    echo -e "${YELLOW}  ⚠️ WARNING: Detected ${TOTAL_RAM_GB} GB RAM. Recommended minimum is 8 GB for high-concurrency PostgreSQL & Redis.${NC}"
else
    echo -e "${GREEN}  ✓ RAM capacity meets hospital grade criteria.${NC}"
fi

# 3. OPERATING SYSTEM UPDATE & CORE PACKAGES
echo -e "\n${BLUE}[2/8] Updating Apt Repositories & Installing Base Dependencies...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confold"

apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    git \
    jq \
    htop \
    net-tools \
    tar \
    unzip

echo -e "${GREEN}  ✓ Core system utilities installed successfully.${NC}"

# 4. DOCKER ENGINE & DOCKER COMPOSE V2 INSTALLATION
echo -e "\n${BLUE}[3/8] Configuring Official Docker Engine & Compose v2 Repository...${NC}"
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    echo -e "${GREEN}  ✓ Docker Engine installed and enabled.${NC}"
else
    echo -e "${GREEN}  ✓ Docker Engine already installed: $(docker --version)${NC}"
fi

# 5. LINUX KERNEL SYSCTL PERFORMANCE TUNING (NABH High-Throughput)
echo -e "\n${BLUE}[4/8] Applying High-Throughput Linux Kernel Optimizations...${NC}"
cat << 'EOF' > /etc/sysctl.d/99-labcore.conf
# High-concurrency TCP socket and connection queue headroom
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# File descriptor ceiling for Node.js event loops and PostgreSQL connections
fs.file-max = 2097152

# Memory allocation headroom for Redis background snapshots
vm.overcommit_memory = 1
vm.max_map_count = 262144
EOF

sysctl -p /etc/sysctl.d/99-labcore.conf > /dev/null || true
echo -e "${GREEN}  ✓ Kernel sysctl parameters applied (somaxconn=65535, overcommit_memory=1).${NC}"

# 6. UFW FIREWALL HARDENING
echo -e "\n${BLUE}[5/8] Configuring UFW Firewall with Strict Port Isolation...${NC}"
# Default policies: Deny all incoming, allow outgoing
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allowed ports per LabCore Architecture Specification:
# 22   : SSH (Administration)
# 80   : HTTP (Let's Encrypt ACME Challenge & 301 HTTPS Redirection)
# 443  : HTTPS (Encrypted Hospital Web App & TLS 1.3 REST API)
# 5005 : ASTM / HL7 Hardware Laboratory Analyzer TCP Stream Socket
SSH_PORT="${SSH_PORT:-22}"
ufw allow "${SSH_PORT}"/tcp comment 'SSH Secure Administration'
ufw allow 80/tcp comment 'HTTP ACME & Redirect'
ufw allow 443/tcp comment 'HTTPS Production ELIS Gateway'
ufw allow 5005/tcp comment 'ASTM Analyzer TCP Stream Socket'

# Enable firewall non-interactively
ufw --force enable
echo -e "${GREEN}  ✓ UFW Firewall configured: Exposed ports [${SSH_PORT}, 80, 443, 5005] only.${NC}"
ufw status verbose

# 7. FAIL2BAN BRUTE FORCE PROTECTION
echo -e "\n${BLUE}[6/8] Configuring Fail2ban Intrusion Defense...${NC}"
cat << 'EOF' > /etc/fail2ban/jail.d/labcore-ssh.conf
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

systemctl enable --now fail2ban
echo -e "${GREEN}  ✓ Fail2ban active for automated SSH brute-force defense.${NC}"

# 8. DIRECTORY PERMISSIONS & SYSTEMD AUTOMATION
echo -e "\n${BLUE}[7/8] Preparing Production Directories and Systemd Unit...${NC}"
DEPLOY_DIR="/opt/labcore"
mkdir -p "${DEPLOY_DIR}/nginx/ssl/live"
mkdir -p "${DEPLOY_DIR}/certbot/conf"
mkdir -p "${DEPLOY_DIR}/certbot/www"
mkdir -p "${DEPLOY_DIR}/backend/backups"
mkdir -p "${DEPLOY_DIR}/backend/uploads"

chmod -R 755 "${DEPLOY_DIR}"
chmod 777 "${DEPLOY_DIR}/backend/backups"
chmod 777 "${DEPLOY_DIR}/backend/uploads"

# Create systemd service for zero-touch auto-restart on host reboot
cat << EOF > /etc/systemd/system/labcore.service
[Unit]
Description=LabCore ELIS OS — Containerized Hospital Management Stack
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${DEPLOY_DIR}
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable labcore.service
echo -e "${GREEN}  ✓ Systemd service 'labcore.service' registered for automated system boot recovery.${NC}"

# 9. SUMMARY & NEXT STEPS
echo -e "\n${BLUE}[8/8] Provisioning Verification Complete!${NC}"
echo -e "${CYAN}========================================================================${NC}"
echo -e "${GREEN}✨ PRODUCTION SERVER PROVISIONING COMPLETE!${NC}"
echo -e "${CYAN}========================================================================${NC}"
echo -e "Next Steps for Deployment:"
echo -e " 1. Copy repository files into: ${DEPLOY_DIR}"
echo -e " 2. Configure production secrets in: ${DEPLOY_DIR}/.env.production"
echo -e "    (Run: cp .env.production.example .env.production && nano .env.production)"
echo -e " 3. Generate initial SSL certificate (or run nginx/ssl/generate-self-signed-ssl.sh)"
echo -e " 4. Launch hospital stack: cd ${DEPLOY_DIR} && docker compose -f docker-compose.prod.yml up -d --build"
echo -e " 5. Check health: curl -k https://localhost/healthz"
echo -e "${CYAN}========================================================================${NC}"
