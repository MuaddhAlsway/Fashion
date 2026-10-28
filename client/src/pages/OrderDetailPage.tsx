import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApi } from '../api/ApiContext'
import { apiEnabled } from '../api/config'
import '../styles/order-detail.css'
import '../styles/order-detail.css'

type Order = {
  reference: string
  status: string
  paymentStatus: string
  totalMinor: number
  currency: string
  items: { id: string; name: string; brand: string; priceMinor: number; image: string; imageAlt: string; size: string; quantity: number }[]
  createdAt: string
}

const steps = ['awaiting_payment', 'paid', 'fulfilled']

export default function OrderDetailPage() {
  const api = useApi()
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !apiEnabled) return
    let active = true
    void api<{ data: Order }>(`/api/me/orders/${id}`).then((result) => {
      if (active) setOrder(result.data)
    }).catch(() => {
      if (active) setError('Order could not be loaded.')
    })
    return () => { active = false }
  }, [api, id])

  if (!apiEnabled) {
    return <main className="order-detail"><p>Order details are available in connected mode.</p></main>
  }

  if (error) {
    return <main className="order-detail"><p role="alert">{error}</p><Link to="/account">Back to account</Link></main>
  }

  if (!order) {
    return <main className="order-detail"><p role="status">Loading order…</p></main>
  }

  const cancelled = order.status === 'cancelled'
  const activeIndex = cancelled ? -1 : steps.indexOf(order.status === 'awaiting_payment' ? 'awaiting_payment' : order.status === 'paid' ? 'paid' : 'fulfilled')

  return (
    <main className="order-detail">
      <header className="order-detail__header">
        <p className="order-detail__eyebrow">ORDER DETAILS</p>
        <h1 className="order-detail__title">{order.reference}</h1>
        <p className="order-detail__status">Status: {order.status} · Payment: {order.paymentStatus}</p>
      </header>

      <section className="order-detail__timeline" aria-label="Order timeline">
        {cancelled ? (
          <p className="order-detail__cancelled">This order was cancelled.</p>
        ) : (
          <ol>
            {steps.map((step, index) => (
              <li key={step} className={index <= activeIndex ? 'is-complete' : ''}>
                <span>{step.replace('_', ' ')}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="order-detail__items">
        <h2>Items</h2>
        <ul>
          {order.items.map((item) => (
            <li key={`${item.id}-${item.size}`}>
              <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
              <div>
                <strong>{item.name}</strong>
                <span>{item.brand} · Size {item.size} · Qty {item.quantity}</span>
              </div>
              <span>${(item.priceMinor * item.quantity / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="order-detail__total">
          <span>Total</span>
          <strong>{(order.totalMinor / 100).toFixed(2)} {order.currency.toUpperCase()}</strong>
        </div>
      </section>

      <Link to="/account">Back to account</Link>
    </main>
  )
}
