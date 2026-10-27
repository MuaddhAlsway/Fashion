import AboutHero from '../components/about/AboutHero'
import BrandStory from '../components/about/BrandStory'
import BrandValues from '../components/about/BrandValues'
import CraftsmanshipSection from '../components/about/CraftsmanshipSection'
import AboutCta from '../components/about/AboutCta'
import '../styles/about.css'

function AboutPage() {
  return (
    <main className="about-page">
      <AboutHero />
      <BrandStory />
      <BrandValues />
      <CraftsmanshipSection />
      <AboutCta />
    </main>
  )
}

export default AboutPage
