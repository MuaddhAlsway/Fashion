import RecentActivity from '../components/admin/RecentActivity'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'
export default function ConnectedDashboard() {
  const api = useApi(), [counts, setCounts] = useState<Record<string, number> | null>(null), [activity, setActivity] = useState<{ recordId: string; action: string; entityId: string; createdAt: string }[]>([]), [error, setError] = useState('')
  useEffect(() => { let active = true; void Promise.all([api<{ data: Record<string, number> }>('/api/admin/dashboard'), api<{ data: typeof activity }>('/api/admin/activity?limit=10')]).then(([overview, log]) => { if (active) { setCounts(overview.data); setActivity(log.data) } }).catch(() => { if (active) setError('Dashboard could not be loaded.') }); return () => { active = false } }, [api])
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The working edit / Connected</p><h1>Overview</h1><p>Actual database content counts. No sales metrics are simulated.</p></div></header>{error && <p role="alert" className="admin-error">{error}</p>}{!counts && !error && <p role="status">Loading overview…</p>}{counts && <div className="admin-stats">{[['products', 'Products', '/admin/products'], ['categories', 'Categories', '/admin/categories'], ['journal', 'Journal', '/admin/journal'], ['activity', 'Admin changes', '#connected-activity']].map(([key, label, href]) => <Link key={key} to={href!}><span>{label}</span><strong>{counts[key!]}</strong></Link>)}</div>}<RecentActivity id="connected-activity" loading={!counts && !error} unavailable={!!error} items={activity.map(item => ({ id: item.recordId, message: `${item.action} / ${item.entityId}`, date: item.createdAt }))} /></section>
}

