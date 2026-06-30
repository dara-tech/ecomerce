# Deploy Admin & Client on Vercel

Deploy **two separate Vercel projects** from the same GitHub repo ([dara-tech/ecomerce](https://github.com/dara-tech/ecomerce.git)).

Your API stays on the VPS:

```
http://107.175.91.211/ecomerce/api
```

Vercel sites are **HTTPS**. Browsers block HTTPS pages from calling **HTTP** APIs (mixed content).  
Both frontends use **Vercel rewrites** to proxy `/api/*` → your VPS, so the browser only talks to HTTPS.

---

## 1. Client storefront (Next.js)

### Vercel project settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `client-frontend` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | *(default)* |

### Environment variables

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `/api` | Relative URL — uses Vercel proxy in the browser |
| `BACKEND_PROXY_URL` | `http://107.175.91.211/ecomerce/api` | **Required** — absolute URL for SSR/build-time fetches |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Your Stripe publishable key |

### Steps

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **dara-tech/ecomerce**
3. Set **Root Directory** → `client-frontend`
4. Add env vars above
5. Deploy

Storefront URL example: `https://your-store.vercel.app`

---

## 2. Admin panel (Vite + React Router)

### Vercel project settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `admin-frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Environment variables

| Name | Value |
|------|-------|
| `VITE_API_URL` | `/api` |

`vercel.json` in `admin-frontend/` proxies `/api/*` to the VPS and routes all other paths to `index.html` (SPA).

### Steps

1. [vercel.com/new](https://vercel.com/new) → import same repo again
2. **Root Directory** → `admin-frontend`
3. Add `VITE_API_URL=/api`
4. Deploy

Admin URL example: `https://your-admin.vercel.app`

---

## 3. CLI alternative

```bash
# Install Vercel CLI
npm i -g vercel

# Client
cd client-frontend
vercel --prod
# Set root when prompted; add NEXT_PUBLIC_API_URL=/api

# Admin
cd ../admin-frontend
vercel --prod
# Add VITE_API_URL=/api
```

---

## 4. After deploy — verify

```bash
# Client health (via proxy)
curl https://YOUR-STORE.vercel.app/api/health

# Admin health (via proxy)
curl https://YOUR-ADMIN.vercel.app/api/health
```

Login on admin: `admin@admin.com` / `password`

---

## 5. Custom domains (optional)

In each Vercel project → **Settings → Domains**, add e.g.:

- `shop.yourdomain.com` → client project
- `admin.yourdomain.com` → admin project

No code changes needed if you keep `VITE_API_URL=/api` and `NEXT_PUBLIC_API_URL=/api`.

---

## 6. Later: HTTPS API on VPS (optional)

If you add a domain + SSL on the VPS (e.g. `https://api.yourdomain.com/ecomerce/api`), you can:

- Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/ecomerce/api` on client
- Set `VITE_API_URL=https://api.yourdomain.com/ecomerce/api` on admin
- Remove or keep rewrites as fallback

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API calls fail on Vercel | Ensure env is `/api`, not `http://107...` |
| Admin 404 on refresh | `vercel.json` SPA rewrite must be present |
| CORS errors | Backend uses open CORS; with `/api` proxy you should not see CORS |
| Mixed content blocked | Never use `http://107...` as `NEXT_PUBLIC_*` on Vercel |
| Build fails (admin) | Root Directory must be `admin-frontend`, not repo root |
