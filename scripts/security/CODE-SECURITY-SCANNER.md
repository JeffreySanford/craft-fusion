# Code Security Scanner (SAST & Dependency Audit)

This script (`code-security-scan.sh`) provides project-wide static application security testing (SAST), dependency vulnerability checks, and basic code metrics for the Craft Fusion monorepo.

## Features
- **Node.js/TypeScript SAST:** Runs [semgrep](https://semgrep.dev/) and ESLint for code pattern and lint checks.
- **Dependency Audit:** Runs `npm audit` for Node.js and `govulncheck` for Go modules.
- **Go SAST:** Uses [gosec](https://github.com/securego/gosec) for Go code security analysis.
- **Secret Scanning:** Uses [truffleHog](https://trufflehog.io/) to detect secrets in code.
- **File Length/Complexity:** Reports the longest code files as a basic complexity metric.
- **Vibrant, color-coded output** for easy review.
- **Modular:** Easy to extend or migrate to Go/Rust in the future.

## Usage
```bash
bash scripts/code-security-scan.sh [--full|--quick]
```
- `--quick` (default): Runs all available checks with default settings.
- `--full`: Reserved for future deep scans (e.g., full dependency trees, advanced SAST configs).

## Requirements
- [semgrep](https://semgrep.dev/docs/installation/)
- [ESLint](https://eslint.org/)
- [npm](https://nodejs.org/)
- [gosec](https://github.com/securego/gosec)
- [govulncheck](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck)
- [truffleHog](https://trufflehog.io/)

Install any missing tools as needed for your stack.

## Installation Instructions

To enable all features of the code security scanner, install the following tools:

### Node.js/TypeScript
- Install [semgrep](https://semgrep.dev/docs/installation/):
  ```bash
  npm install --save-dev semgrep
  # or globally:
  npm install -g semgrep
  ```
- Install [ESLint](https://eslint.org/) and any required plugins:
  ```bash
  npm install --save-dev eslint eslint-plugin-rxjs
  ```

### Go
- Install [gosec](https://github.com/securego/gosec):
  ```bash
  go install github.com/securego/gosec/v2/cmd/gosec@latest
  ```
- Install [govulncheck](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck):
  ```bash
  go install golang.org/x/vuln/cmd/govulncheck@latest
  ```

### Secret Scanning
- Install [truffleHog](https://trufflehog.io/):
  ```bash
  npm install --save-dev trufflehog
  # or globally:
  npm install -g trufflehog
  ```

### General
- Ensure [npm](https://nodejs.org/) is installed for dependency audits.

After installing, you can run the scanner script:
```bash
bash scripts/code-security-scan.sh
```

If you encounter missing tool errors, install the required tool and re-run the script.

## Output
- Color-coded summaries for each scan type.
- Top 10 longest code files (lines of code) for quick complexity review.

## Roadmap
- [ ] Add support for Python, Rust, and other languages as needed.
- [ ] Integrate with CI/CD for automated PR and deployment checks.
- [ ] Migrate to Go or Rust for performance and advanced reporting.
- [ ] Add advanced metrics (cyclomatic complexity, code duplication, etc).

## Example Output
```text
== Node.js/TypeScript SAST (semgrep, eslint) ==
✓ No critical issues found.
== Node.js Dependency Audit (npm audit) ==
✓ No known vulnerabilities.
== Go SAST & Dependency Check (gosec, govulncheck) ==
✓ No issues found.
== Secret Scanning (truffleHog) ==
✓ No secrets found.
== File Length/Complexity Checks ==
  1200 apps/craft-web/src/main.ts
  1100 libs/craft-library/src/index.ts
  ...
✓ Code security scan complete.
```

---

**Start with Bash, then migrate to Go or Rust for advanced features and speed.**

---

_Last updated: 2025-05-29_
