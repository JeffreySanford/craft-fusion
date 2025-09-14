# Production Scripts

## Essential Deployment Scripts

### Core Deployment

- `deploy-all.sh` - **Main production deployment orchestrator**
- `deploy-backend.sh` - Backend-only deployment
- `deploy-frontend.sh` - Frontend-only deployment (no archives)
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

## Frontend Deployment Options

The `deploy-frontend.sh` script supports two deployment approaches:

### 1. Local Build Deployment (Default)

Build the Angular application locally and deploy the artifacts:

```bash
# Standard local build and deploy
./scripts/deploy-frontend.sh

# With full cleanup (recommended for clean slate)
./scripts/deploy-frontend.sh --full-clean
```

**Advantages:**

- Faster (uses local development machine resources)
- Good for development/testing cycles
- Less server resource usage

**Requirements:**

- Local environment must match production (Node.js version, dependencies)
- Build artifacts must be transferred to server

### 2. Server Build Deployment

Build the Angular application directly on the production server:

```bash
# Build on server (recommended for production)
./scripts/deploy-frontend.sh --server-build

# Server build with full cleanup
./scripts/deploy-frontend.sh --server-build --full-clean
```

**Advantages:**

- Environment consistency (builds exactly where it runs)
- No artifact transfer needed
- Eliminates local/server environment differences

**Requirements:**

- Adequate server memory (3GB+ recommended)
- Node.js 18+ on server (Node.js 20 LTS recommended)
- Source code available on server

### 3. Deploy Existing Build

Deploy pre-built artifacts without rebuilding:

```bash
# Deploy existing dist/ artifacts only
./scripts/deploy-frontend.sh --skip-build
```

**Use Cases:**

- Emergency deployments with known-good builds
- Rapid rollback scenarios
- CI/CD pipelines with separate build stages

## Production Deployment Best Practices

### Recommended Production Workflow

1. **Preparation:**

   ```bash
   # On server: ensure environment is ready
   node --version  # Should be 18+, preferably 20 LTS
   free -h         # Check available memory
   df -h           # Check disk space
   ```

2. **Deploy with server build:**

   ```bash
   ./scripts/deploy-frontend.sh --server-build --full-clean
   ```

3. **Verify deployment:**

   ```bash
   # Check site accessibility
   curl -I https://jeffreysanford.us
   
   # Check nginx logs
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   
   # Verify backend connectivity  
   pm2 status
   ```

### Memory Management for Server Builds

Server builds require adequate memory. The script automatically:

- Sets `NODE_OPTIONS=--max_old_space_size=3072`
- Uses limited npm concurrency (`--maxsockets=3`)
- Checks available memory and warns if low

If builds fail due to memory:

1. Clear system caches: `sudo sysctl vm.drop_caches=3`
2. Stop unnecessary services temporarily
3. Add swap space if needed
4. Consider using `--power` flag with `deploy-all.sh`

### Troubleshooting Server Builds

**Build fails with "Missing } in template expression":**

```bash
# Run with verbose output to identify the exact file/line:
npm run build:prod -- --verbose --skip-nx-cache
```

**OOM (Out of Memory) during npm ci:**

```bash
# Clear caches and retry with limited concurrency
npm cache clean --force
npx nx reset
npm ci --progress=false --no-audit --maxsockets=3
```

**Lockfile conflicts:**

```bash
# Remove conflicting lockfiles (keep only package-lock.json)
rm -f pnpm-lock.yaml yarn.lock
npm ci
```

### SELinux Considerations

The deployment script automatically handles SELinux contexts:

- Checks if SELinux is enforcing
- Runs `restorecon -R` on web root
- Sets proper file permissions (nginx:nginx, 755)

### Backup and Rollback

Each deployment automatically creates timestamped backups:

- Location: `/var/backups/jeffreysanford.us/backup-YYYYMMDD-HHMMSS`
- Includes complete previous deployment
- Manual rollback: `sudo cp -r /var/backups/jeffreysanford.us/backup-<timestamp>/* /var/www/jeffreysanford.us/`

## No Archive Approach

**Important:** This deployment system does NOT use zip, tar, or other archive files. Instead:

- **Local builds:** Artifacts are synchronized directly from `dist/` to web root
- **Server builds:** Built in place and deployed immediately  
- **Backups:** Use `cp -r` for full directory snapshots
- **Transfers:** Use `rsync` or direct copy operations

This approach eliminates:

- Archive creation/extraction overhead
- Temporary file management
- Compression/decompression delays
- Archive corruption risks

## OSCAL/FedRAMP Go Scanner

> **Note:**  
> If you update `scripts/oscal-scanner.go`, you must rebuild the binary before running it:
>
> ```bash
> cd scripts
> go build -o oscal-scanner oscal-scanner.go
> ```
>
> This will produce an executable `oscal-scanner` (or `oscal-scanner.exe` on Windows) in the `scripts/` directory.
>
> **Puppeteer Browser Dependency:**  
> For PDF/Markdown export, Puppeteer's Chrome browser must be installed.  
> You can add the following to your project setup:
>
> - **Option 1:** Add a postinstall script to your root `package.json`:
>
>   ```json
>   "scripts": {
>     "postinstall": "npx puppeteer browsers install chrome"
>   }
>   ```
>
> - **Option 2:** Run manually after `npm install`:
>
>   ```bash
>   npx puppeteer browsers install chrome
>   ```
>
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

| Profile         | Status/Color         | Description                                                                                                   | Key Features / Checks                                                                                 | Reference |
|----------------|----------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|-----------|
| `standard`     | <span style="display:inline-block;width:12px;height:12px;background:#228B22;border-radius:2px;margin-right:4px;"></span> Green | Baseline security (recommended for most)                                                                     | Basic OSCAL/SCAP scan, XML/HTML reports, health checks, service status, port checks, file/dir checks, resource usage, network health, audit log presence, summary and detailed logs | [NIST OSCAL](https://pages.nist.gov/OSCAL/) |
| `ospp`         | <span style="display:inline-block;width:12px;height:12px;background:#4682B4;border-radius:2px;margin-right:4px;"></span> Blue  | Protection Profile for General Purpose Operating Systems                                                     | OSPP-specific controls, audit logging, system process checks, advanced file/dir permissions, systemd service validation, log rotation, process anomaly detection, user account checks | [BSI OSPP](https://www.bsi.bund.de/EN/Topics/Certification/ITProductsProtectionProfiles/itproductsprotectionprofiles_node.html) |
| `pci-dss`      | <span style="display:inline-block;width:12px;height:12px;background:#FFD700;border-radius:2px;margin-right:4px;"></span> Gold  | Payment Card Industry Data Security Standard                                                                 | PCI-DSS controls, encryption checks, access control, log retention, cardholder data checks, secure transport, audit trail validation, compliance report archiving | [PCI SSC](https://www.pcisecuritystandards.org/pci_security/) |
| `cusp`         | <span style="display:inline-block;width:12px;height:12px;background:#8A2BE2;border-radius:2px;margin-right:4px;"></span> Purple| Custom User Security Profile (Fedora-specific)                                                               | Custom controls, Fedora hardening, custom audit checks, SELinux/AppArmor status, kernel parameter checks, custom compliance scripts, Fedora-specific logging | [Fedora Security Guide](https://docs.fedoraproject.org/en-US/security-guide/) |
| `medium-high`  | <span style="display:inline-block;width:12px;height:12px;background:#FF8C00;border-radius:2px;margin-right:4px;"></span> Orange| FedRAMP Rev5 Medium/High (pre-release, forward compatible)                                                   | Enhanced controls, more frequent scan checks, stricter logging, pre-2025 requirements, advanced NIST controls, log integrity, incident response checks | [FedRAMP](https://www.fedramp.gov/) |
| <span style="color:#1e90ff;font-weight:bold;">`rev5`</span> | <span style="display:inline-block;width:12px;height:12px;background:#1e90ff;border-radius:2px;margin-right:4px;"></span> Blue (New) | <b>FedRAMP Rev5</b>, <b>new standard</b> – <i>not yet officially defined</i> (2025)                        | All medium-high checks, new NIST controls, advanced audit, real-time compliance logging, continuous monitoring, advanced incident detection, forward-compatible logging, compliance evidence collection | [FedRAMP](https://www.fedramp.gov/) |
| <span style="color:#ff8c00;font-weight:bold;">`fedramp20x`</span> | <span style="display:inline-block;width:12px;height:12px;background:#ff8c00;border-radius:2px;margin-right:4px;"></span> Orange (Future) | <b>FedRAMP 20x</b>, <b>May 2025 specification</b> – <b>future standard</b>                                 | All rev5 checks, forward compatibility, continuous monitoring, 2025+ requirements, automated compliance reporting, AI-driven anomaly detection, advanced log analytics, future-proof controls | [FedRAMP](https://www.fedramp.gov/) |
| <span style="color:#32cd32;font-weight:bold;">`truenorth`</span> | <span style="display:inline-block;width:12px;height:12px;background:#32cd32;border-radius:2px;margin-right:4px;"></span> Lime Green (Custom) | <b>Exceeds all standards</b>, <b>real-time monitoring</b>, 3FAO/3PAO, <b>not yet officially defined</b> | All fedramp20x checks, real-time monitoring, 3FAO/3PAO, custom controls, anomaly detection, reporting, AI-based compliance, live endpoint monitoring, advanced alerting, compliance dashboard, custom JSON validation | [Custom/Research](https://github.com/craft-fusion) |

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

## Collecting New Approved Standards

To keep your compliance up to date, you can add new or updated security standards as new OSCAL/SCAP profiles. When a new standard is approved by an official agency (such as NIST, BSI, PCI SSC, or Fedora), follow these steps:

1. **Obtain the Official Profile:**
   - Download the official OSCAL/SCAP profile or data from the agency's website.
   - Example sources:
     - [NIST OSCAL Catalog](https://pages.nist.gov/OSCAL/)
     - [BSI OSPP Profiles](https://www.bsi.bund.de/EN/Topics/Certification/ITProductsProtectionProfiles/itproductsprotectionprofiles_node.html)
     - [PCI SSC Documents](https://www.pcisecuritystandards.org/document_library)
     - [Fedora Security Guide](https://docs.fedoraproject.org/en-US/security-guide/)
2. **Add the Profile:**
   - Place the new profile file in your `oscal-profiles.json` or as a separate file in the `oscal-analysis/` directory.
   - Update your deployment and scan scripts to recognize and process the new profile.
3. **Document the Profile:**
   - Add a description and reference link in this documentation.
   - Update the compliance table to include the new profile, its color, and its key features.
4. **Run and Validate:**
   - Execute the scan using the new profile and review the results.
   - Archive the results and update logs as needed.

> **Tip:** Regularly check the official agency sites for updates or new standards.

---

## EU and US Compliance Placeholders and References

The following frameworks are included in our compliance tracking for awareness and future automation, even though no official SCAP/OSCAL profiles exist as of May 2025:

- **GDPR (General Data Protection Regulation)**: The EU’s primary privacy law for personal data protection. No official SCAP/OSCAL profile exists, but GDPR compliance is critical for any organization handling EU data. [Learn more](https://commission.europa.eu/law/law-topic/data-protection_en)
- **DORA (Digital Operational Resilience Act)**: EU regulation for ICT risk management and audits in the financial sector. Requires regular self-assessments and independent audits. [Learn more](https://finance.ec.europa.eu/regulation-and-supervision/financial-supervision/digital-operational-resilience-financial-sector-dora_en)
- **NIS2 (Network and Information Security Directive 2)**: EU directive for enhanced cybersecurity and incident reporting across essential sectors. Mandates regular risk assessments, audits, and security reviews. [Learn more](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive)
- **3PAO (Third Party Assessment Organization)**: US FedRAMP-accredited auditing for cloud service providers. Not a SCAP/OSCAL profile, but a key requirement for US federal cloud compliance. [Learn more](https://www.fedramp.gov/3pao/)
- **NIST SP 800-53**: US federal standard for security and privacy controls. Some SCAP/OSCAL mappings exist for these controls. [Learn more](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)

**Why are these included?**

- These frameworks are essential for organizations operating in the EU, US, or globally.
- They represent current and emerging best practices for privacy, cybersecurity, and audit.
- Including them as placeholders ensures your compliance roadmap is future-proof and ready for new automation or official profiles as they become available.
- They help you map and document manual controls, policies, and audits that go beyond technical SCAP/OSCAL scans.

**Note:**

- For GDPR, DORA, and NIS2, compliance is currently achieved through policies, documentation, and manual audits. Automated technical scanning is not yet possible.
- For 3PAO and NIST 800-53, use the referenced links for guidance and mapping to your existing controls.

---

## Cumulative Security Controls Present (as of May 26, 2025)

Below is a detailed, itemized list of all security controls implemented by the current set of profiles and scripts. Each category includes a subtotal, and a grand total is provided at the end.

### 1. OSCAL/SCAP Compliance Controls

- Baseline OSCAL/SCAP scan (standard)
- OSPP profile scan (ospp)
- PCI-DSS profile scan (pci-dss)
- Fedora CUSP profile scan (cusp)
- FedRAMP Medium/High profile scan (medium-high)
- FedRAMP Rev5 profile scan (rev5)
- Custom/forward-compatible profiles (fedramp20x, truenorth)
- XML report generation
- HTML report generation
- JSON report generation
- Markdown report generation
- PDF export (via Puppeteer)
- Profile-specific control checks
- JSON schema validation for custom profiles
- Evidence collection and automated compliance documentation
- Compliance report archiving
- Compliance dashboard output (advanced/future profiles)
- Real-time monitoring (advanced profiles)
- Anomaly detection and alerting (advanced profiles)
- AI-driven log analysis (custom/future profiles)
**Subtotal: 19 controls**

### 2. System Health & Hardening Controls

- Service status checks (nginx)
- Service status checks (PM2)
- Service status checks (Node.js)
- Service status checks (Go)
- Port checks (80)
- Port checks (443)
- Port checks (3000)
- Port checks (4000)
- File existence checks
- Directory existence checks
- File permissions checks
- Directory permissions checks
- Resource usage: CPU
- Resource usage: memory
- Resource usage: disk
- Resource usage: swap
- Network connectivity checks
- Endpoint health checks
- System uptime check
- System load check
- Open file limits check
- Process counts check
- User account checks
- User group checks
- SELinux status check (Fedora/CUSP)
- AppArmor status check (Fedora/CUSP)
- Kernel parameter checks
**Subtotal: 26 controls**

### 3. Compliance & Audit Controls

- Audit log presence check
- Audit log rotation check
- Audit log integrity check
- Log rotation (system)
- Log retention (system)
- Log rotation (application)
- Log retention (application)
- Timestamped logs in logs/ or oscal-analysis/
- Last modified date/time display for compliance reports
- Error and warning highlighting in logs
- Recommendations for remediation if checks fail
- Summary tables for each scan
- Detailed logs for each scan
**Subtotal: 13 controls**

### 4. Encryption & Access Control

- Encryption checks (PCI-DSS, FedRAMP)
- Access control validation
- User account validation
- Cardholder data checks (PCI-DSS)
- Secure transport (TLS/SSL) checks
**Subtotal: 5 controls**

### 5. Incident Response & Monitoring

- Incident response checks (FedRAMP, Rev5)
- Log integrity checks (advanced audit)
- Continuous monitoring (future profiles)
**Subtotal: 3 controls**

### 6. Reporting & Dashboard

- Color-coded output for quick status review
- Compliance dashboard output (advanced/future profiles)
- Error and warning highlighting in reports
- Recommendations for remediation in reports
**Subtotal: 4 controls**

---

### Grand Total: 70 security controls

This list is cumulative and reflects all controls present in the system as of May 26, 2025. For the most up-to-date list, review the latest scan results and script documentation.

---

For more details, see individual script headers and logs in `oscal-analysis/`.
