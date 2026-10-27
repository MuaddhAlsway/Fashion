import Hero from '../components/layout/Hero'
import CategorySection from '../components/layout/CategorySection'
import FeaturedProducts from '../components/layout/FeaturedProducts'
import BrandStory from '../components/layout/BrandStory'

function HomePage() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <BrandStory />
    </main>
  )
}

export default HomePage
