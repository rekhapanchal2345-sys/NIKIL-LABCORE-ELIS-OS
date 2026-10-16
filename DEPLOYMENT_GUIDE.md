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

| Service | Technology | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Nginx** | Nginx Alpine | `80`, `443` | Reverse proxy, SSL/TLS termination, Gzip, WebSockets |
| **Web App** | Next.js 15 | `3001` | Main Hospital & Laboratory Management UI |
| **Login Portal** | Vite + React SPA | `3002` / `/portal` | Authentication & Secure Sign-in Portal |
| **Backend API** | Node.js 20 + Express | `5000` | REST API, Socket.io real-time panic telemetry |
| **Hardware TCP** | Node.js TCP Engine | `5005` | ASTM E1381/E1394 & HL7 v2.x MLLP Analyzer listener |
| **PostgreSQL** | PostgreSQL 16 | `5432` | Primary Relational Database with Connection Pool |
| **Redis** | Redis 7 | `6379` | Token blacklisting, session security, rate limits |

---

## 3. Deployment Method A: Docker Compose (Recommended)

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

### Step 2: Build & Start All Services
```bash
npm run docker:prod:up
# Or directly:
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 3: View Live Service Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Step 4: Stop Services
```bash
npm run docker:prod:down
```

---

## 4. Deployment Method B: Bare-Metal / VPS (PM2)

For deployment on Linux servers (Ubuntu 22.04/24.04 LTS, Debian 12, or AlmaLinux):

### Step 1: System Dependencies
```bash
# Install Node.js 20 LTS, PostgreSQL 16, and Chromium for PDF generation
sudo apt update
sudo apt install -y curl ca-certificates postgresql postgresql-contrib redis-server chromium
sudo npm install -g pm2
```

### Step 2: Database Migration & Super Admin Seeding
Run zero-downtime database migrations:
```bash
npm run deploy:migrate
```
*Applies all pending Prisma migrations and guarantees an active `SUPER_ADMIN` user (`admin@labcore.local`).*

### Step 3: Build All Services
```bash
npm run build:all
```
*Builds `backend/dist`, `frontend/apps/web/.next`, and `login-portal/dist` in parallel.*

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

## 5. SSL / HTTPS Configuration (Nginx + Certbot)

For production domain names (e.g., `elis.yourhospital.com`):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d elis.yourhospital.com
```

Certbot automatically configures TLS 1.3 certificates and sets up automatic 60-day renewal.

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
3. Destination Port: `5005`.
4. Handshakes and results are automatically processed and dispatched in real-time to the Pathologist Worklist.