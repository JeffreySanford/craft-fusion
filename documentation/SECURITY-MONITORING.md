# SECURITY MONITORING

This project provides both real-time and scheduled security monitoring for compliance and operational assurance.

## Real-Time Monitoring: `fedramp-monitor.sh`

- **Location:** `scripts/fedramp-monitor.sh`
- **Purpose:** Continuously checks key technical FedRAMP controls (AC-2, CM-7) and verifies that a recent OpenSCAP (OSCAL) scan has been performed.
- **Log Output:** `/var/log/fedramp-monitor.log` (tail this file for live status)
- **OSCAL Reports:** All OpenSCAP results and HTML reports are stored in the root `oscal-analysis/` folder.
- **How to Run:**
  ```bash
  sudo bash scripts/fedramp-monitor.sh
  ```
- **What it checks:**
  - Unauthorized UID 0 accounts (AC-2)
  - World-writable files (CM-7)
  - Age and presence of the latest OpenSCAP scan results (OSCAL)
  - Location of the latest OSCAL report for review

## Scheduled Full Baseline Scans: `fedramp-oscal.sh`

- **Location:** `scripts/fedramp-oscal.sh`
- **Purpose:** Runs OpenSCAP (oscap) with the appropriate SCAP Security Guide profile for Fedora, generating results and HTML reports in `oscal-analysis/`.
- **How to Run (Standard Profile):**
  ```bash
  sudo bash scripts/fedramp-oscal.sh standard
  ```
- **How to Run (Other Profiles):**
  - `sudo bash scripts/fedramp-oscal.sh ospp` (for OSPP profile)
  - `sudo bash scripts/fedramp-oscal.sh pci-dss` (for PCI-DSS profile)
  - `sudo bash scripts/fedramp-oscal.sh cusp` (for CUSP profile)
- **Output:**
  - Results: `oscal-analysis/oscap-results.xml`
  - HTML Report: `oscal-analysis/oscap-report.html`

### Example Cron Job (Weekly Scan)

Add to root's crontab (`sudo crontab -e`):
```
0 3 * * 0 /usr/bin/bash /path/to/scripts/fedramp-oscal.sh standard
```

## OSCAL Data Storage
- The latest scan results and reports are stored in the root `oscal-analysis/` directory by default.
- You may wish to archive these to a more permanent location for compliance evidence.

## Extending Monitoring
- To add more real-time technical controls, expand `fedramp-monitor.sh`.
- For more comprehensive compliance, use OpenSCAP with the full SCAP Security Guide content.

---

# FedRAMP/OSCAL Compliance Scanning

## Overview
This project includes automated scripts for running OpenSCAP (oscap) compliance scans using multiple security profiles. These scans help ensure your Fedora server meets security baselines for FedRAMP, PCI-DSS, OSPP, and custom requirements.

## OSCAL Scan Profiles
- **standard**: Baseline security (recommended for most)
- **ospp**: Protection Profile for General Purpose Operating Systems
- **pci-dss**: Payment Card Industry Data Security Standard
- **cusp**: Custom User Security Profile (Fedora-specific)

## How to Run a Scan
Run any scan with:

```
sudo ./scripts/fedramp-oscal.sh [standard|ospp|pci-dss|cusp]
```

- Results are saved in `./oscal-analysis/oscap-results-<profile>.xml` and `oscap-report-<profile>.html`.
- The `memory-monitor.sh` and `fedramp-monitor.sh` scripts will show the status and summary of all available scans.

## Interpreting Results
- **Pass/Fail counts** are shown for each scan in the monitors.
- Review the HTML report for detailed findings and remediation guidance.

## Example Usage
```
sudo ./scripts/fedramp-oscal.sh standard
sudo ./scripts/fedramp-oscal.sh ospp
sudo ./scripts/fedramp-oscal.sh pci-dss
sudo ./scripts/fedramp-oscal.sh cusp
```

## Automation
- The `fedramp-monitor.sh` script will alert if a recent scan is missing and can be extended to auto-run scans if needed.
- The `deploy-all.sh` script can be configured to require a passing scan before deployment.

## Requirements
- `openscap`, `scap-security-guide`, and (optionally) `xmllint` for pass/fail summaries.

---

# System & Security Monitoring

- Use `memory-monitor.sh` for live system health, memory, and compliance status.
- Use `fedramp-monitor.sh` for compliance and security control checks.
- All scripts provide vibrant, colorized summaries and time estimates for each step.

---

# See Also
- [installation.md](installation.md)
- [deployment-digital-ocean.md](deployment-digital-ocean.md)
- [SECURITY-MONITORING.md](SECURITY-MONITORING.md)
- [PRODUCTION-SCRIPTS.md](PRODUCTION-SCRIPTS.md)
- [testing.md](testing.md)

---

**References:**
- [OpenSCAP Documentation](https://www.open-scap.org/tools/openscap-base/)
- [SCAP Security Guide](https://github.com/ComplianceAsCode/content)
- [FedRAMP Baselines](https://www.fedramp.gov/documents/)
