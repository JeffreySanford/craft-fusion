# True North Insights: OSCAL Analysis Reports

Welcome to the OSCAL/FedRAMP compliance report directory for Craft Fusion.

## 📁 What You'll Find Here

- **oscal-results-<profile>.xml**: Raw OpenSCAP XML results for each profile.
- **oscal-report-<profile>.html**: Human-readable HTML report for each profile.
- **oscal-results-<profile>.json**: JSON version of the scan results.
- **oscal-results-<profile>.md**: **Vibrant, branded, detailed Markdown report** (see below).
- **user-readable-results-<profile>.xml/html**: Symlinks or copies for easy access.
- **truenorth-results.json**: Custom TrueNorth profile results (JSON).

## 🛡️ About the Markdown Reports

Each Markdown report includes:

- **Branding and summary**: At the top, a summary table and branding.
- **Infographics**: ASCII/Unicode bar charts for pass/fail/N/A.
- **Detailed control listing**: For every control tested, you get:
  - Control ID
  - Usage
  - Description
  - Pass/Fail/N/A (with emoji/color)
  - Time taken (if available)
  - Extra details (evidence, messages, etc.)

## 📊 How to Interpret

- **Passed**: 🟢 — Control is compliant.
- **Failed**: 🔴 — Control failed, needs remediation.
- **N/A**: 🟡 — Not applicable to this system.

## 📄 File Format Reference

- **XML**: Raw OpenSCAP output, best for automated tools.
- **HTML**: Human-friendly, view in browser.
- **JSON**: For programmatic analysis.
- **Markdown**: Best for sharing, reviewing, and archiving.

## 🌐 Profiles

Profiles are fetched from a remote source and listed at the top of each scan. Use the profile name as an argument to the scanner or scripts.

---

For more details, see the top of each Markdown report.
