<!-- Vibrant Digital Ocean Deployment Guide (2025 Edition) -->

# 🌈🚀 Craft Fusion: Digital Ocean Deployment (2025)

> **Vibrant, Automated, and Legendary** — This guide reflects the latest Craft Fusion deployment workflow, leveraging our color-rich scripts and centralized system prep for a seamless, reliable, and visually engaging experience.

---

## 🖥️ Digital Ocean Environment Overview

- **OS:** Fedora 40 x64 (recommended)
- **CPU:** 1+ vCPU (4+ for AI features)
- **Memory:** 2GB+ (8GB+ for AI)
- **Disk:** 40GB+ SSD
- **Network:** Public IP, SSH enabled
- **Auditd:** Active for security monitoring
- **Nginx:** Reverse proxy for frontend and APIs
- **PM2:** Process manager for Node/Go backends
- **Ollama:** Optional AI model server

---

## 🎨 Vibrant Script-Driven Workflow

All major scripts now use a centralized, color-coded system prep and monitoring approach:

- `system-prep.sh` — Kills lingering processes, optimizes memory, and tunes the system before every build or deploy.
- `memory-monitor.sh` — Real-time, vibrant system health dashboard (run in a separate terminal for live monitoring).
- `deploy-all.sh` — Orchestrates full deployment, including system prep, build, and service restarts.
- `fedramp-minor.sh` — Runs all OSCAL/FedRAMP compliance scans with color-coded results.
- `clean-build.sh` — Cleans, resets, and builds all apps with system prep.

**All output is vibrant, color-coded, and easy to follow.**

---

## 🚦 Quick Start: Legendary Deployment

1. **SSH to your droplet:**

   ```bash
   ssh jeffrey@your_droplet_ip
   ```

2. **Clone the repo and enter the directory:**

   ```bash
   git clone https://github.com/yourusername/craft-fusion.git
   cd craft-fusion
   ```

3. **Run the full deployment script:**

   ```bash
   bash scripts/deploy-all.sh
   ```

   - This will:
     - Run system prep (memory/process cleanup, optimization)
     - Build all apps (Angular, NestJS, Go)
     - Deploy to Nginx and PM2
     - Print a vibrant summary of your environment

4. **(Optional) Start the live memory monitor:**

   ```bash
   bash scripts/memory-monitor.sh
   ```

   - Keep this running in a separate terminal for real-time system health.

5. **(Optional) Run compliance scans:**

   ```bash
   sudo bash scripts/fedramp-minor.sh
   ```

---

## 🟦 Best Practices & Tips

- **Always use the provided scripts** — They handle system prep, error handling, and vibrant output.
- **Monitor in real time** — Use `memory-monitor.sh` for live feedback during heavy builds or deployments.
- **Back up before major changes** — Use the built-in backup script or snapshot your droplet.
- **Check logs** — All logs are color-coded and easy to find in `/var/log` and via PM2.
- **Environment variables** — Set in `.env` and referenced by all scripts.

---

## 📝 Example: Vibrant System Summary

```text
╔══════════════════════════════════════════════════════════════════════════╗
║               🚀 Craft Fusion Deployment: System Overview              ║
╚══════════════════════════════════════════════════════════════════════════╝
CPU Cores:   1   Memory: 1956MB   Disk Free: 36G
Network:     eth0 (146.190.157.59)   Ping: 1.66ms
Auditd:      active
Date:        Sun May 25 08:14:07 PM UTC 2025
```

---

## 🛠️ Full Digital Ocean Deployment Steps (2025)

1. **Provision Fedora 40 Droplet** (see Digital Ocean UI)
2. **SSH in as your user**
3. **Clone repo and run:**

   ```bash
   bash scripts/deploy-all.sh
   ```

4. **Monitor with:**

   ```bash
   bash scripts/memory-monitor.sh
   ```

5. **(Optional) Run compliance scans:**

   ```bash
   sudo bash scripts/fedramp-minor.sh
   ```

6. **(Optional) Clean and rebuild:**

   ```bash
   bash scripts/clean-build.sh
   ```

---

## 🌈 Script Reference Table

| Script                  | Purpose                                      |
|-------------------------|----------------------------------------------|
| system-prep.sh          | System prep, memory/process cleanup, tuning  |
| memory-monitor.sh       | Live system health dashboard                 |
| deploy-all.sh           | Full build & deployment                      |
| fedramp-minor.sh        | OSCAL/FedRAMP compliance scans               |
| clean-build.sh          | Clean, reset, and build all apps             |
| verify-deployment.sh    | Post-deploy verification                     |
| backup.sh               | Backup code, configs, and data               |

---

## 🟩 Environment Variables

- All scripts use `.env` for configuration (domain, ports, etc.)
- Example:

  ```env
  NODE_ENV=production
  DOMAIN=jeffreysanford.us
  PORT=3000
  HOST=0.0.0.0
  EXPOSE_API=true
  ```

---

## 🟪 Troubleshooting

- **Colorful logs**: All scripts print color-coded errors and warnings.
- **Missing dependencies**: Run `bash scripts/system-prep.sh` to re-optimize.
- **API not exposed?**: Check `.env` and PM2 logs, ensure `HOST=0.0.0.0`.
- **SSL issues?**: Re-run `sudo certbot --nginx` and check Nginx config.
- **Resource pressure?**: Use `htop` and `memory-monitor.sh` to diagnose.

---

## 🏁 Final Notes

- **All scripts are DRY and vibrant** — never duplicate system prep logic.
- **Monitor, deploy, and scan with confidence** — the Craft Fusion workflow is now legendary.
- **For advanced monitoring**: Integrate Prometheus, Grafana, or ELK as needed.

---

> **Craft Fusion Team, 2025** — _Work hard now, work smarter later!_

<!-- End of vibrant, color-themed Digital Ocean deployment guide -->
