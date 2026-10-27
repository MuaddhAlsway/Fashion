import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router'
import '../../styles/category-section.css'


function CategorySection() {
  const { data: { categories, website } } = useContent()
  const content = website.homeCategories
  return (
    <section className="category-section" aria-labelledby="category-section-title">
      <div className="category-section__heading">
        <p className="category-section__eyebrow">{content.eyebrow}</p>
        <h2 className="category-section__title" id="category-section-title">
          {content.title}
        </h2>
        <p className="category-section__description">
          {content.description}
        </p>
      </div>

      <div className="category-section__grid">
        {categories.map((category) => (
          <Link
            className="category-card"
            key={category.id}
            to={`/marketplace?department=${category.department}${['women', 'men'].includes(category.id) ? '' : `&category=${encodeURIComponent(category.id)}`}`} aria-label={`Shop ${category.name}`}
            style={{ backgroundImage: `url("${category.image}")` }}
          >
            <span className="category-card__overlay" aria-hidden="true" />
            <span className="category-card__content">
              <span className="category-card__description">
                {category.description}
              </span>
              <span className="category-card__title">{category.name}</span>
              <span className="category-card__cta">Explore collection →</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategorySection