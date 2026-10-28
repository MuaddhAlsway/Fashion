# 🛍️ FASHION

Full-stack fashion storefront with an Express/TypeScript/MongoDB backend and a React/Vite frontend. Supports demo mode (local) and connected API mode (backend-backed) with Clerk authentication, customer accounts, cart, wishlist, checkout, and an admin CMS.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Backend](#backend)
- [Frontend](#frontend)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [Clerk Webhook](#clerk-webhook)
- [Admin Promotion](#admin-promotion)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

---

## 📖 Overview

FASHION is a monorepo containing:
- **Backend:** Node.js >= 22, Express 5, TypeScript, Mongoose, MongoDB Atlas
- **Frontend:** React 19, Vite 8, TypeScript, Clerk React
- **Auth:** Clerk (sessions, webhooks, role sync)
- **Payments:** Stripe (disabled until business approval)
- **Email:** Resend (disabled until verified sender)

## 🏗️ Architecture

```
┌─────────────┐     HTTPS      ┌─────────────────┐     MongoDB     ┌─────────────┐
│  Vercel     │ ──────────────►│  Render/Vercel  │ ──────────────►│  Atlas      │
│  (Client)   │   REST API     │  (Backend)      │   Mongoose     │  (Database) │
└─────────────┘                └─────────────────┘                └─────────────┘
       │                              │
       │ Clerk (auth)                 │ Clerk (webhooks)
       └──────────────────────────────┘
```

- Client uses `VITE_DATA_SOURCE=api` to call the backend.
- Backend verifies Clerk sessions and uses MongoDB roles for authorization.
- Webhooks sync Clerk user lifecycle to MongoDB `customers` collection.

## 📁 Repository Structure

```
multistore/
├── client/                    # React + Vite storefront
│   ├── src/
│   │   ├── api/               # API client, runtime, connected pages
│   │   ├── components/        # UI components
│   │   ├── context/           # Cart, wishlist, auth contexts
│   │   ├── data/              # Seed data, types, utils
│   │   ├── pages/             # Route pages
│   │   ├── styles/            # CSS
│   │   └── main.tsx           # Entry point
│   ├── .env.example
│   └── package.json
├── server/                    # Express + TypeScript backend
│   ├── src/
│   │   ├── app.ts             # Express app factory
│   │   ├── server.ts          # Server entry (local + Vercel)
│   │   ├── config/            # Env, DB, DNS
│   │   ├── lib/               # Utilities
│   │   ├── middleware/        # Auth, logging, errors
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── scripts/           # DB check, seed, promote-admin
│   │   ├── seed/              # Seed logic
│   │   └── services/          # Orders, payments, email
│   ├── tests/                 # 31 backend tests
│   ├── .env.example
│   └── package.json
└── README.md
```

## ✨ Features

### Storefront
- Home, marketplace, product detail, cart, wishlist
- Checkout, payment, order confirmation
- Account page with profile and order history
- Journal, about, contact, legal pages
- Search dialog, size guide, favorite button

### Admin (API mode)
- Dashboard with counts
- Products, categories, journal, site content, legal, mailing list
- Order list and status updates
- Newsletter subscriber management
- Asset picker from approved images

### ⚙️ Backend
- MongoDB Atlas connection with DNS diagnostics
- Safe seed (12 products, categories, journal, content, legal)
- Clerk webhook (create/update/delete profile sync)
- Protected routes with verified sessions
- Role-based access (customer/admin)
- Order management with stock reservation
- Payment initiation (Stripe, pending config)
- Email outbox (Resend, disabled by default)

## 📋 Prerequisites

- Node.js >= 22
- MongoDB Atlas cluster (or local replica set)
- Clerk application (for connected mode)
- Stripe account (optional, for payments)
- Resend account (optional, for email)

## ⚙️ Backend

### Setup
```powershell
cd server
npm ci --ignore-scripts
cp .env.example .env
# Edit .env with real values
```

### Commands
| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 5000) |
| `npm run build` | TypeScript build |
| `npm start` | Run built server |
| `npm test` | Run 31 backend tests |
| `npm run db:check` | MongoDB readiness (read-only) |
| `npm run clerk:check` | Clerk/MongoDB profile sync check |
| `npm run seed` | Seed reviewed content (operator only) |
| `npm run typecheck` | TypeScript type check |

## 🎨 Frontend

### Setup
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

### Commands
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run preview` | Preview build |

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | Yes | MongoDB connection string with DB name |
| `MONGODB_DNS_SERVERS` | No | DNS resolver IPs (e.g. `1.1.1.1,8.8.8.8`) |
| `PORT` | No | Server port (default 5000) |
| `NODE_ENV` | No | `development` / `test` / `production` |
| `CLIENT_ORIGIN` | Prod | Exact frontend origin |
| `CLERK_SECRET_KEY` | No | Clerk server key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | No | Clerk webhook secret |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |
| `RESEND_API_KEY` | No | Resend API key |
| `RESEND_FROM_EMAIL` | No | Verified sender email |
| `EMAIL_ENABLED` | No | Enable email (`true`/`false`) |
| `CHECKOUT_ENABLED` | No | Enable checkout (`true`/`false`) |
| `CURRENCY` | If checkout | 3-letter currency code |
| `SHIPPING_MINOR` | If checkout | Flat shipping in minor units |
| `TAX_BASIS_POINTS` | If checkout | Tax basis points (0-10000) |

### Client (`client/.env.local`)
| Variable | Required | Description |
|---|---|---|
| `VITE_DATA_SOURCE` | No | `demo` (default) or `api` |
| `VITE_API_BASE_URL` | If api | Backend URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | If api | Clerk publishable key |
| `VITE_CATALOG_SOURCE` | No | `api` (default) or `demo` |

## 🚀 Running Locally

### ⚙️ Backend
```powershell
cd server
$env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
npm run dev
```

### 🎨 Frontend
```powershell
cd client
npm run dev
```

Open `http://localhost:5173`. Backend runs on `http://localhost:5000`.

## 🧪 Testing

### ⚙️ Backend
```powershell
cd server
npm test
```
31 tests covering config, auth, webhooks, orders, payments, seed, and diagnostics.

### 🎨 Frontend
```powershell
cd client
npm run build
npm run lint
```

### MongoDB readiness
```powershell
cd server
$env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
npm run db:check
npm run db:check -- --catalog --indexes
```

## ☁️ Deployment

### ⚙️ Backend (Render recommended)
- **Root Directory:** `server`
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- **Health Check:** `/api/health/live`
- Set env vars in Render dashboard.

### 🎨 Frontend (Vercel)
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- Set `VITE_API_BASE_URL` to the backend URL.

### ⚙️ Backend (Vercel, optional)
- Root Directory: `server`
- Vercel auto-detects `src/server.ts`
- Set env vars in Vercel dashboard.
- Atlas must allow Vercel IPs (`0.0.0.0/0` for testing).

## 🔗 Clerk Webhook

Endpoint:
```
https://<backend-host>/api/webhooks/clerk
```

Subscribe to:
- `user.created`
- `user.updated`
- `user.deleted`

Confirm the signing secret matches `CLERK_WEBHOOK_SIGNING_SECRET`.

## 👑 Admin Promotion

Never promote without verification. Steps:
1. User signs up and verifies email.
2. Get Clerk user ID from Clerk Dashboard.
3. Run:
   ```powershell
   cd server
   $env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
   npm run admin:promote -- <clerk-user-id> <email> --confirm
   ```

## 🛠️ Troubleshooting

### MongoDB connection timeout on Vercel
- Use the standard (non-SRV) connection string.
- Set `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`.
- Ensure Atlas allows `0.0.0.0/0`.
- Confirm cluster is not paused.

### Client shows "Store content could not be loaded"
- Check `VITE_API_BASE_URL` points to the backend.
- Check backend `/api/health` returns `connected`.
- Check browser console for CORS errors.
- Ensure `CLIENT_ORIGIN` on backend matches the client URL.

### Checkout disabled
- Set `CHECKOUT_ENABLED=true` with `CURRENCY`, `SHIPPING_MINOR`, `TAX_BASIS_POINTS`.

### Admin access denied
- Account must be promoted via `npm run admin:promote`.

## 🔒 Security Notes

- Checkout disabled by default.
- Email disabled by default.
- No real accounts or admin promotions during setup.
- Admin promotion requires verified Clerk account.
- MongoDB connection, DNS, and seed behavior are tested.
- Server secrets never go in client variables.
- `.env` files are gitignored.
- Webhook signatures are verified.
- Roles are server-owned; client cannot escalate.
- No public admin bootstrap endpoint.

## 🔄 How It Flows

1. **Visitor** opens the storefront (Vercel/Render).
2. **Frontend** calls the backend REST API (`/api/products`, `/api/categories`, etc.).
3. **Backend** verifies the request, queries MongoDB Atlas, and returns JSON.
4. **Clerk** handles sign-in/sign-up and sends webhooks to `/api/webhooks/clerk`.
5. **Backend** syncs Clerk user events to the `customers` collection (role defaults to `customer`).
6. **Customer** checks out → order created on server → Stripe Checkout → webhook confirms payment.
7. **Admin** manages catalog, content, orders, subscribers, and contact inbox via `/admin`.

## 📄 License

Private project. All rights reserved.

---

## 👨‍💻 Developer

**E.Muaddh ALsway** — Full Stack Developer