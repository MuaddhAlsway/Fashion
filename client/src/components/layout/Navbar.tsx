import { useWishlist } from '../../context/WishlistContext'
import SearchDialog from '../search/SearchDialog'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Heart, Menu, ShoppingBag, UserRound, X } from 'lucide-react'
import '../../styles/Navbar.css'
import { useCart } from '../../context/CartContext'

const navigationItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Contact', to: '/contact' },
  { label: 'Journal', to: '/journal' },
]

function Navbar() {
  const { itemCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navigationId = useId()

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 0)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    window.addEventListener('pageshow', updateScrolled)
    return () => {
      window.removeEventListener('scroll', updateScrolled)
      window.removeEventListener('pageshow', updateScrolled)
    }
  }, [])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1001px)')
    const closeOnDesktop = () => { if (desktop.matches) setIsOpen(false) }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [isOpen])

  function closeMenu() { setIsOpen(false) }

  return (
    <header className="site-header" data-scrolled={isScrolled} data-has-wishlist={wishlistCount > 0} ref={headerRef} onKeyDown={(event) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        closeMenu()
        toggleRef.current?.focus()
      }
    }}>
      <Link className="site-header__brand" to="/" aria-label="FASHION home" onClick={closeMenu}>FASHION</Link>
      <button
        className="site-header__icon-button site-header__menu-toggle"
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls={navigationId}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav className="site-header__navigation" id={navigationId} aria-label="Main navigation" data-open={isOpen}>
        <ul className="site-header__links">
          {navigationItems.map(({ label, to }) => (
            <li key={to}><Link className="site-header__link" to={to} onClick={closeMenu}>{label}</Link></li>
          ))}
        </ul>
      </nav>
      <ul className="site-header__actions" aria-label="Store actions">
        {wishlistCount > 0 && <li><Link className="site-header__icon-button site-header__bag" to="/wishlist" aria-label={`Wishlist, ${wishlistCount} saved ${wishlistCount === 1 ? 'product' : 'products'}`} onClick={closeMenu}><Heart aria-hidden="true" /><span className="site-header__cart-count" aria-hidden="true">{wishlistCount}</span></Link></li>}

        <li><SearchDialog onOpen={closeMenu} /></li>
        <li><Link className="site-header__icon-button" to="/login" aria-label="Log in" onClick={closeMenu}><UserRound aria-hidden="true" /></Link></li>
        <li>
          <Link className="site-header__icon-button site-header__bag" to="/cart" aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} onClick={closeMenu}>
            <ShoppingBag aria-hidden="true" />
            <span className="site-header__cart-count" aria-hidden="true">{itemCount}</span>
          </Link>
        </li>
      </ul>
    </header>
  )
}

export default Navbar

