# MongoDB/Atlas readiness audit — 27 October 2026

Scope: MongoDB only. No Clerk/Stripe/Resend integration changes, no frontend changes, no real .env values displayed/copied/modified. Actual Atlas database was not connected or seeded. Only variable names were inspected; MONGODB_URL is present. Build and tests use code/synthetic fixtures, never the private .env.

## Exact files inspected

- C:\Users\irahm\Downloads\multistore\server\src\config\database.ts — Mongoose connect/disconnect and health.
- C:\Users\irahm\Downloads\multistore\server\src\config\env.ts — explicit server/.env runtime loading, startup validation.
- C:\Users\irahm\Downloads\multistore\server\src\server.ts — connect/index/listen ordering, SIGINT/SIGTERM close, generic failure logging.
- C:\Users\irahm\Downloads\multistore\server\src\app.ts — readiness/liveness and DB availability guard.
- C:\Users\irahm\Downloads\multistore\server\src\models\index.ts — schemas, timestamps, strictness, indexes.
- C:\Users\irahm\Downloads\multistore\server\src\lib\validation.ts — API field allowlists and validation.
- C:\Users\irahm\Downloads\multistore\server\src\routes\admin.ts and customer.ts — relationship and owner usage.
- C:\Users\irahm\Downloads\multistore\server\src\services\orders.ts — transactional snapshot/stock writes.
- C:\Users\irahm\Downloads\multistore\server\src\seed\index.ts and src\scripts\seed.ts — original source validation, insert-only seed and migration marker.
- C:\Users\irahm\Downloads\multistore\server\tests\foundation.test.ts and integration.test.ts — existing health/seed/DB transaction tests.
- C:\Users\irahm\Downloads\multistore\server\package.json, README.md, docs\API.md, docs\AUDIT.md and .gitignore; project root C:\Users\irahm\Downloads\multistore\.gitignore.
- Completion report: C:\Users\irahm\Documents\Codex\2026-10-26\g\outputs\FASHION-current-completion-report.md.

## Findings and changes

1. Previous URI check accepted mongodb://host without /database, allowing MongoDB's default target. New src/config/mongo-uri.ts requires an explicit valid database path, validates with installed driver, rejects ambiguous/malformed targets without returning the failed URI. connectDatabase uses that exact decoded path as dbName. authSource remains separate authentication configuration; it does not change the intended application database. This confirms code selection, not the private URI's business intent: the user must privately verify the intended name.
2. Connection selection and connect timeout are10s. Automatic model collection/index creation is disabled on app connections; existing explicit ensureIndexes remains before HTTP listen. No index migration was executed against Atlas. Startup/seed errors remain generic, without raw database exceptions/credentials. Existing shutdown closes HTTP then Mongoose, bounded10s; local tests confirm Mongoose close/health, while actual deployment signal handling was source-reviewed.
3. Existing readiness used readyState only. GET /api/health now also issues bounded ping; disconnected/unreachable DB yields503; /api/health/live remains process liveness. No database name, host, URI, customer data or credentials in responses. Broader /api availability guard retains existing state-based behavior.
4. New src/services/mongodb-readiness.ts and src/scripts/check-mongodb.ts provide an isolated, non-writing diagnostic. It does not start Express, register models on its connection, create collections/indexes, invoke seeds, change documents or configure services. Optional index/catalog inspection reports only counts/booleans. Default-connection model metadata/source imports for optional checks remain disconnected in the CLI. An unseeded check is proven not to create collections/indexes in tests.
5. Existing unique indexes and timestamps match identity/ownership usage. Additional Mongoose document validators protect unique/nonempty product sizes/gallery, unique categories/cart product-size pairs/wishlist IDs and nonnegative integer order money. Order.items changed from unvalidated Mixed to an embedded schema matching existing snapshots exactly (id/name/brand/priceMinor/image/imageAlt/size/quantity/tracked). Empty snapshots rejected. Existing records were not rewritten or backfilled.
6. Root/server ignore rules exclude .env and .env.* while allowing .env.example. This directory is currently NOT a Git repository (git rev-parse fails); ignore patterns are present, but tracking/history cannot be audited until a Git repository exists. Do not infer that an already-tracked secret would be removed by ignore rules.

## Model/index and relationship review

All top-level schemas retain timestamps:true and strict:'throw'. Names below are Mongoose's actual default collection names. No separate inventory/variant collections are invented; stockBySize is on products.

|Model / collection|Unique constraints/indexes|Relationships and validation|
|---|---|---|
|Product / products|id unique; department+priceMinor; categoryIds; catalogOrder|Stable product slugs; positive integer price; enum department; image metadata; optional tracked stock; unique arrays; category references are strings|
|Category / categories|id unique|Department enum, required copy/image; tombstone deletion and transactional product membership cleanup|
|Customer / customers|clerkId unique|Role enum, identity timestamps, deletion marker; email not unique by design; no auth changes this stage|
|Cart / carts|ownerId unique|Owner is verified Clerk ID string, not Customer ObjectId; quantity positive integer<=99; unique product+size lines on document validation|
|Wishlist / wishlists|ownerId unique|Unique product slug list; atomic addToSet in existing API; unavailable products filtered|
|Address / addresses|ownerId index|Required embedded six delivery strings; owner queries enforce scope|
|Order / orders|ownerId index; ownerId+requestKey unique; reference unique; stripeSessionId unique sparse|Typed immutable item/delivery snapshots; integer money; status enums; snapshot references survive catalog edits/deletions|
|Activity / activities|createdAt descending|Required server actor/action/entity strings; no customer records exposed by diagnostic|
|Post / posts|slug unique, date descending|Sections/images, tombstone; API validates dates/body|
|SiteBlock / siteblocks|key unique|Mixed data intentionally retained; key/shape validation in existing API|
|LegalPage / legalpages|key unique privacy/terms|Required title/intro/body; API validates heading/paragraph body|
|Subscriber / subscribers|email unique; subscribedAt descending|Consent metadata; no subscriber seed/import or email change this stage|
|Contact / contacts|Default _id only|Required message fields; missing unpopulated collection is not a missing explicit index|
|WebhookEvent / webhookevents|provider+eventId unique|Existing receipt metadata only; no integration modifications|
|EmailJob / emailjobs|orderId unique|Existing outbox metadata only; no service modifications|
|Migration / migrations|key unique|Original seed marker and guest-import ledger coexist|

Important limitations: MongoDB has no automatic foreign keys here. Existing APIs check product/category membership and ownership; order snapshots deliberately need not refer to still-active products. API category-existence validation is outside its subsequent transaction, so concurrent category deletion/product assignment can still require a future relationship-concurrency review. Mongoose validators protect document saves and validated update paths, not arbitrary raw MongoDB writes; updateOne validators are not universally enabled. No server-side MongoDB collection JSON-schema validators or automatic integrity repairs were introduced. Mixed site content remains API-validated. These are documented limitations, not claims of database-enforced cross-collection integrity. Unique indexes enforce actual database uniqueness; unique:true is not a replacement for index installation.

## Read-only commands (run yourself with privately reviewed configuration)

From C:\Users\irahm\Downloads\multistore\server:

    npm run db:check
    npm run db:check -- --catalog --indexes

The first command validates URI target, connects through an isolated Mongoose connection, pings, inspects hello for primary/transaction-topology support, and closes. It outputs booleans only, not the URI/name/host. The second additionally reads product counts/source-ID presence/seed marker and inspects installed index definitions versus schemas; it never repairs them. Absent optional collections without declared indexes are not falsely treated as an index failure. No document values, emails, names or addresses are emitted. No writes are needed, although the Atlas user needs appropriate database read/list-index permissions for optional checks.

Exit0 means connection/ping and topology checks passed (plus indexes if requested); exit1 means failure or missing transaction/writable-primary/index prerequisites. Catalog count0 or a missing seed marker is diagnostic information, not permission to seed. Topology support detection is not a write/transaction-permission test. No database write is used to prove write permissions.

Runtime loads only MongoDB settings for this diagnostic; unrelated payment/email/identity configuration cannot block it. Invalid URI/auth/network/read-permission errors produce a generic checklist, not raw driver errors. The command is never invoked automatically by startup/install/test. It was not run against real .env during this audit.

## Seed review and safe intended-database procedure

Existing src/seed/index.ts validates exactly12 unique products plus actual frontend categories/posts/site/legal content/assets. It calls explicit ensureIndexes, then writes in a transaction: if migration frontend-original-v1 exists, no seed documents are changed; otherwise natural-key upserts use setOnInsert. Existing admin edits and _ids survive. Product/category/post deletes are tombstones, and seed marker prevents resurrection, including physical seed-record deletions. Removing marker is NOT an approved repair/reset. No users/orders/subscriber previews or credentials are seeded.

1. Privately verify the Atlas database user and URI path for intended database. Do not paste URI in terminal commands/history/chat; keep it in server/.env or deployment env. Verify whether injected MONGODB_URL overrides the file.
2. Run npm run db:check first, then optional catalog/index report. An unseeded database can report missing indexes; the diagnostic will not install them.
3. Review destination/backup/authorization and existing record counts. Only when explicitly ready to WRITE approved seed data, run npm run seed. This audit did NOT run that command against Atlas. Seed writes data and builds missing indexes, so it is not a read-only connectivity check.
4. Run npm run db:check -- --catalog --indexes again. Fresh seed expectation: totalProducts12, activeProducts12, originalSeedProductsPresent12, originalSeedProductsMissing0, originalSeedProductsDeleted0, seedMarkerPresent:true, missing indexes0. Admin-added or tombstoned products legitimately change active/total counts; distinct original-ID presence is reported separately to avoid misinterpreting them. Counts do not expose document contents.
5. Rerun seed only for reviewed original-v1 seed. Marker makes it a no-op rather than a catalog reset. Existing unit/integration tests verify stable IDs/admin edits/tombstones. Index conflicts/duplicate legacy records need reviewed migration; do not drop indexes/collections or clear data to force success.

## Remaining Atlas setup steps

Atlas was not verified: only .env key presence was inspected, and no real URI connection, seed, index creation or database change was attempted. Credentials, intended database value, IP access and deployment network remain unverified—not assumed missing.

- In Atlas Database Access, confirm a database user with username/password and permissions scoped to intended DB (separate from Atlas website login). For actual app/seed, approved write/index permissions are needed; a read-only diagnostic cannot prove them.
- Privately check MONGODB_URL has correct cluster URI, percent-encoded username/password where necessary, explicit /intendedDatabase path and correct authSource when applicable. No new separate DB-name env variable is required.
- In Network Access allow only your current public development IP/approved deployment egress. Do not broaden to0.0.0.0/0. IPs can change; update deliberately when needed.
- Ensure local/deployment DNS SRV resolution, outbound TLS access and cluster availability. Use Atlas-provided connection instructions; no TLS bypass or disabling certificate checks added.
- Run the read-only command above. On generic failure, inspect credentials/network privately; do not share the raw URI/error containing credentials.
- Once safe read-only checks pass and seed is explicitly approved, seed manually and verify counts. Transactions require replica-set/sharded topology; standalone local MongoDB is insufficient for current transaction-dependent seed/API writes.

## Files changed in this audit

src/config/mongo-uri.ts (new); src/config/mongodb-env.ts (new, diagnostic-only loader); src/config/database.ts; src/config/env.ts (Mongo validation only); src/app.ts (readiness only); src/models/index.ts (Mongo validation only); src/services/mongodb-readiness.ts (new); src/scripts/check-mongodb.ts (new); tests/mongodb.test.ts (new); tests/integration.test.ts (explicit named URI in the isolated Mongo fixture only); package.json (db:check/test:mongodb scripts); docs/MONGODB_READINESS.md (this report); README.md (Mongo-readiness link/commands).

No real .env, frontend, Clerk/Stripe/Resend routes/services, Cloudinary or Shippo files changed. No dependencies added.

## Verification results

- npm run build: passed.
- npm run typecheck: passed.
- npm run test:mongodb:7 passed,0 failed (URI selection, Mongo-only env fixture/precedence, Mongoose validators, read-only empty DB/index inspection, protected seed reruns/tombstones, ping-based health and connection close).
- npm test:23 passed,0 failed across the existing backend regressions plus Mongo-only tests. All database writes in tests were confined to disposable local fixture databases; no Atlas connection was made.
- Real Atlas command/seed/index setup: NOT run. Credentials/IP/target intent remain unverified. No production data, collections or access rules changed.

## Troubleshooting a generic mongodb_readiness_failed message

The checker now emits only safe code/stage/hint metadata, not raw exceptions, hosts, usernames, database names or URI values. Rerun npm run db:check to get the category; you may share its code/stage only. MONGODB_DATABASE_MISSING means the URI needs the intended /database path before query options (authSource alone does not select it). MONGODB_AUTH_FAILED means the server returned authentication failure; MONGODB_DNS_FAILED means resolver failure; MONGODB_TLS_FAILED means certificate/TLS failure; MONGODB_CONNECTION_BLOCKED means local network permissions; MONGODB_SERVER_SELECTION_TIMEOUT is broader and does not by itself prove an Atlas allowlist problem. Optional catalog/index errors identify their stage. The diagnostic still performs no writes; this change was tested using synthetic fixtures and did not test or change Atlas configuration.
