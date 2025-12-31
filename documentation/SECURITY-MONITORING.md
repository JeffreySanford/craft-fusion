# Security Monitoring

This document describes the intended security monitoring approach. Some tooling referenced in earlier drafts does not exist in this repo yet and is tracked in `TODO.md`.

## Current state

- OSCAL profile data is stored in `oscal-profiles.json`.
- No automated scanning scripts are present in the repository.
- Security monitoring UI is planned for the Admin Security tab.

## Planned capabilities

- OSCAL scan orchestration and storage of results.
- SCA scanning for dependency risk.
- SBOM generation and evidence retention.
- Real-time test checks with clear pass/fail status.

## Manual checks (interim)

Use the backend health endpoints as a basic liveness check:

```bash
curl -X GET "http://localhost:3000/health"

curl -X GET "http://localhost:4000/health"
```

## References

- `documentation/AUTHENTICATION-SECURITY-ASSESSMENT.md`
- `documentation/design/security-tab.md`
- `documentation/INDEX.md`

## Verification status

- Reviewed after recent refactor crash: still accurate (no scripts present, UI planned).
- Last verified: 2025-12-30
