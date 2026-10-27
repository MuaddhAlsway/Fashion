import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useContent } from './ContentContext'
import { WishlistContext } from './WishlistContext'
import '../styles/wishlist.css'

const STORAGE_KEY = 'fashion-wishlist'
type Snapshot = { ids: string[]; storageError: string; announcement: string }
function parseIds(raw: string | null): string[] {
  const parsed: unknown = raw ? JSON.parse(raw) : []
  if (!Array.isArray(parsed) || parsed.some(id => typeof id !== 'string' || !id.trim())) throw new Error('Invalid saved favorites')
  return [...new Set(parsed as string[])]
}
function readWishlist(): Snapshot {
  try { return { ids: parseIds(localStorage.getItem(STORAGE_KEY)), storageError: '', announcement: '' } }
  catch { return { ids: [], storageError: 'Saved favorites could not be loaded. New favorites still work for this visit.', announcement: '' } }
}

function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: { products } } = useContent()
  const [snapshot, setSnapshot] = useState<Snapshot>(readWishlist)
  const current = useRef(snapshot)
  const items = useMemo(() => snapshot.ids.flatMap(id => { const product = products.find(item => item.id === id); return product ? [product] : [] }), [products, snapshot.ids])

  function update(ids: string[], announcement: string) {
    let storageError = ''
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) }
    catch { storageError = 'Favorites are saved for this visit only because browser storage is unavailable.' }
    const next = { ids, storageError, announcement: `${announcement}${storageError ? ' Changes will not survive a refresh.' : ''}` }
    current.current = next
    setSnapshot(next)
  }

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      try {
        if (event.storageArea && event.storageArea !== localStorage) return
        const next = { ids: parseIds(event.key === null ? null : event.newValue), storageError: '', announcement: 'Favorites updated in another tab.' }
        current.current = next
        setSnapshot(next)
      } catch {
        const next = { ...current.current, storageError: 'Favorites changed in another tab but could not be read.' }
        current.current = next
        setSnapshot(next)
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  return <WishlistContext.Provider value={{
    items,
    itemCount: items.length,
    isSaved: id => snapshot.ids.includes(id),
    toggle(id) {
      const product = products.find(item => item.id === id)
      if (!product) return
      const saved = current.current.ids.includes(id)
      update(saved ? current.current.ids.filter(item => item !== id) : [...current.current.ids, id], `${product.name} ${saved ? 'removed from' : 'saved to'} your wishlist.`)
    },
    remove(id) { update(current.current.ids.filter(item => item !== id), `${products.find(item => item.id === id)?.name ?? 'Product'} removed from your wishlist.`) },
    storageError: snapshot.storageError,
  }}>
    {children}
    <p className="wishlist-sr-only" role="status" aria-live="polite" aria-atomic="true">{snapshot.announcement}</p>
  </WishlistContext.Provider>
}
export default WishlistProvider
