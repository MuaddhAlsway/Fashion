import { apiEnabled } from '../../api/config'
import { useCallback, useEffect, useState } from 'react'
import { useApi } from '../../api/ApiContext'

type Feedback = { recordId: string; productId: string; name: string; rating: number; comment: string; createdAt: string }

function AdminFeedback() {
  if (!apiEnabled) return <section><h1>Feedback</h1><p>Available in connected mode only.</p></section>
  return <ConnectedFeedback />
}

function ConnectedFeedback() {
  const api = useApi()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api<{ data: Feedback[] }>('/api/admin/feedback')
      setItems(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load feedback.')
    } finally {
      setLoading(false)
    }
  }, [api])

  async function remove(id: string) {
    try {
      await api(`/api/admin/feedback/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.recordId !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  useEffect(() => { void load() }, [load])

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Feedback / Connected</p>
          <h1>Customer feedback</h1>
          <p>Reviews submitted on product pages.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => void load()}>Refresh</button>
      </header>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading && <p role="status">Loading feedback…</p>}
      {!loading && !items.length && <p className="admin-empty">No feedback yet.</p>}
      {items.length > 0 && (
        <div className="admin-table-wrap" role="region" aria-label="Customer feedback" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Name</th>
                <th scope="col">Rating</th>
                <th scope="col">Comment</th>
                <th scope="col">Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.recordId}>
                  <td>{item.productId}</td>
                  <td>{item.name}</td>
                  <td>{'★'.repeat(item.rating)}</td>
                  <td>{item.comment}</td>
                  <td><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></td>
                  <td><button type="button" className="admin-text-danger" onClick={() => void remove(item.recordId)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AdminFeedback
