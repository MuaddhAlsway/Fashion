# FASHION demo admin

Open `/admin`, read the demo notice, and choose **Enter demo admin**.
There is no password or secure authentication. Anyone with the URL can enter.
Do not expose this frontend as a production administration system.

## Routes

- `/admin`: actual content counts and session activity; restore original demo content.
- `/admin/products`: add, edit, view and remove catalog products, sizes, departments, brands, descriptions, gallery images and featured status.
- `/admin/categories`: add, edit and remove category cards and marketplace filter choices. Assign products in the product editor.
- `/admin/journal`: add, edit and remove stories, cover images, dates and categories.
- `/admin/content`: edit homepage hero/category/featured headings/campaign banner, About hero/brand purpose/CTA, and Contact introduction/business placeholders.
- `/admin/legal`: edit Privacy Policy and Terms & Conditions drafts.

The admin has its own layout. The public navbar/footer remain on public pages.
Unknown public URLs retain the public 404; unknown admin paths show the admin fallback.

## Persistence and preview

Changes are shared with the public pages in the same tab, and saved to this tab's
`sessionStorage` key `fashion-admin-content-v1` when storage is available. Reloads
in the same session restore the edits. Closing the tab normally ends the session;
browser session-restore features may retain it. Use **Restore original demo** to
reset the editable content explicitly. The demo entry flag is
`fashion-admin-demo-entry`.

This is not a backend, database, publication system or multi-user editor. Changes
do not update source files or other visitors. Use **View storefront** in the same
tab to preview saves. Storage failure is shown in the admin; in-memory edits remain
active until reload. Invalid saved content falls back to the original seed.

Images are selected from existing `src/assets` files, using Vite's local URL asset
imports. No image upload endpoint or external image hosting is added. Gallery
images require descriptive alt text and unique image assets per product.

Product IDs, category IDs and existing story slugs remain stable when editing.
Deleting a product leaves existing customer cart entries as snapshots. Deleting a
category removes its assignments but keeps its products. All destructive actions
ask for confirmation. The original 12-product catalog remains the reset seed.

Journal and legal bodies use `## Heading` lines and blank-line-separated paragraphs.
They are displayed as text, never executable HTML. Legal pages keep their existing
visible draft notice and unfinished business placeholders.

Some detailed public copy (About values/craftsmanship, form labels, carousel slides
2–3, footer and navigation text) remains in components; only the website blocks
listed above are currently editable. Layout and link destinations are unchanged.
Customer demo authentication, carts and checkout keep their existing behavior.

## Verification

- `npm run build`
- `npm run lint`
- `npm run verify:admin`

The integration script exercises source components and server rendering with test
storage. It checks editor behavior, validation, session reload, storefront updates,
route separation, empty states, storage errors, and CSS parsing. It is not a visual
browser or mobile-device audit. Existing lint warnings outside this feature may
still be reported.

## File map

New workspace pages:
`src/pages/admin/AdminLayout.tsx`, `AdminDashboard.tsx`, `AdminProducts.tsx`,
`AdminCategories.tsx`, `AdminJournal.tsx`, `AdminWebsite.tsx`, `AdminLegal.tsx`,
and `AdminNotFound.tsx`.

New reusable editors and layout helpers:
`src/components/admin/AssetPicker.tsx`, `ConfirmDialog.tsx`, `ProductEditor.tsx`,
and `src/components/legal/EditableLegalPage.tsx`.

New shared data layer:
`src/context/ContentContext.ts`, `ContentProvider.tsx`,
`src/data/assets.ts`, `content-types.ts`, `content-utils.ts`, `content-seed.ts`,
`products.ts`, and `legal-documents.ts`.

New styles and verification:
`src/styles/admin.css`, `scripts/verify-admin.cjs`, and this guide.
`package.json` adds the `verify:admin` command without adding dependencies.

Existing integration files updated:
`src/App.tsx`, `src/main.tsx`,
`src/pages/MarketplacePage.tsx`, `ProductDetailPage.tsx`, `JournalPage.tsx`,
`JournalStoryPage.tsx`, `ContactPage.tsx`, `PrivacyPolicyPage.tsx`, `TermsPage.tsx`,
`src/components/layout/Hero.tsx`, `CategorySection.tsx`, `FeaturedProducts.tsx`,
`BrandStory.tsx`, `src/components/about/AboutHero.tsx`, `BrandStory.tsx`,
`AboutCta.tsx`, and `src/components/journal/JournalCard.tsx`.

The existing public Navbar, Footer, HomePage composition, cart/auth contexts,
checkout/payment flow, and public page styles are not replaced.
