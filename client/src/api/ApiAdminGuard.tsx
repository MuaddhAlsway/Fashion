import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useUser } from '@clerk/react'
import { useApi } from './ApiContext'
export default function ApiAdminGuard({ children }: { children: ReactNode }) {
  const api = useApi(), { user } = useUser()
  const [checkedUser, setCheckedUser] = useState<string | undefined>(undefined)
  const [allowed, setAllowed] = useState(false), [error, setError] = useState('')
  useEffect(() => { let active = true; void api<{ data: { role: string } }>('/api/me').then(result => { if (!active) return; setCheckedUser(user?.id); setAllowed(result.data.role === 'admin'); setError(result.data.role === 'admin' ? '' : 'This account does not have admin access.') }).catch(() => { if (active) { setAllowed(false); setError('Sign in with an authorized admin account to continue.') } }); return () => { active = false } }, [api, user?.id])
  if (!allowed || checkedUser !== user?.id) return <main className="admin-gate"><div><h1>Studio access</h1><p role="status">{error || 'Checking your server permissions…'}</p><Link to="/login">Sign in</Link><Link to="/">Back to storefront</Link></div></main>
  return children
}
