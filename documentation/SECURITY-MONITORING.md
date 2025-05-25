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

**References:**
- [OpenSCAP Documentation](https://www.open-scap.org/tools/openscap-base/)
- [SCAP Security Guide](https://github.com/ComplianceAsCode/content)
- [FedRAMP Baselines](https://www.fedramp.gov/documents/)
