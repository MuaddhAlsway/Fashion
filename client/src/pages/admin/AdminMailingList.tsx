import ConnectedMailingList from '../../api/ConnectedMailingList'
import { apiEnabled } from '../../api/config'
import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { subscriberDemoApi, type DemoSubscriber } from '../../services/subscribers'

function AdminMailingList() {
  return apiEnabled ? <ConnectedMailingList /> : <DemoAdminMailingList />
}
function DemoAdminMailingList() {
  const [items, setItems] = useState<DemoSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [removing, setRemoving] = useState<DemoSubscriber | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const version = useRef(0)
  const load = useCallback(async () => {
    const request = ++version.current
    setLoading(true)
    setError('')
    try { const next = await subscriberDemoApi.list(); if (request === version.current) setItems(next) }
    catch { if (request === version.current) setError('The demo subscriber list could not be loaded. Please retry.') }
    finally { if (request === version.current) setLoading(false) }
  }, [])
  const invalidate = useCallback(() => { version.current++ }, [])
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void load() })
    const unsubscribe = subscriberDemoApi.subscribe(() => { void load() })
    return () => { active = false; invalidate(); unsubscribe() }
  }, [load, invalidate])
  async function remove() {
    if (!removing || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await subscriberDemoApi.remove(removing.id)
      setMessage('Subscriber removed from this tab’s demo list. No backend or mailing service was changed.')
      setRemoving(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Subscriber could not be removed. Please retry.'); setRemoving(null) }
    finally { busy.current = false; setPending(false) }
  }
  const visible = items.filter(item => item.email.includes(query.trim().toLowerCase())).sort((a, b) => {
    if (sort === 'email-asc') return a.email.localeCompare(b.email)
    if (sort === 'email-desc') return b.email.localeCompare(a.email)
    return sort === 'oldest' ? a.subscribedAt.localeCompare(b.subscribedAt) : b.subscribedAt.localeCompare(a.subscribedAt)
  })
  return <section>
    <header className="admin-page-header"><div><p className="admin-eyebrow">The audience edit / Frontend demo</p><h1>Mailing List</h1><p>Mock subscribers and guest signup previews from this tab. No emails are sent and no real subscriptions are created.</p></div><button type="button" disabled={loading || pending} onClick={() => { void load() }}>Refresh list</button></header>
    <div className="admin-panel"><h2>Subscriber preview</h2><p>Includes clearly labeled sample addresses. Guest submissions appear here until refresh. All changes exist only in memory; refreshing restores the mock list and discards guest addresses and removals.</p><p role="status">{loading ? 'Loading subscribers…' : `${items.length} demo ${items.length === 1 ? 'subscriber' : 'subscribers'} · ${visible.length} shown`}</p></div>
    {message && <p className="admin-success" role="status">{message}</p>}
    {error && <div className="admin-error" role="alert"><p>{error}</p><button type="button" disabled={loading || pending} onClick={() => { void load() }}>Retry loading list</button></div>}
    <div className="admin-form-grid admin-mailing-filters"><label>Search email<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search subscribers" /></label><label>Sort subscribers<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="email-asc">Email A–Z</option><option value="email-desc">Email Z–A</option></select></label></div>
    <div aria-busy={loading}>
      {!loading && !error && (visible.length ? <div className="admin-table-wrap" role="region" aria-label="Demo subscribers" tabIndex={0}><table className="admin-mailing-table"><caption className="admin-muted">Demo newsletter subscribers — not a live mailing list</caption><thead><tr><th scope="col">Email</th><th scope="col">Subscription date (demo)</th><th scope="col">Source</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td>{item.email}</td><td><time dateTime={item.subscribedAt}>{new Date(item.subscribedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time></td><td>{item.source === 'mock' ? 'Mock data' : 'Guest signup preview'}</td><td><button type="button" className="admin-text-danger" disabled={pending} aria-label={`Remove ${item.email}`} onClick={() => { setRemoving(item); setMessage('') }}>Remove</button></td></tr>)}</tbody></table></div> : <div className="admin-empty"><h2>{items.length ? 'No matching addresses.' : 'Your demo list is empty.'}</h2><p>{items.length ? 'Try another email search.' : 'Try the guest signup in the storefront footer to add a preview in this tab.'}</p>{query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}</div>)}
    </div>
    {removing && <ConfirmDialog title="Remove demo subscriber?" onCancel={() => { if (!busy.current) setRemoving(null) }} onConfirm={() => { void remove() }}><p>Remove {removing.email} from this tab’s preview list? No real subscription will be changed.</p>{pending && <p role="status">Removing…</p>}</ConfirmDialog>}
  </section>
}
export default AdminMailingList

