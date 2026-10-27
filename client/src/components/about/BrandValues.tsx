const values = [
  { number: '01', title: 'Room to be you', copy: 'Relaxed shapes and versatile layers leave space for your own styling. There is no single way to wear the edit.' },
  { number: '02', title: 'Everyday versatility', copy: 'A shirt with denim today, tailored trousers tomorrow. We look for pieces that make more combinations possible.' },
  { number: '03', title: 'Details that help', copy: 'Clear product views, size choices, and fit notes help you decide what belongs in your wardrobe before adding it to your bag.' },
]

function BrandValues() {
  return (
    <section className="about-values" aria-labelledby="about-values-title">
      <div className="about-section">
        <div className="about-values__heading">
          <p className="about-label">02 / Our point of view</p>
          <h2 className="about-heading" id="about-values-title">The things we come back to.</h2>
        </div>
        <ol className="about-values__grid">
          {values.map((value) => (
            <li key={value.number}>
              <span className="about-values__number" aria-hidden="true">{value.number}</span>
              <h3>{value.title}</h3>
              <p>{value.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default BrandValues
