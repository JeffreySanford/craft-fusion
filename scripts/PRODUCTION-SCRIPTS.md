# Production Scripts

## Essential Deployment Scripts

### Core Deployment
- `deploy-all.sh` - **Main production deployment orchestrator**
- `deploy-backend.sh` - Backend-only deployment
- `deploy-frontend.sh` - Frontend-only deployment
- `clean-build.sh` - Build cleanup utility

### Testing & Validation
- `test-backends.sh` - API endpoint testing
- `verify-deployment.sh` - Post-deployment validation
- `nginx-test.sh` - Nginx configuration testing

### Infrastructure
- `memory-monitor.sh` - Real-time system monitoring
- `ssl-setup.sh` - SSL certificate configuration
- `wss-setup.sh` - WebSocket Secure setup
- `system-optimize.sh` - VPS optimization

## OSCAL/FedRAMP Go Scanner

> **Note:**  
> If you update `scripts/oscal-scanner.go`, you must rebuild the binary before running it:
>
> ```bash
> cd scripts
> go build -o oscal-scanner oscal-scanner.go
> ```
> This will produce an executable `oscal-scanner` (or `oscal-scanner.exe` on Windows) in the `scripts/` directory.
>
> **Puppeteer Browser Dependency:**  
> For PDF/Markdown export, Puppeteer's Chrome browser must be installed.  
> You can add the following to your project setup:
>
> - **Option 1:** Add a postinstall script to your root `package.json`:
>   ```json
>   "scripts": {
>     "postinstall": "npx puppeteer browsers install chrome"
>   }
>   ```
> - **Option 2:** Run manually after `npm install`:
>   ```bash
>   npx puppeteer browsers install chrome
>   ```
> - **Note:** If running as root or with `sudo`, ensure the correct cache directory permissions (see script output for guidance).

## Archived Scripts

Experimental and completed scripts have been moved to `scripts/archive/`:
- `deploy-timed.sh` - Development version with progress tracking
- `deploy-low-memory.sh` - Memory optimization experiments
- `deploy-with-monitor.sh` - Combined deployment with monitoring
- `fix-pm2-permissions.sh` - One-time PM2 user setup (completed)
- `fix-ecosystem-config.sh` - One-time configuration fix (completed)

## Compliance

### FedRAMP/OSCAL Profiles Supported

| Profile         | Status/Color         | Description                                                                                                   | Key Features / Checks                                                                                 |
|----------------|----------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `standard`     | ![#228B22](https://via.placeholder.com/10/228B22?text=+) Green | Baseline security (recommended for most)                                                                     | Basic OSCAL/SCAP scan, XML/HTML reports, health checks, service status, port checks, file/dir checks, resource usage, network health, audit log presence, summary and detailed logs |
| `ospp`         | ![#4682B4](https://via.placeholder.com/10/4682B4?text=+) Blue  | Protection Profile for General Purpose Operating Systems                                                     | OSPP-specific controls, audit logging, system process checks, advanced file/dir permissions, systemd service validation, log rotation, process anomaly detection, user account checks |
| `pci-dss`      | ![#FFD700](https://via.placeholder.com/10/FFD700?text=+) Gold  | Payment Card Industry Data Security Standard                                                                 | PCI-DSS controls, encryption checks, access control, log retention, cardholder data checks, secure transport, audit trail validation, compliance report archiving |
| `cusp`         | ![#8A2BE2](https://via.placeholder.com/10/8A2BE2?text=+) Purple| Custom User Security Profile (Fedora-specific)                                                               | Custom controls, Fedora hardening, custom audit checks, SELinux/AppArmor status, kernel parameter checks, custom compliance scripts, Fedora-specific logging |
| `medium-high`  | ![#FF8C00](https://via.placeholder.com/10/FF8C00?text=+) Orange| FedRAMP Rev5 Medium/High (pre-release, forward compatible)                                                   | Enhanced controls, more frequent scan checks, stricter logging, pre-2025 requirements, advanced NIST controls, log integrity, incident response checks |
| <span style="color:#1e90ff;font-weight:bold;">`rev5`</span> | <span style="color:#1e90ff;">Blue (New)</span> | <b>FedRAMP Rev5</b>, <b>new standard</b> – <i>not yet officially defined</i> (2025)                        | All medium-high checks, new NIST controls, advanced audit, real-time compliance logging, continuous monitoring, advanced incident detection, forward-compatible logging, compliance evidence collection |
| <span style="color:#ff8c00;font-weight:bold;">`fedramp20x`</span> | <span style="color:#ff8c00;">Orange (Future)</span> | <b>FedRAMP 20x</b>, <b>May 2025 specification</b> – <b>future standard</b>                                 | All rev5 checks, forward compatibility, continuous monitoring, 2025+ requirements, automated compliance reporting, AI-driven anomaly detection, advanced log analytics, future-proof controls |
| <span style="color:#32cd32;font-weight:bold;">`truenorth`</span> | <span style="color:#32cd32;">Lime Green (Custom)</span> | <b>Exceeds all standards</b>, <b>real-time monitoring</b>, 3FAO/3PAO, <b>not yet officially defined</b> | All fedramp20x checks, real-time monitoring, 3FAO/3PAO, custom controls, anomaly detection, reporting, AI-based compliance, live endpoint monitoring, advanced alerting, compliance dashboard, custom JSON validation |

> **Note:** `medium-high`, <span style="color:#1e90ff;">`rev5`</span>, and <span style="color:#ff8c00;">`fedramp20x`</span> are included for forward compatibility with the May 2025 FedRAMP 20x update. <span style="color:#32cd32;">`truenorth`</span> is a custom profile that exceeds all current and planned standards.

#### Additional Checks & Logging (All Profiles)

- **System Health:**
  - Service status (nginx, PM2, Node, Go, etc.)
  - Port checks (80, 443, 3000, 4000, etc.)
  - File/directory existence and permissions
  - Resource usage (CPU, memory, disk, swap)
  - Network connectivity and endpoint health
  - System uptime and load
  - Open file limits and process counts
  - User account and group checks
- **FedRAMP/OSCAL-Specific:**
  - OSCAL/SCAP scan results (XML/HTML)
  - Profile-specific control checks (see table above)
  - Audit log presence, rotation, and integrity
  - Real-time monitoring (for `truenorth`, `fedramp20x`, `rev5`)
  - Anomaly detection and alerting (for `truenorth`, `fedramp20x`)
  - Compliance report generation and archiving
  - JSON schema validation for custom profiles (e.g., `truenorth-template.json`)
  - Evidence collection and automated compliance documentation
- **Logging:**
  - All scripts log to timestamped files in `logs/` or `oscal-analysis/`
  - All scripts display the last modified date/time of each compliance report in their output for traceability
  - Color-coded output for quick status review
  - Summary tables and detailed logs for each scan
  - Error and warning highlighting
  - Recommendations for remediation if checks fail
  - Compliance dashboard output (for advanced/future profiles)
  - AI-driven log analysis (for `truenorth`, `fedramp20x`)

#### Example Usage

```bash
# Full production deployment
./scripts/deploy-all.sh

# Test deployment
./scripts/test-backends.sh

# Monitor system resources
./scripts/memory-monitor.sh

# Run OSCAL/FedRAMP scan (all profiles)
sudo ./scripts/fedramp-minor.sh

# Run TrueNorth OSCAL test
bash ./scripts/truenorth-oscal-test.sh
```

---

For more details, see individual script headers and logs in `oscal-analysis/`.
