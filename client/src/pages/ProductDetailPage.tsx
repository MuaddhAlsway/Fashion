import FavoriteButton from '../components/product/FavoriteButton'
import { useContent } from '../context/ContentContext'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import '../styles/product-detail.css'
import { useCart } from '../context/CartContext'
import SizeGuide from '../components/product/SizeGuide'


const mockReviews = [
  { id: 'review-1', name: 'Alex M.', rating: 5, date: '2026-10-20', title: 'An easy everyday favorite', body: 'The finish looks great in person and it is easy to style. I chose my usual size and the fit was just right.' },
  { id: 'review-2', name: 'Sam R.', rating: 4, date: '2026-10-17', title: 'Lovely quality', body: 'The material feels nice and the color matches the photos. Delivery took a little longer than expected, but I am happy with the purchase.' },
  { id: 'review-3', name: 'Jordan K.', rating: 5, date: '2026-10-12', title: 'Would buy again', body: 'Comfortable from the first wear, with neat details and a simple design. A welcome addition to my wardrobe.' },
]
const mockAverageRating = mockReviews.reduce((total, review) => total + review.rating, 0) / mockReviews.length

function ProductDetailPage() {
  const { productId } = useParams()
  return <ProductDetails key={productId} productId={productId} />
}

function ProductDetails({ productId }: { productId: string | undefined }) {
  const { data: { products } } = useContent()
  const { addItem } = useCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [addedToBag, setAddedToBag] = useState(false)

  const product = products.find((item) => item.id === productId)

if (!product) {
    return (
      <main className="product-detail product-detail--not-found">
        <p className="product-detail__eyebrow">FASHION</p>
        <h1 className="product-detail__title">Product not found</h1>
        <p className="product-detail__description">
          We couldn’t find that item in the collection.
        </p>
        <Link className="product-detail__back-link" to="/marketplace">
          Return to marketplace
        </Link>
      </main>
    )
  }

  const activeImage = product.images[selectedImageIndex] ?? product.images[0]
  const details = product

  async function handleAddToBag() {
    if (!product || !product.sizes.includes(selectedSize)) return
    try { await addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images[0].src,
      imageAlt: product.images[0].alt,
      size: selectedSize,
    })
    setAddedToBag(true) } catch { setAddedToBag(false) }
  }

  return (
    <main className="product-detail">
      <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/marketplace?department=${product.department.toLowerCase()}`}>
          {product.department}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail__layout">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image">
            <img src={activeImage.src} alt={activeImage.alt} />
          </div>

          <div className="product-detail__thumbnails" aria-label="Product views">
            {product.images.map((image, index) => (
              <button
                className={`product-detail__thumbnail ${
                  selectedImageIndex === index
                    ? 'product-detail__thumbnail--selected'
                    : ''
                }`}
                key={image.src}
                type="button"
                aria-label={`Show ${image.view.toLowerCase()} image`}
                aria-pressed={selectedImageIndex === index}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img src={image.src} alt="" />

              </button>
            ))}
          </div>
        </div>

        <section
          className="product-detail__info"
          aria-labelledby="product-title"
        >
          <div className="product-detail__brand-row"><p className="product-detail__brand">{product.brand}</p><FavoriteButton productId={product.id} showLabel /></div>
          <h1 className="product-detail__title" id="product-title">
            {product.name}
          </h1>
          <p className="product-detail__price">${product.price.toFixed(2)}</p>
          <a className="product-detail__rating-link" href="#customer-feedback">
            {mockAverageRating.toFixed(1)} / 5 · {mockReviews.length} sample reviews
          </a>
          <p className="product-detail__description">{details.description}</p>

          <fieldset className="product-detail__size-fieldset">
            <legend className="product-detail__size-legend">
                            <span className="product-detail__size-heading">
                <span>Select size</span>
                <SizeGuide department={product.department} productId={product.id} sizes={product.sizes} />
              </span>
              <span className="product-detail__size-status">
                {selectedSize ? `Selected: ${selectedSize}` : 'Required'}
              </span>
            </legend>

            <div className="product-detail__sizes">
              {product.sizes.map((size) => (
                <button
                  className={`product-detail__size ${
                    selectedSize === size
                      ? 'product-detail__size--selected'
                      : ''
                  }`}
                  key={size}
                  type="button"
                  aria-pressed={selectedSize === size}
                  onClick={() => {
                    setSelectedSize(size)
                    setAddedToBag(false)
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="product-detail__add-button"
            type="button"
            disabled={!selectedSize}
            onClick={handleAddToBag}
          >
            {addedToBag ? 'Added to bag' : 'Add to bag'}
          </button>

          <p className="product-detail__feedback" aria-live="polite">
            {addedToBag
              ? `${product.name}, size ${selectedSize}, added to your bag.`
              : !selectedSize
                ? 'Choose a size to continue.'
                : ''}
          </p>
          <div className="product-detail__accordions">
            <details key={`${product.id}-details`} open>
              <summary>
                <span>Product details</span>
                <span className="product-detail__accordion-indicator" aria-hidden="true">+</span>
              </summary>
              <dl className="product-detail__specifications">
                <div><dt>Material</dt><dd>{details.material}</dd></div>
                <div><dt>Fit</dt><dd>{details.fit}</dd></div>
                <div><dt>Care</dt><dd>{details.care}</dd></div>
              </dl>
              <p className="product-detail__demo-note">Sample product specifications.</p>
            </details>
            <details key={`${product.id}-shipping`}>
              <summary>
                <span>Shipping</span>
                <span className="product-detail__accordion-indicator" aria-hidden="true">+</span>
              </summary>
              <p>Standard delivery: 3–5 business days, $5. Free standard shipping on orders over $100. Express delivery: 1–2 business days, $12. Tracking is emailed when your order ships.</p>
              <p className="product-detail__demo-note">Sample delivery rates and estimates.</p>
            </details>
            <details key={`${product.id}-returns`}>
              <summary>
                <span>Returns &amp; exchanges</span>
                <span className="product-detail__accordion-indicator" aria-hidden="true">+</span>
              </summary>
              <p>Return unworn items with original tags within 30 days of delivery. Start a return from your order confirmation. Refunds are processed to the original payment method within 5–7 business days after inspection. Exchanges are subject to availability.</p>
              <p className="product-detail__demo-note">Sample returns policy.</p>
            </details>
          </div>
        </section>
      </div>

      <section className="product-detail__reviews" id="customer-feedback" aria-labelledby="customer-feedback-title">
        <div className="product-detail__reviews-heading">
          <div>
            <p className="product-detail__eyebrow">Customer feedback</p>
            <h2 id="customer-feedback-title">What people are saying</h2>
            <p className="product-detail__demo-note">Sample reviews for {product.name}.</p>
          </div>
          <div className="product-detail__review-summary">
            <strong>{mockAverageRating.toFixed(1)} <span>/ 5</span></strong>
            <span>Based on {mockReviews.length} sample reviews</span>
          </div>
        </div>
        <div className="product-detail__review-list">
          {mockReviews.map((review) => (
            <article className="product-detail__review" key={review.id}>
              <div className="product-detail__review-meta">
                <strong>{review.name}</strong>
                <time dateTime={review.date}>{new Date(`${review.date}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              </div>
              <div className="product-detail__review-stars" aria-label={`${review.rating} out of 5 stars`}>
                <span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <h3>{review.title}</h3>
              <p>{review.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ProductDetailPage



