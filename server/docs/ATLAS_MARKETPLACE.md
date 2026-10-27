# Atlas startup and marketplace integration

The successful readiness/seed commands and server use the same server/.env loader path. The proven difference was resolver configuration: Node system SRV lookup returned ECONNREFUSED, while explicit resolvers returned three Atlas records. This is a DNS query failure, not proof that the database TCP listener refused connection. Both Node callback and promise resolver APIs need configuration on this runtime.

MONGODB_DNS_SERVERS now accepts comma-separated IPs. Blank uses system DNS. Normal startup and the Mongo-only diagnostic loader configure both resolver APIs. No URI reconstruction, TLS bypass, credentials hardcoding or Atlas network changes were made. The real .env was not edited.

On this machine, supply the supported ordinary configuration before starting from server/:

    $env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
    npm run build
    npm start

The compiled normal server entry point connected and listened on port 5000 using this setting. GET /api/health returned HTTP 200 and database connected. GET /api/products?limit=100 returned 12 records and pagination total 12. Read-only readiness reported all 12 seed products and all 23 expected indexes present. No live seed or customer/catalog document write was performed. Bare startup without the supported resolver setting remains dependent on system DNS; persist that ordinary setting privately or repair system DNS for repeated use.

Public catalog loading now defaults to the API independently of Clerk login. VITE_CATALOG_SOURCE=demo restores the existing session demo catalog. Full VITE_DATA_SOURCE=api still uses the existing authenticated integration. API products/categories enter shared content so marketplace, product details, favorites and search use the same records. Marketplace has loading, error/retry, empty states, explicit data-source labeling and preserved filters/search/sorting/counts. No silent marketplace fallback to mock products occurs on request failure.

Vite development proxies /api to localhost:5000 when there is no explicit API base. Production needs VITE_API_BASE_URL and matching backend CORS configuration, or a reverse proxy; the dev proxy is not production hosting configuration.

Both builds passed. Shopping checks passed, including loading/error/retry controls. The live API component harness rendered all 12 returned products with valid local image assets and confirmed department filtering and search. This is component verification, not full visual browser verification. Lint has only two existing fast-refresh warnings in CartContext and DemoAuthContext. Vite retains its large-chunk advisory. Backend tests passed (29 after the subsequent Clerk extension).

Changed files: server/src/config/env.ts, server/src/config/mongodb-dns.ts, server/src/config/mongodb-env.ts, server/src/server.ts, server/src/lib/mongodb-diagnostics.ts, server/tests/mongodb-dns.test.ts, server/.env.example, client/src/api/config.ts, client/src/context/ContentContext.ts, client/src/context/ContentProvider.tsx, client/src/pages/MarketplacePage.tsx, client/vite.config.ts, client/.env.example, client/scripts/verify-shopping.cjs, server/docs/ATLAS_MARKETPLACE.md.

Follow-up verification: npm start itself succeeded with the supported resolver setting; live health and 12-product responses were rechecked.
