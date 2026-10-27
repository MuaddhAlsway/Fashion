import { useRef } from 'react'
import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import '../styles/wishlist.css'

function WishlistPage() {
  const { items, itemCount, remove, storageError } = useWishlist()
  const heading = useRef<HTMLHeadingElement>(null)
  return <main className="wishlist-page">
    <header className="wishlist-page__header"><div><p className="wishlist-page__eyebrow">FASHION / Your personal edit</p><h1 ref={heading} tabIndex={-1}>Saved for <em>you.</em></h1><p>The pieces you want to come back to.</p></div><p className="wishlist-page__count" role="status">{itemCount} saved {itemCount === 1 ? 'piece' : 'pieces'}</p></header>
    {storageError && <p className="wishlist-page__notice" role="alert">{storageError}</p>}
    {items.length ? <section className="wishlist-grid" aria-label="Saved products">{items.map(product => <article className="wishlist-card" key={product.id}>
      <Link className="wishlist-card__product" to={`/products/${product.id}`} aria-label={`View ${product.name}`}><div className="wishlist-card__visual"><img src={product.image} alt={product.imageAlt} loading="lazy" /></div><p className="wishlist-card__brand">{product.brand}</p><h2>{product.name}</h2><p className="wishlist-card__price">${product.price.toFixed(2)}</p></Link>
      <button type="button" className="wishlist-card__remove" aria-label={`Remove ${product.name} from wishlist`} onClick={() => { remove(product.id); window.requestAnimationFrame(() => heading.current?.focus()) }}>Remove <span aria-hidden="true">×</span></button>
    </article>)}</section> : <section className="wishlist-empty"><Heart aria-hidden="true" /><h2>Your next favorite is out there.</h2><p>Tap the heart on a product to save it here. Your wishlist stays in this browser between visits when storage is available.</p><Link to="/marketplace">Explore the collection <span aria-hidden="true">↗</span></Link></section>}
  </main>
}
export default WishlistPage
