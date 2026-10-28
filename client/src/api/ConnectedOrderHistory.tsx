import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'
export default function ConnectedOrderHistory() {
  const api = useApi(), [orders, setOrders] = useState<{ recordId: string; reference: string; status: string; totalMinor: number; currency: string }[]>([]), [error, setError] = useState('')
  useEffect(() => { let active = true; void api<{ data: typeof orders }>('/api/me/orders').then(result => { if (active) setOrders(result.data) }).catch(() => { if (active) setError('Order history could not be loaded.') }); return () => { active = false } }, [api])
  return <section className="account-card"><h2>Your orders</h2>{error && <p role="alert">{error}</p>}{!orders.length && <p>No saved orders to display.</p>}<ul>{orders.map(order => <li key={order.recordId}><Link to={`/orders/${order.recordId}`}>{order.reference}</Link> — {order.status} — {(order.totalMinor / 100).toFixed(2)} {order.currency.toUpperCase()}</li>)}</ul></section>
}
