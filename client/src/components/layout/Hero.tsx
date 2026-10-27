import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import '../../styles/hero.css'

function Hero() {
  const { data: { website } } = useContent()
  const content = website.hero
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__content">
        <p className="hero__eyebrow"><span aria-hidden="true">✦</span> {content.eyebrow}</p>
        <h1 className="hero__title" id="hero-title">{content.title}</h1>
        <p className="hero__description">{content.description}</p>
        <div className="hero__actions">
          <Link className="hero__button hero__button--primary" to="/marketplace">{content.ctaText}</Link>
          <Link className="hero__button hero__button--secondary" to="/about">{content.secondaryCta}</Link>
        </div>
      </div>
      <div className="hero__visual">
        <img loading="lazy" decoding="async" className="hero__image" src={content.image} alt={content.imageAlt} />
        <div className="hero__price-card"><span>{content.priceLabel}</span><strong>{content.priceText}</strong></div>
      </div>
    </section>
  )
}
export default Hero
