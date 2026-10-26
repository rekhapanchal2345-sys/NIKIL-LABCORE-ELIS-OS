# LabCore ELIS OS — Production Deployment & Operations Manual

This document provides complete instructions for deploying **NIKIL-LABCORE-ELIS-OS** to production environments with high availability, enterprise security (DPDP Act 2023, NABH compliance), and automated disaster recovery.

---

## 1. Quick Verification

Before deploying, verify that all builds, schemas, and configurations pass all preflight checks:

```bash
npm run verify:prod
```

Expected output:
```
✨ ALL 12/12 PRODUCTION READINESS CHECKS PASSED!
✅ The system is 100% production & deploy level ready.
```

---

## 2. Architecture & Port Mapping

| Service | Technology | Internal Port | Edge / Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx Edge** | Nginx Alpine | `80`, `443` | `80`, `443` | Reverse proxy, TLS 1.3 termination, HSTS, WebSockets, rate limiting |
| **Hardware TCP**| Nginx Stream -> Backend | `5005` | `5005` | ASTM E1381/E1394 & HL7 v2.x MLLP Analyzer raw TCP listener |
| **Web App** | Next.js 15 | `3001` | `3001` (Internal) | Main Hospital & Laboratory Management UI |
| **Login Portal** | Vite + React SPA | `3002` | `3002` (Internal `/portal`) | Authentication & Secure Sign-in Portal |
| **Backend API** | Node.js 20 + Express | `5000` | `5000` (Internal `/api`) | REST API, Socket.io real-time panic telemetry |
| **PostgreSQL** | PostgreSQL 16 Alpine | `5432` | `5432` (Protected) | Primary Relational Database with Connection Pool |
| **Redis** | Redis 7 Alpine | `6379` | `6379` (Protected) | Token blacklisting, session security, rate limits, LRU cache |
| **Certbot** | Certbot ACME Client | - | Background | Automated 60-day Let's Encrypt TLS renewal companion |

---

## 3. Automated Server Provisioning (Ubuntu 24.04 LTS / 22.04 LTS)

For automated single-command provisioning of a fresh Linux VPS (minimum 4 vCPU, 8GB RAM, 100GB SSD):

```bash
# Execute as root or with sudo
sudo bash deploy/setup-production-server.sh
```

This automated script performs:
1. **Hardware Verification**: Audits CPU cores, RAM, and disk storage headroom.
2. **OS Packages**: Updates apt and installs `curl`, `git`, `ufw`, `fail2ban`, `certbot`, `python3-certbot-nginx`, `jq`, `htop`.
3. **Docker Engine**: Installs official Docker Engine and Docker Compose v2.
4. **Kernel Tuning (`/etc/sysctl.d/99-labcore.conf`)**:
   - `net.core.somaxconn = 65535`
   - `fs.file-max = 2097152`
   - `vm.overcommit_memory = 1`
   - `vm.max_map_count = 262144`
5. **UFW Firewall Isolation**:
   - Default deny incoming, default allow outgoing
   - Exposes **only**: `22` (SSH), `80` (HTTP ACME/Redirect), `443` (HTTPS TLS 1.3), `5005` (ASTM TCP Analyzer)
6. **Fail2ban**: Enables automated SSH brute-force IP banning.
7. **Systemd Service**: Registers `labcore.service` for zero-touch auto-start on server boot.

---

## 4. Deployment Method A: Docker Compose with TLS 1.3 (Recommended)

Docker Compose provides a turnkey, multi-container environment with automated database migrations, healthchecks, and reverse proxy routing.

### Step 1: Prepare Production Environment Variables
Copy the template and populate production secrets:
```bash
cp .env.production.example .env.production
```

> **Important**: Generate secure 32+ character keys using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 2: Configure TLS 1.3 SSL Certificate
For domain names (e.g., `elis.yourhospital.com`):
```bash
# Request Let's Encrypt certificate:
sudo bash nginx/ssl/generate-letsencrypt.sh elis.yourhospital.com admin@yourhospital.com
```

Or for internal staging / intranet deployment with self-signed SAN certificate:
```bash
bash nginx/ssl/generate-self-signed-ssl.sh elis.yourhospital.com 365
```

### Step 3: Build & Start All Services
```bash
npm run docker:prod:up
# Or directly:
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Verify Deployment Health
```bash
curl -k https://localhost/healthz
# Expected output: healthy
```

### Step 5: View Live Service Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6: Stop Services
```bash
npm run docker:prod:down
```

---

## 5. Deployment Method B: Bare-Metal / VPS (PM2)

For deployment on Linux servers without Docker:

### Step 1: System Dependencies
```bash
sudo apt update
sudo apt install -y curl ca-certificates postgresql postgresql-contrib redis-server chromium
sudo npm install -g pm2
```

### Step 2: Database Migration & Super Admin Seeding
```bash
npm run deploy:migrate
```
*Applies all pending Prisma migrations and guarantees an active `SUPER_ADMIN` user (`admin@labcore.local`).*

### Step 3: Build All Services
```bash
npm run build:all
```

### Step 4: Start Services with PM2
```bash
npm run pm2:start
```

Useful PM2 operational commands:
```bash
npm run pm2:restart    # Graceful reload
pm2 logs               # View combined logs
pm2 status             # Process health and memory usage
npm run pm2:stop       # Stop processes
pm2 startup            # Register PM2 to restart on system reboot
pm2 save               # Save process table
```

---

## 6. Disaster Recovery & Automated Backups

### Automated Database Backups
LabCore ELIS includes built-in backup management with AES-256 encryption. Backups can be triggered via REST API (`POST /api/backup/create`) or cron job:

```bash
# Daily backup at 02:00 AM
0 2 * * * cd /path/to/NIKIL-LABCORE-ELIS-OS/backend && npm run backup
```

### Database Restoration
```bash
psql -U labcore -d labcore_elis -f /path/to/backups/backup_name.sql
```

---

## 7. Clinical Hardware Analyzer Connection (Port 5005)

To connect Sysmex, Roche Cobas, Mindray, or Beckman Coulter analyzer machines:
1. Configure analyzer machine's host IP to point to the LabCore server IP.
2. Set protocol mode: **ASTM E1381** or **HL7 v2.x (MLLP)**.
3. Destination Port: `5005` (proxied directly via Nginx Stream Layer 4 TCP proxy to backend).
4. Handshakes and results are automatically processed and dispatched in real-time to the Pathologist Worklist.
