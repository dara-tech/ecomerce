# Backend deployment (VPS)

Production API runs on **107.175.91.211** via PM2 + nginx.

## URLs

| Endpoint | URL |
|----------|-----|
| Health (direct) | `http://107.175.91.211:5010/api/health` |
| Health (nginx) | `http://107.175.91.211/ecomerce/api/health` |
| API base (for frontends) | `http://107.175.91.211/ecomerce/api` |

> Port **5010** is used because **5001** is already used by another service on this VPS.

## Auto-deploy (GitHub Actions)

Pushes to `main` that change `backend/**` trigger `.github/workflows/deploy-backend.yml`.

### One-time: add GitHub repository secrets

In [GitHub → Settings → Secrets → Actions](https://github.com/dara-tech/ecomerce/settings/secrets/actions), add:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `107.175.91.211` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | Private SSH key (deploy key) — see below |

The deploy public key is already on the server in `/root/.ssh/authorized_keys`.

Generate a new deploy key pair locally if needed:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ecomerce-deploy -N "" -C "github-actions-ecomerce"
cat ~/.ssh/ecomerce-deploy.pub   # add to VPS authorized_keys
cat ~/.ssh/ecomerce-deploy       # paste into VPS_SSH_KEY secret
```

### Manual deploy on VPS

```bash
ssh root@107.175.91.211
bash /var/www/ecomerce/scripts/deploy-backend.sh
```

## Server layout

```
/var/www/ecomerce/          # git clone
/var/www/ecomerce/backend/  # Node app + .env
PM2 process: ecomerce-api
```

## Security checklist

- [ ] Change root password after first login
- [ ] Prefer SSH key login and disable password auth
- [ ] Rotate `JWT_SECRET` in `/var/www/ecomerce/backend/.env`
- [ ] Never commit `.env` files
