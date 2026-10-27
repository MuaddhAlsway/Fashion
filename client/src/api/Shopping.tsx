import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useUser } from '@clerk/react'
import { CartProvider } from '../context/CartContext'
import { CartContext, type CartItem, type CartProduct } from '../context/cart-state'
import { WishlistContext } from '../context/WishlistContext'
import WishlistProvider from '../context/WishlistProvider'
import type { StoreProduct } from '../data/content-types'
import { useApi } from './ApiContext'
const refreshEvent = 'fashion-api-shopping-refresh'
export function ConnectedCart({ children }: { children: ReactNode }) { const { user } = useUser(); return user ? <RemoteCart key={user.id}>{children}</RemoteCart> : <CartProvider>{children}</CartProvider> }
export function ConnectedWishlist({ children }: { children: ReactNode }) { const { user } = useUser(); return user ? <RemoteWishlist key={user.id}>{children}</RemoteWishlist> : <WishlistProvider>{children}</WishlistProvider> }
function RemoteCart({ children }: { children: ReactNode }) {
  const api = useApi(), [items, setItems] = useState<CartItem[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const chain = useRef(Promise.resolve())
  const load = useCallback(async () => { const result = await api<{ data: { items: (CartItem & { available: boolean })[] } }>('/api/me/cart'); setItems(result.data.items.filter(item => item.available)); setError(result.data.items.some(item => !item.available) ? 'Some saved products or sizes are unavailable. They cannot be checked out; remove them through your account cart API.' : ''); setLoading(false) }, [api])
  useEffect(() => { const refresh = () => { void load().catch(() => { setError('Your saved bag could not be loaded.'); setLoading(false) }) }; refresh(); window.addEventListener(refreshEvent, refresh); return () => window.removeEventListener(refreshEvent, refresh) }, [load])
  function mutate(path: string, method: string, body?: unknown) {
    const pending = chain.current.catch(() => {}).then(async () => { await api(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }); await load() })
    chain.current = pending
    return pending.catch(err => { setError(err instanceof Error ? err.message : 'Bag update failed'); throw err })
  }
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (loading) return <p role="status">Loading your saved bag…</p>
  return <CartContext.Provider value={{ items, subtotal, itemCount: items.reduce((n, item) => n + item.quantity, 0), addItem: (product: CartProduct) => mutate('/api/me/cart/items', 'POST', { id: product.id, size: product.size, quantity: 1 }), updateQuantity(id, size, quantity) { void mutate(`/api/me/cart/items/${encodeURIComponent(id)}/${encodeURIComponent(size)}`, 'PUT', { quantity }).catch(() => {}) }, removeItem(id, size) { void mutate(`/api/me/cart/items/${encodeURIComponent(id)}/${encodeURIComponent(size)}`, 'DELETE').catch(() => {}) }, clearCart() { void mutate('/api/me/cart', 'DELETE').catch(() => {}) } }}>
    {error && <p className="admin-error" role="alert">{error}<button type="button" onClick={() => { void load().catch(() => setError('Your bag could not be loaded.')) }}>Retry</button></p>}<ImportGuest onImported={load} />{children}
  </CartContext.Provider>
}
function ImportGuest({ onImported }: { onImported: () => Promise<void> }) {
  const api = useApi(), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [saved] = useState(() => { try { return { cart: localStorage.getItem('fashion-cart'), wishlist: localStorage.getItem('fashion-wishlist') } } catch { return { cart: null, wishlist: null } } })
  if (!saved.cart && !saved.wishlist) return null
  return <aside className="admin-panel"><p>Have a bag or favorites from your guest visit? Import them into this verified account.</p><button type="button" disabled={busy} onClick={async () => {
    if (busy) return; setBusy(true)
    try {
      const cart = JSON.parse(saved.cart ?? '[]') as { id: string; size: string; quantity: number }[], wishlist = JSON.parse(saved.wishlist ?? '[]') as string[]
      const body = JSON.stringify({ items: cart.map(({ id, size, quantity }) => ({ id, size, quantity })), productIds: wishlist })
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))
      const key = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
      await api('/api/me/shopping-state/import', { method: 'POST', headers: { 'Idempotency-Key': key }, body })
      if (localStorage.getItem('fashion-cart') === saved.cart) localStorage.removeItem('fashion-cart')
      if (localStorage.getItem('fashion-wishlist') === saved.wishlist) localStorage.removeItem('fashion-wishlist')
      setMessage('Guest bag and favorites imported.'); await onImported(); window.dispatchEvent(new Event(refreshEvent))
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Import failed; your guest data has been kept.') }
    finally { setBusy(false) }
  }}>Import guest bag &amp; favorites</button><p role="status">{message}</p></aside>
}
function RemoteWishlist({ children }: { children: ReactNode }) {
  const api = useApi(), [items, setItems] = useState<StoreProduct[]>([]), [error, setError] = useState('')
  const current = useRef<StoreProduct[]>([]), pending = useRef(new Set<string>())
  const load = useCallback(async () => { const result = await api<{ data: StoreProduct[] }>('/api/me/wishlist'); current.current = result.data; setItems(result.data) }, [api])
  useEffect(() => { const refresh = () => { void load().catch(() => setError('Favorites could not be loaded.')) }; refresh(); window.addEventListener(refreshEvent, refresh); return () => window.removeEventListener(refreshEvent, refresh) }, [load])
  // Fetch saved products from the shared content without duplicating the catalog.
  const { products } = useCatalog()
  function change(id: string, remove = false) {
    if (pending.current.has(id)) return
    const previous = current.current, saved = previous.some(item => item.id === id), product = products.find(item => item.id === id)
    const deleting = remove || saved
    if (!deleting && !product) return
    current.current = deleting ? previous.filter(item => item.id !== id) : [...previous, product!]; setItems(current.current); pending.current.add(id)
    void api(`/api/me/wishlist/items/${encodeURIComponent(id)}`, { method: deleting ? 'DELETE' : 'PUT' }).then(() => setError('')).catch(err => { current.current = deleting ? [...current.current.filter(item => item.id !== id), ...previous.filter(item => item.id === id)] : current.current.filter(item => item.id !== id); setItems(current.current); setError(err instanceof Error ? err.message : 'Favorite update failed') }).finally(() => pending.current.delete(id))
  }
  return <WishlistContext.Provider value={{ items, itemCount: items.length, isSaved: id => items.some(item => item.id === id), toggle: id => change(id), remove: id => change(id, true), storageError: error }}>{children}</WishlistContext.Provider>
}
import { useContent } from '../context/ContentContext'
function useCatalog() { return useContent().data }
