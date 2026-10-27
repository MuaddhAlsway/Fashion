import { useContent } from '../../context/ContentContext'

function BrandStory() {
  const { data: { website } } = useContent()
  const content = website.aboutStory
  return (
    <section className="about-story about-section" aria-labelledby="about-story-title">
      <p className="about-label">{content.eyebrow}</p>
      <div><h2 className="about-heading" id="about-story-title">{content.title}<br /><em>{content.titleAccent}</em></h2>
        <div className="about-story__copy">{content.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </div>
    </section>
  )
}
export default BrandStory
