import { useContent } from '../../context/ContentContext'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import aboutHeroImage from '../../assets/hero-about.png'
import creamCampaignImage from '../../assets/herotwo.png'
import motionCampaignImage from '../../assets/herothree.png'
import '../../styles/about-hero.css'

const baseSlides = [
  { src: aboutHeroImage, alt: 'Model in black tailoring beside a vintage convertible on a sunlit street', position: '50% 35%' },
  { src: creamCampaignImage, alt: 'Model in cream tailoring in a sunlit sand-toned interior', position: '75% 35%' },
  { src: motionCampaignImage, alt: 'Model in a dark flowing coat and cream skirt against a blurred warm and green backdrop', position: '70% 40%' },
]

function subscribeToReducedMotion(onChange: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function AboutHero() {
  const { data: { website } } = useContent()
  const content = website.aboutHero
  const slides = [{ ...baseSlides[0], src: content.image!, alt: content.imageAlt! }, ...baseSlides.slice(1)]
  const [carousel, setCarousel] = useState<{
    activeIndex: number
    outgoingIndex: number | null
    direction: 'forward' | 'backward'
  }>({ activeIndex: 0, outgoingIndex: null, direction: 'backward' })
  const { activeIndex, outgoingIndex, direction } = carousel
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  )
  const isRotating = !paused && !hovered && !reducedMotion
  const activeSlide = slides[activeIndex]

  const changeSlide = useCallback((requestedIndex?: number) => {
    setCarousel((current) => {
      const nextIndex = requestedIndex ?? (current.activeIndex + 1) % slides.length
      if (nextIndex === current.activeIndex) return current
      // Functional state updates also guard clicks arriving before a re-render.
      if (!reducedMotion && current.outgoingIndex !== null) return current
      return {
        activeIndex: nextIndex,
        outgoingIndex: reducedMotion ? null : current.activeIndex,
        direction: requestedIndex === undefined
          ? (current.direction === 'forward' ? 'backward' : 'forward')
          : (nextIndex > current.activeIndex ? 'forward' : 'backward'),
      }
    })
  }, [reducedMotion, slides.length])

  const finishTransition = useCallback(() => {
    setCarousel((current) => current.outgoingIndex === null
      ? current
      : { ...current, outgoingIndex: null })
  }, [])

  useEffect(() => {
    if (outgoingIndex === null) return
    // Release the lock even if animationend is skipped in a background tab.
    const timer = window.setTimeout(finishTransition, 1100)
    return () => window.clearTimeout(timer)
  }, [outgoingIndex, finishTransition])

  useEffect(() => {
    if (!isRotating || outgoingIndex !== null) return
    const timer = window.setInterval(() => changeSlide(), 5000)
    return () => window.clearInterval(timer)
  }, [activeIndex, outgoingIndex, isRotating, changeSlide])

  return (
    <section className="about-hero" aria-labelledby="about-hero-title">
      <div className="about-hero__content">
        <p className="about-hero__eyebrow">{content.eyebrow}</p>

        <h1 className="about-hero__title" id="about-hero-title">
          {content.title}
          <br />
          <em>{content.titleAccent}</em>
        </h1>

        <p className="about-hero__description">
          {content.description}
        </p>

        <Link className="about-hero__link" to="/marketplace">
          {content.ctaText} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div
        className="about-hero__carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="FASHION campaign images"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setPaused(true)}
      >
        <div className="about-hero__visual" data-direction={direction}>
          {outgoingIndex !== null && !reducedMotion && (
                        <div
              className="about-hero__page about-hero__page--outgoing"
              aria-hidden="true"
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget && event.animationName === 'about-page-flip') finishTransition()
              }}
            >
              <img loading="lazy" decoding="async"
                className="about-hero__image"
                src={slides[outgoingIndex].src}
                alt=""
                style={{ objectPosition: slides[outgoingIndex].position }}
              />
            </div>
          )}
          <div
            key={activeIndex}
            className={`about-hero__page${outgoingIndex !== null && !reducedMotion ? ' about-hero__page--incoming' : ''}`}
          >
            <img loading="lazy" decoding="async"
              className="about-hero__image"
              id="about-hero-slide"
              src={activeSlide.src}
              alt={activeSlide.alt}
              style={{ objectPosition: activeSlide.position }}
            />
          </div>
          <span className="about-hero__image-note">Designed for everyday</span>
        </div>
        <div className="about-hero__carousel-controls">
          <div className="about-hero__dots" role="group" aria-label="Choose a campaign image">
            {slides.map((slide, index) => (
              <button
                className="about-hero__dot"
                type="button"
                key={slide.src}
                aria-label={`Show image ${index + 1} of ${slides.length}: ${slide.alt}`}
                aria-pressed={activeIndex === index}
                aria-controls="about-hero-slide"
                onClick={() => { changeSlide(index); setPaused(true) }}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <button
            className="about-hero__rotation"
            type="button"
            disabled={reducedMotion}
            aria-label={reducedMotion ? 'Automatic rotation disabled for reduced motion' : paused ? 'Start automatic image rotation' : 'Pause automatic image rotation'}
            onClick={() => setPaused((current) => !current)}
          >
            {reducedMotion ? 'Autoplay off' : paused ? 'Play slideshow' : 'Pause slideshow'}
          </button>
        </div>
        <p className="about-hero__slide-status" aria-live={isRotating ? 'off' : 'polite'} aria-atomic="true">
          Image {activeIndex + 1} of {slides.length}
        </p>
      </div>
    </section>
  )
}

export default AboutHero





