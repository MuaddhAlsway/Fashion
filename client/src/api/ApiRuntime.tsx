import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react'
import { useMemo, type ReactNode } from 'react'
import { ApiContext } from './ApiContext'
import { createApi } from './client'
import { apiBaseUrl, clerkPublishableKey } from './config'
import { DemoAuthContext } from '../context/demo-auth-state'
export default function ApiRuntime({ children }: { children: ReactNode }) {
  if (!apiBaseUrl || !clerkPublishableKey) return <main><h1>API configuration required</h1><p>Set VITE_API_BASE_URL and VITE_CLERK_PUBLISHABLE_KEY in client/.env.local, then restart Vite. Server secrets must remain server-only.</p></main>
  return <ClerkProvider publishableKey={clerkPublishableKey} signInUrl="/login" signUpUrl="/signup"><Bridge>{children}</Bridge></ClerkProvider>
}
function Bridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth(), { user } = useUser(), clerk = useClerk()
  const api = useMemo(() => createApi(apiBaseUrl, () => getToken()), [getToken])
  if (!isLoaded) return <p role="status">Loading your session…</p>
  const profile = user ? { name: user.fullName || user.username || 'Customer', email: user.primaryEmailAddress?.emailAddress ?? '' } : null
  return <ApiContext.Provider value={api}><DemoAuthContext.Provider value={{ user: profile, signIn() { throw new Error('Use Clerk sign-in in connected mode.') }, signOut() { void clerk.signOut() } }}>{children}</DemoAuthContext.Provider></ApiContext.Provider>
}
