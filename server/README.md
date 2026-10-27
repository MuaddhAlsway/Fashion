# FASHION backend — setup and operations

The existing foundation is extended, not replaced. See docs/AUDIT.md for observed/proposed fields and docs/API.md for routes and limitations. Node>=22, Express/TypeScript/Mongoose; Clerk authentication, Stripe Checkout/webhook handlers, Resend receipt outbox. Cloudinary/Shippo deliberately absent.

## Local commands

From C:\Users\irahm\Downloads\multistore\server:

    npm ci --ignore-scripts
    npm run typecheck
    npm run build
    npm test
    npm run seed
    npm run dev

Production build/start: npm run build then npm start. Seed and promotion are operator tooling using tsx/TypeScript dev dependencies. Transactions require a replica set (Atlas or a local replica set), not a standalone MongoDB instance. Start doesn't seed or promote anyone automatically. First test run downloads a MongoDB binary into ignored node_modules/.cache; integration tests launch a disposable loopback replica set, never the URI in .env. The binary download may take several minutes. Tests use project-local dbPath to avoid Windows sandbox temp-directory limitations. Existing real .env was not modified; values were never displayed or copied to client files. Runtime explicitly loads server/.env independent of shell cwd, with injected environment precedence.

## MongoDB Atlas prerequisites

- Create a database user with only the needed database permissions, separate from Atlas website login.
- Put its username/password in MONGODB_URL, percent-encoding URI-special characters as needed; use your intended database name, e.g. /fashion.
- Allow your current development IP under Atlas Network Access. Do not leave unrestricted 0.0.0.0/0 access enabled. Production egress needs its own approved access configuration.
- URI alone cannot verify credentials/network permissions. None were tested or changed here.
- No need to manually create every collection; model/index setup and first writes create them. Seed writes only reviewed original content. Wrong DB name would target the wrong data, so review privately before running.

## Environment layout

server/.env (private; don't overwrite with the example): MONGODB_URL required, PORT default5000, NODE_ENV defaultdevelopment, CLIENT_ORIGIN defaulthttp://localhost:5173 outside production/required production. Exact origin, no trailing slash. Optional CLERK_SECRET_KEY/CLERK_WEBHOOK_SIGNING_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY/RESEND_FROM_EMAIL. Missing service config doesn't prevent foundation startup; affected endpoints fail closed.

CHECKOUT_ENABLED=false default. To enable only after business approval, explicitly supply CURRENCY, SHIPPING_MINOR (nonnegative integer), TAX_BASIS_POINTS (integer0..10000). Flat shipping and tax-on-subtotal are initial proposed rules, NOT inferred from sample product text. Guest checkout not implemented; verified account required. Payment initiation requires verified webhook configuration, so Stripe is pending until that later stage; no request to add its secret now.

EMAIL_ENABLED=false default. When deliberately enabled, require RESEND_API_KEY and RESEND_FROM_EMAIL on verified domain. Worker checks domain through Resend API, requiring domain-read permission in addition to send permission. No test/provider emails were sent. Existing signup previews are never seeded as consented subscribers.

client/.env.local (create manually later, never copy server secrets):

    VITE_DATA_SOURCE=api
    VITE_API_BASE_URL=http://localhost:5000
    VITE_CLERK_PUBLISHABLE_KEY=<your public Clerk key>

Default frontend remains demo; api mode is opt-in. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not read by Vite. Its old entry in server/.env is ignored; no value was moved. VITE_* values are public. Restart Vite after changes. Configure allowed origins/redirects in Clerk separately. Live frontend auth/browser flows were not verified against your Clerk application.

## Safe seed

npm run seed reads exact current frontend products/content assets, preserves12 product IDs, separate image roles, string sizes,2 categories,6 stories,8 blocks,2 legal drafts. It never seeds users/passwords/admins/subscribers/contact/orders/reviews as real purchases. Insert-only upserts plus unique migration marker protect admin edits and prevent deleted content resurrection; deletions tombstone. Seed requires transactions/indexes. A new seed version must be a reviewed migration, not deleting the marker to reset live content. Existing local frontend edits need separate reviewed export if migration is desired.

## Admin promotion

Never reuse a password previously exposed in chat; rotate it wherever active. Authenticate with Clerk first, verify the intended account email, obtain its Clerk user ID privately. Then an authorized operator can run:

    npm run admin:promote -- user_REPLACE_WITH_VERIFIED_ID muaddhalsway@gmail.com --confirm

Script checks Clerk account exists, email is verified and last sign-in exists; grants server DB role admin transactionally and records audit. Repeat invocation no duplicate promotion. No public admin-bootstrap/password endpoint; source/email inputs never confer admin access. Only run for an account you control and intend to authorize. This script was NOT run against the real account. Staff has customer-owned access but cannot admin; further staff workflows are not silently invented.

## Health and verification

After running the server with valid DB settings:

    Invoke-RestMethod http://localhost:5000/api/health
    Invoke-RestMethod http://localhost:5000/api/health/live

Readiness200 connected/503 disconnected; liveness200 when process serves HTTP. Startup waits for MongoDB and indexes, bounded connect timeout, nonzero on failure without logging raw URI/provider errors. SIGINT/SIGTERM close HTTP/DB and worker. Tests verify synthetic environments, schemas/ownership/RBAC/seed/idempotency/stock/payment/signatures. External Atlas/Clerk/Stripe/Resend configuration remains unverified until controlled staging tests.

## Deployment/handoff

Serve the client asset folder alongside server or deploy its approved manifest/images at matching paths; no upload provider. Configure HTTPS, exact CORS origin, trusted proxy topology before changing trust proxy (currently disabled), provider webhook endpoints and secrets through deployment env, backups/retention and reviewed legal/business details. No deployment done. Payment reconciliation/refund workflows, abandoned unpaid-draft cleanup scheduler, shipment tracking, campaign unsubscribe/marketing automation and granular staff admin UI are follow-ups, not claimed live features. Do not enable live commerce until missing policies and staging checks are completed.

## MongoDB-only readiness audit

See docs/MONGODB_READINESS.md for the exact file/model/index review, safe read-only checker, URI database selection and Atlas setup steps.

    npm run db:check
    npm run db:check -- --catalog --indexes
    npm run test:mongodb

The checker never seeds or creates collections/indexes and prints no credentials/host/database name/personal data. It is NOT run automatically. Real Atlas verification remains pending. MONGODB_URL must include an explicit database path; automatic Mongoose model collection/index creation is disabled, while existing explicit startup/seed index setup remains unchanged. GET /api/health now confirms a bounded database ping. This audit did not seed Atlas or change any real configuration values.
