# FASHION

Full-stack fashion storefront with an Express/TypeScript/MongoDB backend and a React/Vite frontend. Supports demo mode and connected API mode with Clerk authentication.

## Structure

```
multistore/
├── client/          # React + Vite storefront
├── server/          # Express + TypeScript + MongoDB backend
└── README.md
```

## Features

- Public catalog, categories, journal, site content, and legal pages
- Demo mode (local) and connected API mode (backend-backed)
- Clerk authentication (sign-in/sign-up, webhooks, role-based access)
- Customer accounts, cart, wishlist, addresses, orders
- Admin catalog/content/legal management
- Newsletter subscriptions and contact submissions
- MongoDB Atlas connection, readiness checks, and safe seed
- Stripe payment initiation (disabled until business approval)

## Prerequisites

- Node.js >= 22
- MongoDB Atlas (or local replica set)
- Clerk application (for connected mode)

## Backend Setup

```powershell
cd server
npm ci --ignore-scripts
cp .env.example .env
# Edit .env with real values (never commit)
```

Required:
- `MONGODB_URL` (include database name, e.g. `/fashion`)
- `MONGODB_DNS_SERVERS` (if your network requires it)
- `CLIENT_ORIGIN` (exact frontend origin)

Optional:
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `CHECKOUT_ENABLED`, `CURRENCY`, `SHIPPING_MINOR`, `TAX_BASIS_POINTS`

### Commands
```powershell
npm run dev          # start dev server (port 5000)
npm run build        # TypeScript build
npm start            # run built server
npm test             # run 31 backend tests
npm run db:check     # MongoDB readiness (read-only)
npm run clerk:check  # Clerk/MongoDB profile sync check
npm run seed         # seed reviewed content (operator only)
```

## Frontend Setup

```powershell
cd client
npm ci
```

Create `client/.env.local`:
```
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=<your Clerk publishable key>
```

```powershell
npm run dev   # http://localhost:5173
npm run build # production build
npm run lint  # lint
```

## Environment Notes

- Never put server secrets or `MONGODB_URL` in the client.
- `server/.env` is private and ignored by git.
- `client/.env.local` is private and ignored by git.
- Demo mode remains the default; connected mode is opt-in via `VITE_DATA_SOURCE=api`.

## Deployment

### Backend (Render recommended)
- Root Directory: `server`
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`
- Health Check: `/api/health/live`
- Set env vars in Render dashboard.

### Frontend (Vercel)
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set `VITE_API_BASE_URL` to the backend URL.

### Clerk Webhook
Endpoint:
```
https://<backend-host>/api/webhooks/clerk
```
Subscribe to `user.created`, `user.updated`, `user.deleted`.

## Testing

Backend:
```powershell
npm test
```

Frontend:
```powershell
npm run build
npm run lint
```

## Security Notes

- Checkout is disabled by default (`CHECKOUT_ENABLED=false`).
- Email is disabled by default (`EMAIL_ENABLED=false`).
- No real accounts or admin promotions were performed during setup.
- Admin promotion requires a verified Clerk account and explicit operator command.
- MongoDB connection, DNS, and seed behavior are covered by tests and diagnostics.
