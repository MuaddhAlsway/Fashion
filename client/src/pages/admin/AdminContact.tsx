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
  const [replyTo, setReplyTo] = useState<ContactSubmission | null>(null)
  const [replyBody, setReplyBody] = useState('')

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

  function openReply(item: ContactSubmission) {
    setReplyTo(item)
    setReplyBody(`Hi ${item.name},\n\nThank you for contacting FASHION.\n\n`)
  }

  function sendReply() {
    if (!replyTo) return
    const subject = encodeURIComponent('Re: Your message to FASHION')
    const body = encodeURIComponent(replyBody)
    window.location.href = `mailto:${replyTo.email}?subject=${subject}&body=${body}`
    setReplyTo(null)
  }

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
                  <td><button type="button" onClick={() => openReply(item)}>Reply</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {replyTo && (
        <div className="admin-panel" style={{ marginTop: '1rem' }}>
          <h2>Reply to {replyTo.name}</h2>
          <p className="admin-muted">{replyTo.email}</p>
          <label>
            Message
            <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={6} style={{ width: '100%' }} />
          </label>
          <div className="admin-actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={sendReply}>Open email client to send</button>
            <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminContact

