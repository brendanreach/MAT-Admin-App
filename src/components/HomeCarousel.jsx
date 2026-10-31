import { ChevronLeft, ChevronRight, ImagePlus, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DEFAULT_SLIDE_IMAGES } from '../lib/homeCarousel.js'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return undefined
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

// One slide's picture and text. Also used by the slide manager's live preview.
export function CarouselSlideView({ slide, onNavigate }) {
  return (
    <>
      <img
        key={slide.image}
        src={slide.image}
        alt={slide.alt || ''}
        className="mat-new-home-hero-image"
        onError={(event) => {
          if (!event.currentTarget.src.endsWith(DEFAULT_SLIDE_IMAGES.custom)) {
            event.currentTarget.src = DEFAULT_SLIDE_IMAGES.custom
          }
        }}
      />
      <div className="mat-new-home-hero-shade" />
      <div className="mat-new-home-hero-copy">
        {slide.kicker && <span>{slide.kicker}</span>}
        <h1>{slide.title}</h1>
        {slide.body && <p>{slide.body}</p>}
        {slide.meta && <small>{slide.meta}</small>}
        {slide.action && slide.target && (
          <button type="button" onClick={() => onNavigate?.(slide.target)}>
            {slide.action}
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </>
  )
}

export default function HomeCarousel({ slides = [], onNavigate, onManage }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const paused = hovered || focused || touched || reducedMotion

  // A tap pauses rotation for a while so people can read, then it resumes.
  useEffect(() => {
    if (!touched) return undefined
    const timer = window.setTimeout(() => setTouched(false), 20000)
    return () => window.clearTimeout(timer)
  }, [touched])

  useEffect(() => {
    if (paused || slides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length)
    }, 9000)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const safeIndex = slideIndex < slides.length ? slideIndex : 0
  const currentSlide = slides[safeIndex]

  function goTo(index) {
    setSlideIndex((index + slides.length) % slides.length)
  }

  if (!currentSlide) {
    if (!onManage) return null
    return (
      <section className="mat-new-home-hero mat-new-home-hero-empty">
        <div className="mat-new-home-hero-copy">
          <span>Home Page Carousel</span>
          <h1>No slides are showing</h1>
          <p>All slides are hidden or outside their scheduled dates.</p>
          <button type="button" onClick={onManage}>
            <ImagePlus size={18} />
            Manage Slides
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      className="mat-new-home-hero"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onTouchStart={() => setTouched(true)}
      onKeyDown={(event) => {
        if (slides.length < 2) return
        if (event.key === 'ArrowLeft') goTo(safeIndex - 1)
        if (event.key === 'ArrowRight') goTo(safeIndex + 1)
      }}
    >
      <CarouselSlideView slide={currentSlide} onNavigate={onNavigate} />

      {onManage && (
        <button type="button" className="mat-new-home-hero-manage" onClick={onManage}>
          <Settings2 size={16} />
          Manage Slides
        </button>
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="mat-new-home-hero-arrow previous"
            aria-label="Previous slide"
            onClick={() => goTo(safeIndex - 1)}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="mat-new-home-hero-arrow next"
            aria-label="Next slide"
            onClick={() => goTo(safeIndex + 1)}
          >
            <ChevronRight size={24} />
          </button>
          <div className="mat-new-home-dots" aria-label="Featured slides">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === safeIndex ? 'active' : ''}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === safeIndex ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
