import { Link } from 'react-router'
function AdminNotFound() { return <section className="admin-panel"><p className="admin-eyebrow">Workspace / 404</p><h1>Admin page not found</h1><p>This section is not part of the demo workspace.</p><Link to="/admin">Back to overview →</Link></section> }
export default AdminNotFound
