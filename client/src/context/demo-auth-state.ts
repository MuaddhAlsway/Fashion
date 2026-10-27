import { createContext } from 'react'
export type DemoUser = {
  name: string
  email: string
}

export type DemoAuthContextValue = {
  user: DemoUser | null
  signIn: (user: DemoUser) => void
  signOut: () => void
}

export const DemoAuthContext = createContext<DemoAuthContextValue | undefined>(
  undefined,
)

