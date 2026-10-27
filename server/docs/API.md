# API contracts and integration notes

All JSON success responses use {data}, list responses add pagination {total,page,limit,pages} where applicable; errors {error:{code,message},requestId}. Dates ISO, money stored integer minor units. Product/category id and post slug preserve frontend routes. Assets are exact approved filenames; GET /api/assets/:name serves them. Unknown fields rejected. Pagination page1..10000,limit1..100. CORS CLIENT_ORIGIN exact, Bearer session tokens for private APIs; cookies not accepted as a shortcut.

## Public
GET /api/health (readiness), /api/health/live (liveness)
GET /api/products?q=&department=all|women|men&brand=&category=&sort=featured|price-low|price-high&page=&limit=
GET /api/products/:id
GET /api/categories?page=&limit=
GET /api/journal?category=&page=&limit=; /api/journal/:slug
GET /api/site-content -> keyed blocks and versions map
GET /api/legal/privacy; /api/legal/terms
POST /api/newsletter/subscriptions {email,consent:true,noticeVersion:'newsletter-v1'} ->202 generic duplicate-safe request acknowledgement, no campaign email
POST /api/contact-submissions {name,email,subject,message} ->201 stored, not emailed

## Customer (verified Clerk Bearer token)
GET /api/me -> verified identity and server DB role
GET /api/me/cart; POST /api/me/cart/items {id,size,quantity} increments same id+size
PUT /api/me/cart/items/:id/:size {quantity}; DELETE same; DELETE /api/me/cart
GET /api/me/wishlist; PUT/DELETE /api/me/wishlist/items/:id
POST /api/me/shopping-state/import {items:[{id,size,quantity}],productIds:[id]} and Idempotency-Key16..100 safe characters; transaction/import ledger prevents duplicate guest merges
GET/POST /api/me/addresses (POST six DeliveryDetails fields); PUT/DELETE /api/me/addresses/:recordId
GET /api/me/orders?page=&limit=; GET /api/me/orders/:recordId
POST /api/me/orders {details:{fullName,phone,address,city,postalCode,country},paymentMethod:'card'|'apple-pay'|'mada'} with Idempotency-Key; snapshots/reprices verified account cart; retries return same order, changed request same key409
POST /api/me/orders/:recordId/cancel only awaiting-payment, no pending provider attempt; releases tracked stock once
POST /api/me/orders/:recordId/payment -> hosted Stripe Checkout URL only when checkout and webhook verification configured;503 otherwise

Account email is verified Clerk primary email, not arbitrary delivery input. Guest checkout is intentionally not implemented; guests may browse and retain a local bag, then explicitly import after sign-in. All record access uses ownerId, so other owners receive404, not personal data.

## Admin (role admin only; staff has own-customer permissions, no admin APIs)
GET/POST /api/admin/products; PUT/DELETE /api/admin/products/:id
GET/POST /api/admin/categories; PUT/DELETE /api/admin/categories/:id
GET/POST /api/admin/journal; PUT/DELETE /api/admin/journal/:slug
GET /api/admin/assets; GET /api/admin/site-content; PUT /api/admin/site-content/:key
GET/PUT /api/admin/legal/:key
GET /api/admin/newsletter-subscribers?q=&sort=newest|oldest|email-asc|email-desc&page=&limit= (subscriberCount and filtered total); DELETE /api/admin/newsletter-subscribers/:recordId
GET /api/admin/contact-submissions; GET /api/admin/orders
PUT /api/admin/orders/:recordId/status {status:'fulfilled'|'cancelled'} enforces transition
GET /api/admin/dashboard; GET /api/admin/activity
PUT /api/admin/products/:id/inventory {stockBySize:{M:5}}; explicit tracked available quantities, empty/unlisted size untracked, NOT inferred stock. No new physical stock figures seeded. Replacing map is an operator decision; reconcile active reservations before inventory adjustments.

All catalog/content/legal/inventory PUT and catalog DELETE require If-Match numeric version returned in DTO; missing428/stale409. POST creates; immutable product/category id and post slug. DTO recordId is MongoDB _id; version from __v. Full replace PUT only allowed form fields; price dollars converted to minor units, known asset filenames only. Site fields restricted to original key-specific shape. Deletions tombstoned; category delete atomically pulls product memberships. No live reset endpoint. Audit writes server-owned action/actor/entityId, never client roles/logs.

## Webhooks
POST /api/webhooks/clerk: public reachability, raw body, verified Svix headers/signing secret; unique receipt plus updates in transaction; role never taken from provider metadata; old updates ignored and deletion tombstoned.
POST /api/webhooks/stripe: raw body/signature, disabled503 without secret; never unsigned processing. Handles Checkout completed/async-payment-success/expired/async-payment-failed. Match order metadata/amount/currency and session, transition once, receipt queued transactionally. Duplicate event acknowledged without repeat side effects. Failure retries do not consume event receipt until transaction succeeds. Redirect never paid. Payment methods shown by hosted Stripe depend on merchant capabilities, not preference radio.

Payment starts set pending BEFORE provider call so cancellation can't race an uncertain API outcome. Retry uses stable order-specific provider idempotency key; after23h without session ID requires operator reconciliation rather than risking a duplicate session beyond provider dedupe window. Failed network request isn't proof of no payment. No automated refunds or paid cancellations; staff must use a separate reviewed reconciliation process. Unpaid drafts reserve tracked stock until cancelled or verified session expiry; abandoned-draft scheduling is a documented follow-up before high-volume live checkout.

## Email
Only verified paid orders queue receipts. EMAIL_ENABLED=false by default. Worker every15s, database lease, at most5 attempts, stable provider idempotency key, stops automatic sends after23h since first attempt. Verifies sender domain through Resend domains API before send (key must allow that read). Successful send means accepted by provider, not confirmed delivery/open. No campaigns/contact notifications/shipping emails. Failures log generic event without addresses/provider errors. No provider calls were performed during implementation.

## Explicit proposed fields and limitations
Server roles/customer IDs/address ownership, per-size stock map, order snapshots/statuses, consent metadata, audit/event/email/migration ledgers and concurrency versions are additions to frontend mock data. Approved business currency/shipping/tax not supplied; checkout disabled by default. Flat shipping and tax-on-subtotal rate are an initial explicit configuration model, not a claim to handle every jurisdiction/carrier. Shipping/tracking/refunds/publishing workflows and upload provider remain deferred. Legal drafts and sample reviews/charts/shipping prose are not approved business policy.
