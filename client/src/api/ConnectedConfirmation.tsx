import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApi } from './ApiContext'
export default function ConnectedConfirmation() {
  const [params] = useSearchParams(), api = useApi(), id = params.get('order')
  const [order, setOrder] = useState<{ reference: string; status: string; paymentStatus: string; totalMinor: number; currency: string } | null>(null), [error, setError] = useState('')
  useEffect(() => { if (!id) return; let active = true; const refresh = () => { void api<{ data: NonNullable<typeof order> }>(`/api/me/orders/${encodeURIComponent(id)}`).then(result => { if (active) setOrder(result.data) }).catch(() => { if (active) setError('This order could not be loaded. Sign in with its owner account.') }) }; refresh(); const timer = setInterval(refresh, 5000); return () => { active = false; clearInterval(timer) } }, [api, id])
  return <main className="order-confirmation"><h1>{order?.paymentStatus === 'paid' ? 'Payment confirmed' : 'Order status'}</h1><p role="status">{error || (!id ? 'No order reference was provided.' : !order ? 'Checking your saved order…' : `${order.reference}: ${order.status}. Payment status: ${order.paymentStatus}.`)}</p>{order && <p>{(order.totalMinor / 100).toFixed(2)} {order.currency.toUpperCase()}</p>}<p>A redirect does not confirm payment. This page reads the server’s verified order state.</p><Link to="/account">Your account</Link><Link to="/marketplace">Continue shopping</Link></main>
}
