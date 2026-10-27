import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import '../../styles/brand-story.css'

function BrandStory() {
  const { data: { website } } = useContent()
  const content = website.brandStory
  return (
    <section className="brand-story" aria-labelledby="brand-story-title">
      <div className="brand-story__media"><img className="brand-story__image" src={content.image} alt={content.imageAlt} loading="lazy" /></div>
      <div className="brand-story__edition" aria-hidden="true"><span>FASHION — THE NEW SEASON</span><span>01 / THE EDIT</span></div>
      <div className="brand-story__content">
        <p className="brand-story__eyebrow"><span aria-hidden="true" /> {content.eyebrow}</p>
        <h2 className="brand-story__title" id="brand-story-title"><span className="brand-story__title-intro">{content.title}</span>{' '}<span className="brand-story__title-statement">{content.titleAccent}</span></h2>
        <div className="brand-story__footnote"><span className="brand-story__index" aria-hidden="true">(01)</span><div>
          <p className="brand-story__description">{content.description}</p>
          <Link className="brand-story__link" to="/marketplace">{content.ctaText} <span aria-hidden="true">↗</span></Link>
        </div></div>
      </div>
      <span className="brand-story__caption" aria-hidden="true">FORM / TEXTURE / MOVEMENT</span>
    </section>
  )
}
export default BrandStory
