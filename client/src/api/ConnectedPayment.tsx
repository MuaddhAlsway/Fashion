import { useLocation, useSearchParams } from 'react-router'
import { useState, useRef } from 'react'
import { useUser } from '@clerk/react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'
export default function ConnectedPayment() {
  const api = useApi(), { state } = useLocation(), { user } = useUser(), [params] = useSearchParams()
  const resumeId = params.get('order')
  const [hasOrder, setHasOrder] = useState(Boolean(resumeId))
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [method, setMethod] = useState('card')
  const key = useRef(crypto.randomUUID()), order = useRef<string | null>(resumeId)
  return <main className="payment-page"><h1>Secure payment</h1>{!user ? <p><Link to="/login">Sign in with your verified account</Link> before placing an order.</p> : !state?.details && !resumeId ? <p><Link to="/checkout">Enter delivery details</Link> before continuing.</p> : <><p>Order totals are calculated on the server. Payment methods depend on the configured provider and region.</p><label>Preferred payment method<select value={method} disabled={busy || hasOrder} onChange={event => setMethod(event.target.value)}><option value="card">Card</option><option value="apple-pay">Apple Pay</option><option value="mada">mada</option></select></label><button type="button" disabled={busy} className="payment-page__button" onClick={async () => {
    if (busy) return; setBusy(true); setMessage('')
    try {
      if (!order.current) { const created = await api<{ data: { recordId: string } }>('/api/me/orders', { method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({ details: state.details, paymentMethod: method }) }); order.current = created.data.recordId; setHasOrder(true) }
      const result = await api<{ data: { url: string } }>(`/api/me/orders/${order.current}/payment`, { method: 'POST' })
      const destination = new URL(result.data.url)
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') throw new Error('Unexpected payment destination.')
      window.location.assign(destination.href)
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Checkout is unavailable. No payment was confirmed.') }
    finally { setBusy(false) }
  }}>{busy ? 'Preparing checkout…' : 'Continue to hosted payment'}</button><p role="status">{message}</p></>}<Link to="/checkout">Back to delivery</Link></main>
}
