# Backend expansion audit

The existing Express foundation in src/app.ts, src/server.ts, src/config/env.ts, src/config/database.ts and tests/foundation.test.ts is retained. Root/server ignore files already exclude .env/.env.* except examples. Configured key names were inspected only, never printed values or copied them. No real external database/provider calls were made during development.

Source of truth: client/src/data/content-types.ts, products.ts, content-seed.ts, journal.ts, legal-documents.ts; client/src/components/admin/ProductEditor.tsx; client/src/pages/admin/Admin{Products,Categories,Journal,Website,Legal,MailingList,Dashboard}.tsx; client/src/context/{CartContext,WishlistProvider,DemoAuthContext,ContentProvider}.tsx; CheckoutPage.tsx/PaymentPage.tsx/ContactPage.tsx.

Observed: 12 products, 2 categories, 6 posts, 8 site blocks, 2 legal drafts, guest cart/wishlist, six delivery strings, three selected payment methods. Existing admin is local demo. Only 4 foundation env settings originally consumed. No verified identity, database models, API consumers, actual payments or email.

Additions/proposals: server customer roles, address ownership, immutable orders, payment state, finite optional per-size inventory, consent metadata, webhook receipts, audit records, email outbox, migration marker and concurrency versions. Existing product sizes are NOT stock. Missing currency/shipping/tax business rules mean CHECKOUT_ENABLED remains false by default. Empty stock map means untracked sizes; explicit inventory settings are available to authorized admins only. Existing sample shipping/returns/reviews remain samples, not backend policy.

Use stable string product/category IDs in references (alongside internal MongoDB _id) to preserve frontend routes; API version fields support If-Match. Prices stored integer minor units. Image fields store approved exact local filenames, no Cloudinary/Shippo. Site/legal preserve existing fields. Category deletion removes memberships; catalog deletions are tombstones. Versioned insert-only seed never overwrites admin edits or resurrects deletes; only original content is seeded, never fake subscribers/users/orders/passwords.

All private APIs use verified Clerk bearer session tokens, live session/user checks and server DB roles. Staff cannot use admin APIs. Test auth injection is restricted to NODE_ENV=test. Existing frontend demo flags/passwords provide no API access.

Live service verification needs environment/deployment configuration. Stripe webhook secret is not requested in this stage and missing verification fails closed503. Payment initiation also stays unavailable until signature-verified event processing can be configured. Real email requires explicit opt-in and a sender domain verified through Resend; no subscriber campaigns are implemented. Clerk/Stripe signature verification can be tested with synthetic local signatures without calling providers.
