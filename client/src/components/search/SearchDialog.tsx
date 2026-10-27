import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { matchesProduct } from '../../data/product-search'
import '../../styles/search.css'

function SearchDialog({ onOpen }: { onOpen?: () => void }) {
  const { data: { products } } = useContent()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const results = products.filter(product => matchesProduct(product, query))
  const shown = results.slice(0, 6)

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isOpen])

  function close() { dialog.current?.close() }
  function viewAll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams(location.pathname === '/marketplace' ? location.search : '')
    if (query.trim()) params.set('q', query.trim()); else params.delete('q')
    close()
    navigate(`/marketplace${params.size ? `?${params.toString()}` : ''}`)
  }

  const panel = <dialog className="product-search" ref={dialog} id={id} aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`} onClose={() => { setIsOpen(false); trigger.current?.focus() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
  }}>
    <header className="product-search__header"><div><p>FASHION / Find your next favorite</p><h2 id={`${id}-title`}>The search edit.</h2></div><button type="button" className="product-search__close" aria-label="Close product search" onClick={close}><X aria-hidden="true" /></button></header>
    <form role="search" aria-label="Search the product catalog" onSubmit={viewAll}>
      <label htmlFor={`${id}-query`}>Search products</label>
      <div className="product-search__input-row"><input id={`${id}-query`} ref={input} type="search" name="q" value={query} autoComplete="off" placeholder="Shirt, Studio Edit, women…" onChange={event => setQuery(event.target.value)} aria-describedby={`${id}-hint`} /><button type="submit">{query.trim() ? 'View all results' : 'View all products'} <span aria-hidden="true">↗</span></button></div>
    </form>
    <p className="product-search__hint" id={`${id}-hint`}>Search by product name, brand, or department. Use Tab to move through results and Enter to open a product.</p>
    <p className="product-search__count" role="status" aria-atomic="true">{query.trim() ? `${results.length} ${results.length === 1 ? 'product' : 'products'} found${results.length > shown.length ? `. Showing the first ${shown.length}.` : '.'}` : 'Explore the collection'}</p>
    {shown.length ? <ul className="product-search__results" aria-label="Product search results">{shown.map(product => <li key={product.id}><Link to={`/products/${product.id}`} onClick={close}><img src={product.image} alt={product.imageAlt} /><span><small>{product.brand} / {product.department}</small><strong>{product.name}</strong></span><span>${product.price.toFixed(2)}</span></Link></li>)}</ul> : <div className="product-search__empty"><h3>No matching pieces.</h3><p>Try another name, brand, or department.</p><button type="button" onClick={() => { setQuery(''); input.current?.focus() }}>Clear search</button></div>}
  </dialog>

  return <><button className="site-header__icon-button" type="button" ref={trigger} aria-label="Search products" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={id} onClick={() => { onOpen?.(); setQuery(location.pathname === '/marketplace' ? new URLSearchParams(location.search).get('q') ?? '' : ''); dialog.current?.showModal(); setIsOpen(true); input.current?.focus() }}><Search aria-hidden="true" /></button>{typeof document !== 'undefined' && createPortal(panel, document.body)}</>
}
export default SearchDialog
