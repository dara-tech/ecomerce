# E-Commerce Platform

Full-stack SaaS-style e-commerce system with a customer storefront, admin panel, and REST API.

## Stack

| Layer | Tech |
|-------|------|
| **API** | Node.js, Express 5, MongoDB, Mongoose |
| **Storefront** | Next.js 16, React, Tailwind CSS |
| **Admin** | Vite, React, shadcn/ui, Recharts |

## Features

- Product catalog, categories, brands, reviews, wishlists
- Cart, guest checkout, coupons, dynamic shipping, wallet payments
- Orders, inventory, warehouses, shipping methods
- Payments (Stripe, KHQR, COD, mock gateways)
- Returns / RMA, refunds
- Marketing (banners, popups, flash sales, email campaigns)
- CMS (pages, FAQs, blogs)
- Reports, dashboard analytics, notifications
- Admin security (2FA, sessions, audit logs)

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB running locally (or Atlas URI)

### 1. Backend

```bash
cd backend
cp .env.example .env   # edit values as needed
npm install
npm run seed:all       # demo data (optional)
npm run dev            # http://127.0.0.1:5001
```

### 2. Storefront

```bash
cd client-frontend
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

### 3. Admin panel

```bash
cd admin-frontend
npm install
npm run dev            # http://localhost:5173
```

Set `VITE_API_URL=http://127.0.0.1:5001/api` in admin if needed (see `src/lib/axios.ts`).

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@admin.com` | `password` |
| Customer | `customer@demo.com` | `password` |

Demo coupons: `WELCOME10`, `FLAT5`, `FREESHIP`

## Project structure

```
backend/           Express API + MongoDB models
client-frontend/   Next.js customer store
admin-frontend/    React admin dashboard
```

## API health

```bash
curl http://127.0.0.1:5001/api/health
```

## License

ISC
