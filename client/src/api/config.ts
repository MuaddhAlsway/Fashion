export const apiEnabled = import.meta.env.VITE_DATA_SOURCE === 'api'
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''

// Public browsing does not require Clerk.
export const catalogSource = import.meta.env.VITE_CATALOG_SOURCE === 'demo' ? 'demo' : 'api'
