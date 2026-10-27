import FavoriteButton from '../components/product/FavoriteButton'
import { matchesProduct } from '../data/product-search'
import '../styles/search.css'
import { useContent } from '../context/ContentContext'
import { slugify } from '../data/content-utils'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import '../styles/marketplace.css'


function MarketplacePage() {
  const { data: { products: catalogProducts, categories }, catalogStatus = 'ready', catalogSource = 'api', retryCatalog } = useContent()
  const products = useMemo(() => catalogStatus === 'ready' ? catalogProducts : [], [catalogStatus, catalogProducts])
  const brands = [...new Set(products.map(product => product.brand))]

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const requestedCategory = searchParams.get('category')
  const category = categories.some(item => item.id === requestedCategory) ? requestedCategory! : 'all'
  const requestedDepartment = searchParams.get('department')
  const department =
    requestedDepartment === 'women' || requestedDepartment === 'men'
      ? requestedDepartment
      : 'all'

  function setDepartment(value: string) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      if (value === 'women' || value === 'men') {
        nextParams.set('department', value)
      } else {
        nextParams.delete('department')
      }
      return nextParams
    })
  }
  const [brand, setBrand] = useState('all')
  const [sortOrder, setSortOrder] = useState('featured')

  const visibleProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => {
      const matchesDepartment =
        department === 'all' ||
        product.department.toLowerCase() === department

      const productBrand = slugify(product.brand)
      const matchesBrand = brand === 'all' || productBrand === brand

      return matchesProduct(product, query) && matchesDepartment && matchesBrand && (category === 'all' || product.categoryIds.includes(category))
    })

    if (sortOrder === 'price-low') {
      return [...filteredProducts].sort((a, b) => a.price - b.price)
    }

    if (sortOrder === 'price-high') {
      return [...filteredProducts].sort((a, b) => b.price - a.price)
    }

    return filteredProducts
  }, [department, brand, sortOrder, category, products, query])

  return (
    <main className="marketplace">
      <header className="marketplace__header">
        <div>
          <p className="marketplace__eyebrow">The collection</p>
          <h1 className="marketplace__title">Marketplace</h1>
          <p className="marketplace__description">
            Discover considered styles for every day and every occasion.
          </p>
        </div>

        <p className="marketplace__count">
          {catalogStatus === 'ready' ? `${products.length} products in catalog · Showing ${visibleProducts.length}` : 'Collection unavailable'}
          <small style={{ display: 'block' }}>{catalogSource === 'api' ? 'Live API collection' : 'Demo collection'}</small>
        </p>
      </header>

      <form className="marketplace__search" role="search" aria-label="Search marketplace" onSubmit={event => event.preventDefault()}>
        <label>Search collection<input type="search" name="q" value={query} placeholder="Name, brand or department" onChange={event => setSearchParams(current => { const next = new URLSearchParams(current); if (event.target.value.trim()) next.set('q', event.target.value); else next.delete('q'); return next }, { replace: true })} /></label>
        {query && <button type="button" onClick={() => setSearchParams(current => { const next = new URLSearchParams(current); next.delete('q'); return next })}>Clear search</button>}
      </form>
      <div className="marketplace__toolbar">
        <div className="marketplace__filters">
          <label className="marketplace__control"><span>Category</span>
            <select value={category} onChange={event => setSearchParams(current => { const next = new URLSearchParams(current); if (event.target.value === 'all') next.delete('category'); else next.set('category', event.target.value); return next })}>
              <option value="all">All categories</option>
              {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="marketplace__control">
            <span>Department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="all">All departments</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
            </select>
          </label>

          <label className="marketplace__control">
            <span>Brand</span>
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            >
              <option value="all">All brands</option>
              {brands.map(item => <option key={item} value={slugify(item)}>{item}</option>)}
            </select>
          </label>
        </div>

        <label className="marketplace__control marketplace__control--sort">
          <span>Sort by</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      {catalogStatus === 'loading' ? <p className="marketplace__empty" role="status">Loading the collection…</p> : catalogStatus === 'error' ? <div className="marketplace__empty" role="alert"><p>The collection could not be loaded. Check your connection and try again.</p><button type="button" onClick={retryCatalog}>Retry</button></div> : visibleProducts.length > 0 ? (
        <section className="marketplace__grid" aria-label="Products">
          {visibleProducts.map((product) => (
            <article className="marketplace-product" key={product.id}>
              <FavoriteButton productId={product.id} overlay />
              <Link
                className="marketplace-product__link"
                to={`/products/${product.id}`}
                aria-label={`View ${product.name}`}
              >
                <div className="marketplace-product__image-wrap">
                  <img
                    className="marketplace-product__image"
                    src={product.image}
                    alt={product.imageAlt}
                    loading="lazy"
                  />

                  <span className="marketplace-product__department">
                    {product.department}
                  </span>
                </div>

                <div className="marketplace-product__details">
                  <p className="marketplace-product__brand">{product.brand}</p>
                  <h2 className="marketplace-product__name">{product.name}</h2>
                  <p className="marketplace-product__price">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <p className="marketplace__empty">
          {query ? `No products match “${query}” with these filters. Try another search or filter.` : 'No products match these filters. Try another selection.'}
        </p>
      )}
    </main>
  )
}

export default MarketplacePage

