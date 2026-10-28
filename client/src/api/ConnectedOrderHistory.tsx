import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'

type Order = { recordId: string; reference: string; status: string; totalMinor: number; currency: string; createdAt?: string }

const statusLabel: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

export default function ConnectedOrderHistory() {
  const api = useApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void api<{ data: Order[] }>('/api/me/orders').then((result) => {
      if (active) { setOrders(result.data); setLoading(false) }
    }).catch(() => {
      if (active) { setError('Order history could not be loaded.'); setLoading(false) }
    })
    return () => { active = false }
  }, [api])

  return (
    <section className="account-card account-orders">
      <div className="account-card__heading">
        <h2>Your orders</h2>
        <span className="account-card__tag">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
      </div>
      {error && <p role="alert" className="account-orders__error">{error}</p>}
      {loading && <p role="status">Loading orders…</p>}
      {!loading && !error && !orders.length && (
        <div className="account-empty">
          <h3>No orders yet</h3>
          <p>Your placed orders will appear here.</p>
          <Link className="account-card__link" to="/marketplace">Explore the collection</Link>
        </div>
      )}
      {orders.length > 0 && (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.recordId} className="order-list__item">
              <Link to={`/orders/${order.recordId}`} className="order-list__link">
                <div className="order-list__main">
                  <strong>{order.reference}</strong>
                  <span className={`order-status order-status--${order.status}`}>{statusLabel[order.status] ?? order.status}</span>
                </div>
                <div className="order-list__meta">
                  <span>{(order.totalMinor / 100).toFixed(2)} {order.currency.toUpperCase()}</span>
                  {order.createdAt && <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
