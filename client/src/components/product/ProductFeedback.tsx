import { assetUrl } from '../../api/client'
import { useEffect, useState } from 'react'
import { useApi } from '../../api/ApiContext'
import { apiEnabled } from '../../api/config'
import { useUser } from '@clerk/react'
import '../../styles/product-feedback.css'

type Feedback = { recordId: string; name: string; rating: number; comment: string; image?: string; createdAt: string }

export default function ProductFeedback({ productId }: { productId: string }) {
  const api = useApi()
  const { user } = useUser()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [image, setImage] = useState('')
  const [assets, setAssets] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    void api<{ data: Feedback[] }>(`/api/products/${productId}/feedback`, {}, false).then((result) => {
      if (active) { setItems(result.data); setLoading(false) }
    }).catch(() => { if (active) setLoading(false) })
    void api<{ data: string[] }>('/api/assets', {}, false).then((result) => {
      if (active) setAssets(result.data)
    }).catch(() => {})
    return () => { active = false }
  }, [api, productId])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!user) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await api<{ data: Feedback }>('/api/me/feedback', { method: 'POST', body: JSON.stringify({ productId, rating, comment, image }) })
      setItems((prev) => [result.data, ...prev])
      setComment('')
      setImage('')
      setRating(5)
      setMessage('Thank you for your feedback.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Feedback could not be submitted.')
    } finally {
      setSubmitting(false)
    }
  }

  const average = items.length ? items.reduce((sum, item) => sum + item.rating, 0) / items.length : 0

  return (
    <section className="product-feedback" id="customer-feedback" aria-labelledby="customer-feedback-title">
      <div className="product-feedback__header">
        <div>
          <p className="product-detail__eyebrow">Customer feedback</p>
          <h2 id="customer-feedback-title">What people are saying</h2>
        </div>
        {items.length > 0 && (
          <div className="product-feedback__summary">
            <strong>{average.toFixed(1)} / 5</strong>
            <span>Based on {items.length} review{items.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      {loading && <p role="status">Loading feedback…</p>}
      {!loading && !items.length && <p className="product-feedback__empty">No feedback yet. Be the first to review.</p>}

      {items.length > 0 && (
        <div className="product-feedback__list">
          {items.map((item) => (
            <article className="product-feedback__item" key={item.recordId}>
              <div className="product-feedback__meta">
                <strong>{item.name}</strong>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>
              </div>
              <div className="product-feedback__stars" aria-label={`${item.rating} out of 5 stars`}>
                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
              </div>
              {item.image && <img src={assetUrl(item.image)} alt="Feedback attachment" loading="lazy" decoding="async" className="product-feedback__image" />}
              <p>{item.comment}</p>
            </article>
          ))}
        </div>
      )}

      {apiEnabled && user && (
        <form className="product-feedback__form" onSubmit={submit}>
          <h3>Leave feedback</h3>
          <label>
            Rating
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>
              ))}
            </select>
          </label>
          <label>
            Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4} />
          </label>
          {assets.length > 0 && (
            <label>
              Attach an image (optional)
              <select value={image} onChange={(e) => setImage(e.target.value)}>
                <option value="">No image</option>
                {assets.map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" disabled={submitting || !comment.trim()}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
          {message && <p role="status">{message}</p>}
        </form>
      )}

      {apiEnabled && !user && (
        <p className="product-feedback__signin">
          <a href="/login">Sign in</a> to leave feedback.
        </p>
      )}
    </section>
  )
}

