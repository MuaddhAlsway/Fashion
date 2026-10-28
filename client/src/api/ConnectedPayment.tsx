import { useLocation, useSearchParams } from 'react-router'
import { useState, useRef } from 'react'
import { useUser } from '@clerk/react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'

type PaymentMethod = 'card' | 'apple-pay' | 'mada'

export default function ConnectedPayment() {
  const api = useApi()
  const { state } = useLocation()
  const { user } = useUser()
  const [params] = useSearchParams()
  const resumeId = params.get('order')
  const [hasOrder, setHasOrder] = useState(Boolean(resumeId))
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const key = useRef(crypto.randomUUID())
  const order = useRef<string | null>(resumeId)

  const details = state?.details

  return (
    <main className="payment-page">
      <h1>Secure payment</h1>
      {!user ? (
        <p><Link to="/login">Sign in with your verified account</Link> before placing an order.</p>
      ) : !details && !resumeId ? (
        <p><Link to="/checkout">Enter delivery details</Link> before continuing.</p>
      ) : (
        <>
          <p>Order totals are calculated on the server. Payment methods depend on the configured provider and region.</p>
          <fieldset className="payment-options" disabled={busy || hasOrder}>
            <legend className="visually-hidden">Choose a payment method</legend>
            {(['card', 'apple-pay', 'mada'] as PaymentMethod[]).map((value) => (
              <label className="payment-option" key={value}>
                <input
                  type="radio"
                  name="payment-method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                <span className="payment-option__content">
                  <strong>{value === 'card' ? 'Credit or debit card' : value === 'apple-pay' ? 'Apple Pay' : 'mada'}</strong>
                  <span>{value === 'card' ? 'Visa, Mastercard, and other supported cards' : value === 'apple-pay' ? 'Available on supported devices' : 'Saudi debit cards'}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            disabled={busy}
            className="payment-page__button"
            onClick={async () => {
              if (busy) return
              setBusy(true)
              setMessage('')
              try {
                if (!order.current) {
                  const created = await api<{ data: { recordId: string } }>('/api/me/orders', {
                    method: 'POST',
                    headers: { 'Idempotency-Key': key.current },
                    body: JSON.stringify({ details, paymentMethod: method }),
                  })
                  order.current = created.data.recordId
                  setHasOrder(true)
                }
                const result = await api<{ data: { url: string } }>(`/api/me/orders/${order.current}/payment`, { method: 'POST' })
                const destination = new URL(result.data.url)
                if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') throw new Error('Unexpected payment destination.')
                window.location.assign(destination.href)
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Checkout is unavailable. No payment was confirmed.')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Preparing checkout…' : 'Continue to hosted payment'}
          </button>
          <p role="status">{message}</p>
        </>
      )}
      <Link to="/checkout">Back to delivery</Link>
    </main>
  )
}
