# Clerk customer synchronization

Exact endpoint: POST /api/webhooks/clerk.
Local URL: http://localhost:5000/api/webhooks/clerk.
Clerk URL: https://<actual-tunnel-host>/api/webhooks/clerk.

## Implementation and evidence

server/src/app.ts mounts the webhook router before express.json() and authenticated customer/admin middleware. server/src/routes/webhooks.ts uses express.raw for application/json and the official verifyWebhook helper from @clerk/express/webhooks, passing CLERK_WEBHOOK_SIGNING_SECRET explicitly. The installed helper accepts the raw Buffer. Requests without an Origin header are allowed by existing CORS; no user session is required.

Create/update/delete events are committed together with their unique event receipt in a MongoDB transaction. HTTP 200 is returned only after handling commits. Duplicate event IDs are acknowledged without duplicate changes. Customer.clerkId has a unique index, so distinct deliveries for one account cannot create duplicate profiles. Older updates are ignored.

New profiles receive the customer role. Provider metadata cannot grant or revoke privileges. Existing server-owned roles are preserved. Profile fields are Clerk ID, verified primary email, name, avatar URL, role, identity update timestamp, deletion timestamp and Mongoose creation/update timestamps. Passwords, tokens and provider metadata are never copied.

Deletion follows existing tombstone behavior: clear name/email/avatar, retain Clerk ID and role, mark deletedAt, prevent resurrection by delayed create/update events. Historical related records remain. This documents observed behavior, not a newly invented legal retention policy.

The existing authenticated fallback in server/src/middleware/auth.ts upserts using the same unique Clerk ID after verifying the Clerk session. It does not replace webhook delivery testing.

## Environment audit - names only

Present in server/.env: MONGODB_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET. Presence alone does not validate credentials or prove they match the Dashboard endpoint. server/src/config/env.ts explicitly loads server/.env, with injected environment taking precedence.

client/.env.local is absent. Configure these privately, then restart Vite:

    VITE_DATA_SOURCE=api
    VITE_API_BASE_URL=http://localhost:5000
    VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLIC_CLERK_KEY

client/src/api/config.ts reads these names. ApiRuntime.tsx mounts ClerkProvider in API mode; SignupPage.tsx renders Clerk SignUp in API mode and an explicitly labeled demo otherwise. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in a server file is not read by Vite. Never put backend secrets in the client. Root/server .gitignore exclude .env and .env.* except .env.example.

## Manual local setup

1. Start the backend from server/. On the affected local DNS path, set the supported ordinary setting before npm start:

       $env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
       npm run build
       npm start

   The real environment file was not modified. Use resolvers permitted by your network; blank/unset preserves system DNS. Keep TLS and restricted Atlas IP access enabled.
2. Confirm GET http://localhost:5000/api/health reports database connected.
3. Install/configure an HTTPS tunnel such as ngrok, then run ngrok http 5000. No tunnel was installed or opened during this task.
4. In the same Clerk application's Dashboard, open Webhooks, Add Endpoint (or update the existing endpoint). Set https://<actual-tunnel-host>/api/webhooks/clerk using your actual HTTPS forwarding host. Subscribe to user.created, user.updated and user.deleted. Do not use the frontend port or copy a different tutorial route.
5. Privately ensure this endpoint's signing secret matches CLERK_WEBHOOK_SIGNING_SECRET; restart the backend after changes. No real secrets were printed or modified.
6. Configure the client as above, restart Vite, register a new test account at /signup and check Clerk's delivery results. A Dashboard sample event alone is not a real frontend signup test.
7. Privately set the new account's Clerk ID in the shell and run the read-only check:

       $env:CLERK_VERIFY_USER_ID='<new-test-account-Clerk-ID>'
       npm run clerk:check

   Expect matchingActiveProfiles:1 and exactlyOneProfile:true. The check does not print the ID or profile fields. Clear that shell variable afterward. Retry the delivery in Clerk and repeat the check; it must remain one. Test update/deletion through Clerk. After deletion the active-profile check intentionally reports no active match.

Official setup reference: https://clerk.com/docs/guides/development/webhooks/syncing

## Results and limits

Backend build passed. All 29 backend tests passed, including signed create/update/delete, unsigned/tampered rejection, retries, distinct delivery IDs, exactly one synthetic customer, role-injection rejection, privileged-role preservation, stale events, invalid payloads, deletion before creation, no resurrection and raw-body verification. Writes were confined to disposable local test databases; Atlas was not seeded or mutated.

Live npm run clerk:check returned connected:true, customerCollectionAvailable:true, uniqueClerkId:true, signupVerificationPending:true. Real frontend signup, external HTTPS reachability, signing-secret matching and Dashboard deliveries remain unverified. No real account promotion was run.

Changed: server/src/routes/webhooks.ts, server/src/models/index.ts, server/tests/integration.test.ts, server/src/scripts/check-clerk-sync.ts, server/package.json, server/docs/CLERK_SYNC.md.

Inspected additionally: server/src/app.ts, server/src/config/env.ts, server/src/config/database.ts, server/src/config/mongodb-env.ts, server/src/middleware/auth.ts, server/src/routes/customer.ts, server/.env.example, root/server .gitignore, installed official verifier source, client/src/main.tsx, client/src/api/config.ts, client/src/api/ApiRuntime.tsx, client/src/pages/SignupPage.tsx and client/.env.example.

Normal npm start was also verified with the supported resolver setting. Live GET health reported database connected, GET products returned 12 records, and an unsigned POST to the existing Clerk route returned 400 without entering profile processing. External HTTPS reachability remains pending.
