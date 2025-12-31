# Digital Ocean Deployment Notes

This doc captures Digital Ocean specific guidance. For the baseline deployment flow, see `documentation/SIMPLE-DEPLOYMENT.md`.

## Current droplet profile (verify)

- Fedora (exact version to confirm)
- 2 vCPU, 8 GB RAM
- Apache (httpd)
- PM2 for Node services
- Node.js 20
- Go 1.21+

## Firewall (Fedora firewalld)

```bash
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-service=https --permanent
sudo firewall-cmd --add-service=ssh --permanent
sudo firewall-cmd --reload
```

If you are not on Fedora, use the equivalent firewall tooling for your distro.

## TLS (Apache + certbot)

```bash
sudo dnf install certbot python3-certbot-apache
sudo certbot --apache -d jeffreysanford.us -d www.jeffreysanford.us
```

## Notes

- Deployment helper scripts referenced in older docs are not present in this repo.
- Keep this file aligned with `documentation/SIMPLE-DEPLOYMENT.md`.
- Apache is the primary public entrypoint; keep 3000/4000 internal and proxy through Apache.
- Confirm the active `DocumentRoot` path in the Apache vhost.
