import { DemoAuthContext, type DemoUser } from './demo-auth-state'
import {
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'fashion-demo-user'

function readSavedUser(): DemoUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as DemoUser) : null
  } catch {
    return null
  }
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(readSavedUser)

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  function signIn(nextUser: DemoUser) {
    setUser(nextUser)
  }

  function signOut() {
    setUser(null)
  }

  return (
    <DemoAuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </DemoAuthContext.Provider>
  )
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)

  if (!context) {
    throw new Error('useDemoAuth must be used inside DemoAuthProvider')
  }

  return context
}