import { useState, useEffect, useRef } from 'react'
import { testimonialService } from '../../services/testimonialService'
import SectionCard from '../common/SectionCard'

export default function TestimonialsSection({ doctorSlug, primaryColor = '#4F46E5', cardShadow = true, containerShadow = true, containerBgColor, theme }) {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)


  /* Removed getPhotoUrl - photos are not currently displayed in the carousel */

  useEffect(() => {
    console.log('🔄 TestimonialsSection - Cargando para:', doctorSlug)
    let isMounted = true

    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const data = await testimonialService.getPublicTestimonials(doctorSlug)

        if (!isMounted) return

        console.log('✅ Testimonios recibidos:', data)
        // Log photo URLs for debugging (without calling getPhotoUrl to avoid Date.now() issues)
        data.forEach(t => {
          console.log(`📸 Testimonial ${t.id} (${t.patient_name}):`, {
            photo_url: t.photo_url,
            photo_url_type: typeof t.photo_url,
            has_photo: !!(t.photo_url && t.photo_url !== null && t.photo_url !== 'null')
          })
        })

        // Orden: featured primero, luego por fecha descendente
        const ordered = (data || []).slice().sort((a, b) => {
          if ((b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) !== 0) {
            return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
          }
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return db - da
        })
        setTestimonials(ordered)
      } catch (err) {
        console.error('❌ Error fetching testimonials:', err)
        if (isMounted) {
          setTestimonials([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (doctorSlug) {
      fetchTestimonials()
    }

    // Auto-refresh removed to prevent flickering
    /* 
    const interval = setInterval(() => { ... }, 10000) 
    */

    // Also listen for storage events (when testimonial is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'testimonials_updated' && doctorSlug && isMounted) {
        console.log('📢 Testimonials updated event received, refreshing...')
        fetchTestimonials()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Listen for custom event for same-tab updates
    const handleTestimonialsUpdate = () => {
      if (doctorSlug && isMounted) {
        console.log('📢 Testimonials updated event (same tab), refreshing...')
        fetchTestimonials()
      }
    }
    window.addEventListener('testimonialsUpdated', handleTestimonialsUpdate)

    return () => {
      isMounted = false
      // clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('testimonialsUpdated', handleTestimonialsUpdate)
    }
  }, [doctorSlug])

  // Note: submission form removed — testimonials are read-only in public site

  const renderStars = (rating) => {
    if (!rating) return null
    return (
      <div className="flex items-center justify-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <SectionCard
        id="testimonios"
        scrollMargin="scroll-mt-32"
        containerBgColor={containerBgColor}
        containerShadow={containerShadow}
        theme={theme}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Testimonios de Nuestros Pacientes</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      </SectionCard>
    )
  }



  return (
    <SectionCard
      id="testimonios"
      scrollMargin="scroll-mt-32"
      containerBgColor={containerBgColor}
      containerShadow={containerShadow}
      theme={theme}
    >
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Testimonios de Nuestros Pacientes
        </h2>

      </div>
      {/* Public submission removed — testimonials are displayed read-only */}

      {testimonials.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-600 text-lg">Los testimonios de nuestros pacientes se mostrarán aquí próximamente.</p>
        </div>
      ) : (
        <Carousel
          testimonials={testimonials}
          primaryColor={primaryColor}
          renderStars={renderStars}
          cardShadow={cardShadow}
        />
      )}
    </SectionCard>
  )
}


function Carousel({ testimonials, primaryColor, renderStars, cardShadow }) {
  const [idx, setIdx] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [visible, setVisible] = useState(3)
  const [expanded, setExpanded] = useState({})
  const autoRef = useRef(null)

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w >= 1024) setVisible(3)
      else if (w >= 768) setVisible(2)
      else setVisible(1)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!autoPlay || testimonials.length <= visible) return
    autoRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(autoRef.current)
  }, [autoPlay, testimonials.length, visible])

  const prev = () => { setAutoPlay(false); setIdx((i) => (i - 1 + testimonials.length) % testimonials.length) }
  const next = () => { setAutoPlay(false); setIdx((i) => (i + 1) % testimonials.length) }
  const goToPage = (page) => { setAutoPlay(false); setIdx(page * visible % testimonials.length) }

  // Pause on hover/focus for accessibility
  const handleMouseEnter = () => setAutoPlay(false)
  const handleMouseLeave = () => setAutoPlay(true)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [testimonials.length])

  const visibleIndices = [...Array(Math.min(visible, testimonials.length))].map((_, i) => (idx + i) % testimonials.length)

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onFocus={handleMouseEnter} onBlur={handleMouseLeave} role="region" aria-label="Carrusel de testimonios">
      <div className="relative">
        <button onClick={prev} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow" disabled={testimonials.length <= 1}>
          <svg className="w-5 h-5 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={next} aria-label="Siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow" disabled={testimonials.length <= 1}>
          <svg className="w-5 h-5 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleIndices.map((i) => {
            const t = testimonials[i]
            return (
              <article key={t.id} className={`bg-white dark:bg-gray-700 rounded-2xl p-6 flex flex-col ${cardShadow ? 'shadow-lg' : 'border border-gray-200 dark:border-gray-600'} transition-colors duration-200`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                      {t.patient_name ? t.patient_name.charAt(0).toUpperCase() : 'P'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.patient_name}</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t.role || ''}</div>
                      </div>
                      {t.is_featured && (
                        <div className="text-yellow-400 text-xl">⭐</div>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 italic">
                      {renderStars(t.rating)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-gray-700 dark:text-gray-300 flex-grow">
                  <ReadMore text={t.content} expanded={!!expanded[t.id]} onToggle={() => setExpanded((s) => ({ ...s, [t.id]: !s[t.id] }))} />
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center space-x-2" aria-hidden={testimonials.length <= visible}>
        {Array.from({ length: Math.max(1, Math.ceil(testimonials.length / visible)) }).map((_, p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`w-3 h-3 rounded-full ${Math.floor(idx / visible) === p ? 'bg-gray-800 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
            aria-label={`Página ${p + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function ReadMore({ text, expanded, onToggle }) {
  const limit = 200
  if (!text) return null
  if (text.length <= limit) return <p className="text-gray-700 dark:text-gray-300">"{text}"</p>
  return (
    <div>
      <p className="text-gray-700 dark:text-gray-300">"{expanded ? text : `${text.slice(0, limit)}...`}"</p>
      <button onClick={onToggle} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">{expanded ? 'Leer menos' : 'Leer más'}</button>
    </div>
  )
}

