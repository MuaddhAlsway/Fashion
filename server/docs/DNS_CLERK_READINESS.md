# FASHION: MongoDB DNS and Clerk integration report

## Completed and verified

- Normal npm start connected to Atlas and listened on port 5000 with the explicit MONGODB_DNS_SERVERS shell configuration.
- npm run db:check passed: connected, URI-selected database, ping, transactions and writable primary.
- GET http://localhost:5000/api/health returned HTTP 200, status ok and database connected.
- GET /api/products returned the existing 12 products.
- npm run clerk:check passed: connected, customer collection available, unique Clerk ID index present. It explicitly returned signupVerificationPending:true because no new real account ID was supplied.
- Unsigned POST /api/webhooks/clerk returned 400. Unauthenticated GET /api/me returned 401.
- Server and client builds passed. All 31 backend tests passed, including shared environment/DNS configuration, failure stages and synthetic signed Clerk lifecycle tests.
- Client lint passed with the two existing Fast Refresh warnings in CartContext and DemoAuthContext. Vite still reports its existing large-chunk advisory.
- No real account was created or promoted. No Atlas seed, document mutation, collection creation or index change was performed during verification. Database writes in tests were confined to disposable local replica sets.

## Actual DNS cause

The previous clerk:check already read MONGODB_DNS_SERVERS; it was not ignoring a configured variable. Inspection of variable names found that MONGODB_DNS_SERVERS was absent from server/.env. Earlier successful commands supplied it only in their own PowerShell process. Those settings do not persist into another terminal. The affected system DNS path failed Atlas SRV lookup, whereas the explicit resolver configuration succeeded.

The fix removes separate configuration implementations: runtime and both diagnostics now load the same server file, apply inherited-variable precedence through one reader, parse Mongo settings through one parser, and build the same connection options. Node callback and promise resolvers are both configured before MongoDB connects. Diagnostic loading no longer changes global DNS as a side effect; connection setup owns that step.

DNS overrides remain optional and environment-based. Nothing hardcodes fallback resolvers in application code, rebuilds the Atlas URI, disables TLS or weakens Atlas IP restrictions. The real environment files were not modified. This machine still needs the ordinary DNS setting supplied in each shell, or privately persisted by the owner, until system DNS is repaired.

## Implementation changes

All paths below are relative to C:/Users/irahm/Downloads/multistore/.

- server/src/config/environment-source.ts: one explicit server/.env reader with inherited environment precedence; no value logging.
- server/src/config/mongodb-env.ts: shared Mongo parser/config loader; URI-only compatibility helper retained.
- server/src/config/env.ts: normal runtime uses the same reader and Mongo parser.
- server/src/config/database.ts: shared DNS and connection options, explicit URI database, bounded connection timeouts, autoCreate/autoIndex disabled, safe staged connection errors.
- server/src/config/mongodb-dns.ts: invalid resolver configuration has its own static configuration code.
- server/src/lib/mongodb-diagnostics.ts: distinguish configuration, DNS, connect, authentication and query stages without printing raw errors or URI values. Preserve specific failure hints instead of overwriting them at startup.
- server/src/server.ts: pass the complete Mongo config into connection setup. Remove automatic index creation from normal startup; explicit existing setup/seed owns index provisioning. No setup/seed was run against Atlas.
- server/src/services/mongodb-readiness.ts: diagnostics use shared connection settings.
- server/src/scripts/check-mongodb.ts: load full shared Mongo config, including DNS.
- server/src/scripts/check-clerk-sync.ts: use shared config/options, close failed connections, report query/connect failure stages safely.
- server/src/scripts/seed.ts and server/src/scripts/promote-admin.ts: pass the full existing config to shared connection setup. Neither command was run against Atlas.
- server/tests/mongodb-config.test.ts: regression tests for identical loader behavior, file/shell resolver settings, explicit blank settings, inherited precedence and classified stages.
- server/tests/mongodb-diagnostics.test.ts: expected stages updated for the improved classification.
- client/src/api/ApiRuntime.tsx: Clerk provider explicitly uses /login and /signup.
- client/src/pages/LoginPage.tsx and SignupPage.tsx: real Clerk widgets link to one another's existing local route and fall back to home after authentication.
- server/docs/DNS_CLERK_READINESS.md and this exported report: setup and verification results.

## Clerk behavior confirmed in source and synthetic tests

- Exact method/path: POST /api/webhooks/clerk. app.ts mounts it before JSON parsing and before customer/admin authentication. express.raw supplies the original JSON body to the official @clerk/express/webhooks verifyWebhook helper with CLERK_WEBHOOK_SIGNING_SECRET.
- Only signed events reach profile processing. Missing/invalid signatures fail closed. Receipt uniqueness and a transaction make retries idempotent; profile handling completes before HTTP 200.
- user.created and user.updated upsert by unique Clerk ID. New profiles get customer. Provider metadata and client input do not control roles. user.deleted follows the existing tombstone policy, clears name/email/avatar and prevents delayed events from restoring the account.
- MongoDB stores application profile fields and timestamps, never passwords or Clerk authentication credentials.
- Protected routes verify Clerk JWT/session state, require a verified primary email and use the MongoDB role for authorization.
- The existing verified-session fallback can also create a missing application profile using the same unique Clerk ID. It is not an unverified public signup endpoint and does not prove webhook delivery occurred. A real sync test must inspect Clerk delivery results as well as MongoDB.
- API-mode frontend mounts ClerkProvider with VITE_CLERK_PUBLISHABLE_KEY and renders real Clerk SignIn/SignUp widgets. Demo mode remains explicitly local.

Inspected existing files also include server/src/app.ts, server/src/routes/webhooks.ts, server/src/middleware/auth.ts, server/src/models/index.ts, server/src/routes/customer.ts, client/src/main.tsx, client/src/api/config.ts, App.tsx, package scripts, .gitignore and .env.example files. Existing webhook routes, role handling and customer model were preserved.

## Environment names and blockers

Present in server/.env: MONGODB_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET.
Missing in server/.env: MONGODB_DNS_SERVERS (ordinary optional configuration; necessary for the affected local resolver path unless supplied in the shell).

client/.env.local is absent, so the intended local client values are not configured there: VITE_DATA_SOURCE, VITE_API_BASE_URL, VITE_CLERK_PUBLISHABLE_KEY. No secret or publishable-key value was inspected, printed, moved or modified. Key-name presence does not establish that server credentials, client key and webhook secret belong to the same Clerk application/endpoint.

Not verified: real frontend signup, real frontend signin, external HTTPS delivery, actual signing-secret match, and new real account resulting in exactly one MongoDB profile. End-to-end authentication is not claimed.

## Exact remaining local steps

1. In one server PowerShell terminal, supply the supported ordinary configuration and run all checks there:

       cd C:\Users\irahm\Downloads\multistore\server
       $env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
       npm run db:check
       npm run clerk:check
       npm run dev

   Use resolvers approved for your network. That setting must be present in every separate terminal running a check. Alternatively, privately add the ordinary MONGODB_DNS_SERVERS setting to server/.env yourself; this task did not edit it. Stop an existing backend before starting another process on port 5000.
2. Privately configure client/.env.local, using your own public Clerk key from the same application:

       VITE_DATA_SOURCE=api
       VITE_API_BASE_URL=http://localhost:5000
       VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLIC_CLERK_KEY

   Do not put CLERK_SECRET_KEY, webhook secrets or MONGODB_URL in the client. Restart Vite with npm run dev from client/. Its usual URL is http://localhost:5173; the backend root at localhost:5000 is not the storefront.
3. Configure an HTTPS tunnel forwarding port 5000, e.g. ngrok http 5000, and keep it running. In Clerk Dashboard, update the existing webhook endpoint or add one if absent, using exactly:

       https://<your-actual-tunnel-host>/api/webhooks/clerk

   Subscribe to user.created, user.updated and user.deleted. Privately confirm this endpoint's signing secret matches the server variable; restart the backend after changes. No Dashboard changes or tunnel setup were performed by this task.
4. Register a test account yourself at the storefront /signup, verify its email and sign in through /login. Inspect the successful webhook delivery in Clerk Dashboard. Do not substitute the local demo signup or a fabricated sample delivery for this check.
5. In a second server terminal, set the same DNS configuration, privately supply the test account's Clerk ID and run:

       $env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
       $env:CLERK_VERIFY_USER_ID='<the-test-account-Clerk-ID>'
       npm run clerk:check

   Expect matchingActiveProfiles:1 and exactlyOneProfile:true. The script prints neither the ID nor personal fields. Retry the same delivery in Clerk and check again; the profile count must stay one. Clear the verification variable from the shell afterward.

Dashboard setup reference: https://clerk.com/docs/guides/development/webhooks/syncing
