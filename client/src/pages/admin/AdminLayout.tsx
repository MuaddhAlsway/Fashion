import { apiEnabled } from '../../api/config'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Menu, X } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import '../../styles/admin.css'

const links = [['/admin', 'Overview'], ['/admin/products', 'Products'], ['/admin/categories', 'Marketplace content'], ['/admin/journal', 'Journal'], ['/admin/content', 'Website content'], ['/admin/legal', 'Legal pages'], ['/admin/mailing-list', 'Mailing List']]
function readEntry() { if (apiEnabled) return true; try { return sessionStorage.getItem('fashion-admin-demo-entry') === 'yes' } catch { return false } }

function AdminLayout() {
  const [entered, setEntered] = useState(readEntry)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const { storageError } = useContent()
  const navigate = useNavigate()
  useEffect(() => {
    const query = window.matchMedia('(min-width: 901px)')
    const close = () => { if (query.matches) setMenuOpen(false) }
    query.addEventListener('change', close)
    return () => query.removeEventListener('change', close)
  }, [])
  if (!entered) return <main className="admin-gate"><div>
    <p className="admin-eyebrow">FASHION / Studio workspace</p><h1>The editor’s desk.</h1>
    <p>Manage the catalog and the stories around it.</p>
    <aside><strong>Frontend demo — not secure authentication</strong><p>Anyone with this URL can enter. No password or role checks are performed. Changes are stored only in this browser tab’s session and are not published to a server or other visitors.</p></aside>
    <button className="admin-primary" type="button" onClick={() => { try { sessionStorage.setItem('fashion-admin-demo-entry', 'yes') } catch { /* Entry still works without storage. */ } setEntered(true) }}>Enter demo admin →</button>
    <Link to="/">Return to storefront</Link>
  </div></main>
  return <div className="admin-shell" onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); toggle.current?.focus() } }}>
    <header className="admin-mobile-header"><Link to="/admin">FASHION / Studio</Link><button type="button" ref={toggle} aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></header>
    {menuOpen && <button type="button" className="admin-veil" aria-label="Close admin navigation" onClick={() => setMenuOpen(false)} />}
    <aside className="admin-sidebar" id="admin-sidebar" data-open={menuOpen}>
      <Link className="admin-brand" to="/admin" onClick={() => setMenuOpen(false)}>FASHION<span>Studio / {apiEnabled ? 'Connected admin' : 'Demo admin'}</span></Link>
      <nav aria-label="Admin navigation">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}</nav>
      <div className="admin-sidebar__end"><p>{apiEnabled ? 'Verified account. Server permissions. Persistent content.' : 'No backend. No secure access control. Session-only content.'}</p><Link to="/">View storefront ↗</Link><button type="button" onClick={() => { try { sessionStorage.removeItem('fashion-admin-demo-entry') } catch { /* No persistent gate. */ } setEntered(false); navigate('/') }}>Exit demo admin</button></div>
    </aside>
    <main className="admin-main" id="admin-main"><div className="admin-demo-notice">{apiEnabled ? 'CONNECTED WORKSPACE' : 'DEMO WORKSPACE'} <span>{apiEnabled ? 'Edits are saved through authorized server APIs.' : 'Edits affect this tab only. Original source files are unchanged.'}</span></div>{storageError && <p className="admin-error" role="alert">{storageError}</p>}<Outlet /></main>
  </div>
}
export default AdminLayout

