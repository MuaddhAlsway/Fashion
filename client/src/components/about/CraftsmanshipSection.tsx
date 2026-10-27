import knitImage from '../../assets/herofourth.png'

const details = [
  { title: 'Material & texture', copy: 'Cotton shirting, tactile knits, and smooth tailoring bring contrast to a neutral wardrobe. Check each product’s material and care notes for the details.' },
  { title: 'Fit & proportion', copy: 'An easy shoulder, a straight leg, a layer that sits comfortably. Use the product views and fit notes to choose your shape and size.' },
  { title: 'Design & combinations', copy: 'Clean lines and considered proportions let a piece work across outfits. Mix a structured jacket with a soft knit, or pair relaxed shirting with tailored trousers.' },
]

function CraftsmanshipSection() {
  return (
    <section className="about-craft about-section" aria-labelledby="about-craft-title">
      <figure className="about-craft__visual">
        <img src={knitImage} alt="Ivory ribbed knit top showing its texture and simple silhouette" loading="lazy" />
        <figcaption>A closer look / the ribbed knit</figcaption>
      </figure>
      <div>
        <p className="about-label">03 / A closer look</p>
        <h2 className="about-heading" id="about-craft-title">It starts with<br /><em>how it feels.</em></h2>
        <dl className="about-craft__details">
          {details.map((detail) => (
            <div key={detail.title}>
              <dt>{detail.title}</dt>
              <dd>{detail.copy}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default CraftsmanshipSection
