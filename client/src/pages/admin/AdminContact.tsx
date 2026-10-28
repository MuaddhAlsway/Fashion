import { apiEnabled } from '../../api/config'
import { useCallback, useEffect, useState } from 'react'
import { useApi } from '../../api/ApiContext'

type ContactSubmission = { recordId: string; name: string; email: string; message: string; createdAt: string }

function AdminContact() {
  if (!apiEnabled) return <section><h1>Contact inbox</h1><p>Available in connected mode only.</p></section>
  return <ConnectedContactInbox />
}

function ConnectedContactInbox() {
  const api = useApi()
  const [items, setItems] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api<{ data: ContactSubmission[] }>('/api/admin/contact-submissions')
      setItems(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load contact submissions.')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Inbox / Connected</p>
          <h1>Contact submissions</h1>
          <p>Messages submitted from the contact form. Reply by email.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => void load()}>Refresh</button>
      </header>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading && <p role="status">Loading submissions…</p>}
      {!loading && !items.length && <p className="admin-empty">No contact submissions yet.</p>}
      {items.length > 0 && (
        <div className="admin-table-wrap" role="region" aria-label="Contact submissions" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Message</th>
                <th scope="col">Received</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.recordId}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.message}</td>
                  <td><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></td>
                  <td><a href={`mailto:${item.email}?subject=Re: Your message to FASHION`}>Reply</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AdminContact
