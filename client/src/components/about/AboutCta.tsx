import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'

function AboutCta() {
  const { data: { website } } = useContent()
  const content = website.aboutCta
  return <section className="about-cta" aria-labelledby="about-cta-title"><p className="about-label">{content.eyebrow}</p><h2 className="about-heading" id="about-cta-title">{content.title}</h2><p>{content.description}</p><Link className="about-cta__link" to="/marketplace">{content.ctaText} <span aria-hidden="true">↗</span></Link></section>
}
export default AboutCta
