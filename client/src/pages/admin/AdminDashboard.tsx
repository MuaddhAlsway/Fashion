import RecentActivity from '../../components/admin/RecentActivity'
import ConnectedDashboard from '../../api/ConnectedDashboard'
import { apiEnabled } from '../../api/config'
import { useState } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

function AdminDashboard() {
  return apiEnabled ? <ConnectedDashboard /> : <DemoAdminDashboard />
}
function DemoAdminDashboard() {
  const { data, reset } = useContent()
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The working edit</p><h1>Overview</h1><p>Your actual content, at a glance. No sales or order metrics are simulated.</p></div>{!apiEnabled && <button type="button" onClick={() => setConfirm(true)}>Restore original demo</button>}</header>
    {message && <p className="admin-success" role="status">{message}</p>}
    <div className="admin-stats">{[[data.products.length, 'Products', '/admin/products'], [data.journal.length, 'Journal posts', '/admin/journal'], [data.categories.length, 'Marketplace categories', '/admin/categories']].map(([count, title, to]) => <Link key={String(title)} to={String(to)}><span>{title}</span><strong>{count}</strong><span aria-hidden="true">↗</span></Link>)}<a href="#admin-activity"><span>Recent session changes</span><strong>{data.activity.length}</strong><span aria-hidden="true">↓</span></a></div>
    <div className="admin-overview-grid"><RecentActivity id="admin-activity" items={data.activity} session />
      <aside className="admin-panel"><h2>A local workspace</h2><p>Products, categories, journal stories, editable website blocks, and legal drafts share one frontend content store.</p><p>Session storage keeps edits across reloads in this tab when available. Closing the tab ends the demo session. Nothing is published, uploaded, or saved to a database.</p><Link to="/admin/products">Start with the catalog →</Link></aside></div>
    {confirm && <ConfirmDialog title="Restore original demo content?" confirmLabel="Restore originals" onCancel={() => setConfirm(false)} onConfirm={() => { try { reset(); setMessage('Original demo content restored.'); setConfirm(false) } catch (error) { setMessage(error instanceof Error ? error.message : 'Reset failed.') } }}><p>This replaces all product, category, journal, website and legal edits in this session. Customer cart and account data are not cleared.</p></ConfirmDialog>}
  </section>
}
export default AdminDashboard

