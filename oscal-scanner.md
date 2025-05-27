# OSCAL Scanner: Supported Profiles, Download Links, and Setup

This document lists all supported OSCAL/SCAP profiles, provides download links for official content, and documents the process for (re)installing required content and tools. It also describes how to extend the `fedramp-minor.sh` script to fetch and use new profiles.

---

## Supported Profiles & Official Sources

| Profile      | Description/Source | Download/Reference |
|--------------|-------------------|--------------------|
| standard     | NIST Baseline Security | [NIST OSCAL](https://pages.nist.gov/OSCAL/) |
| pci-dss      | Payment Card Industry Data Security Standard | [PCI SSC Documents](https://www.pcisecuritystandards.org/document_library) |
| ospp         | Protection Profile for General Purpose Operating Systems | [BSI OSPP](https://www.bsi.bund.de/EN/Topics/Certification/ITProductsProtectionProfiles/itproductsprotectionprofiles_node.html) |
| cusp         | Custom User Security Profile (Fedora-specific) | [Fedora Security Guide](https://docs.fedoraproject.org/en-US/security-guide/) |
| medium-high  | FedRAMP Rev5 Medium/High (forward compatible) | [FedRAMP](https://www.fedramp.gov/) |
| rev5         | FedRAMP Rev5 (new standard, 2025) | [FedRAMP](https://www.fedramp.gov/) |
| fedramp20x   | FedRAMP 20x (future, May 2025 spec) | [FedRAMP](https://www.fedramp.gov/) |
| truenorth    | TrueNorth custom OSCAL profile (exceeds all standards) | [Custom/Research](https://github.com/craft-fusion) |

---

## Downloading and Installing Official Content

### Fedora/RedHat: Install SCAP Security Guide and OpenSCAP
```bash
sudo dnf install scap-security-guide openscap openscap-scanner
```

### Ubuntu/Debian: Install SCAP Security Guide and OpenSCAP
```bash
sudo apt-get install scap-security-guide openscap-utils
```

### Download/Update Official Content (Manual)
- NIST: https://pages.nist.gov/OSCAL/
- PCI: https://www.pcisecuritystandards.org/document_library
- BSI OSPP: https://www.bsi.bund.de/EN/Topics/Certification/ITProductsProtectionProfiles/itproductsprotectionprofiles_node.html
- Fedora: https://docs.fedoraproject.org/en-US/security-guide/
- FedRAMP: https://www.fedramp.gov/

Place downloaded XML/JSON/SCAP/OSCAL files in your `oscal-analysis/` or `oscal-profiles.json` as needed.

---

## Reinstall/Update Process

1. **Install/Update SCAP/OSCAL tools:**
   - Fedora: `sudo dnf install scap-security-guide openscap openscap-scanner`
   - Ubuntu: `sudo apt-get install scap-security-guide openscap-utils`
2. **Update Puppeteer (for PDF export):**
   - `npm install puppeteer`
3. **Fetch latest profiles:**
   - `curl -fsSL https://raw.githubusercontent.com/jeffreysanford/craft-fusion-profiles/main/oscal-profiles.json -o oscal-profiles.json`
4. **Run the scanner:**
   - `go run oscal-scanner.go`
5. **Export reports:**
   - `node tools/oscal-export.js`

---

## Extending fedramp-minor.sh to Fetch/Use New Profiles

- The script already fetches remote profiles from:
  `https://raw.githubusercontent.com/jeffreysanford/craft-fusion-profiles/main/oscal-profiles.json`
- To add new profiles:
  1. Add them to your remote or local `oscal-profiles.json`.
  2. Ensure the profile's content is downloaded and available in `oscal-analysis/`.
  3. The script will automatically include them in the scan loop if present in the profiles list.

---

## Troubleshooting
- If you see errors about missing SCAP content, ensure the correct XML files are present (e.g., `/usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml`).
- For Puppeteer errors, run `npm install puppeteer` in your project root.
- For new standards, check the official agency site for the latest content and update your profiles accordingly.

---

**For more details, see your `scripts/PRODUCTION-SCRIPTS.md` and `fedramp-minor.sh`.**
