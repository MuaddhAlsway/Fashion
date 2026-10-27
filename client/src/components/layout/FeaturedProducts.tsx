import FavoriteButton from '../product/FavoriteButton'
import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router'
import '../../styles/featured-products.css'


function FeaturedProducts() {
  const { data } = useContent()
  const products = data.products.filter(product => product.featured)
  const content = data.website.homeFeatured
  return (
    <section
      className="featured-products"
      aria-labelledby="featured-products-title"
    >
      <div className="featured-products__heading">
        <div>
          <p className="featured-products__eyebrow">{content.eyebrow}</p>
          <h2 className="featured-products__title" id="featured-products-title">
            {content.title}
          </h2>
          <p className="featured-products__description">
            {content.description}
          </p>
        </div>

        <Link className="featured-products__view-all" to="/marketplace">
          {content.ctaText} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="featured-products__grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <FavoriteButton productId={product.id} overlay />
            <Link
              className="product-card__link"
              to={`/products/${product.id}`}
              aria-label={`View ${product.name}`}
            >
              <span className="product-card__image-link">
                <img
                  className="product-card__image"
                  src={product.featuredImage}
                  alt={product.featuredAlt}
                  loading="lazy"
                />
                {product.label && (
                  <span className="product-card__badge">{product.label}</span>
                )}
              </span>

              <span className="product-card__details">
                <span className="product-card__brand">{product.brand}</span>
                <span className="product-card__name-price">
                  <span className="product-card__name">{product.name}</span>
                  <span className="product-card__price">${product.price.toFixed(2)}</span>
                </span>
              </span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturedProducts