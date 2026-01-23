import { useState, useEffect, useRef } from 'react'
import { galleryService } from '../../services/galleryService'

import SectionCard from '../common/SectionCard'

export default function GallerySection({ doctorSlug, primaryColor = '#4F46E5', cardShadow = true, containerShadow = true, containerBgColor, galleryWidth = '100%', theme }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const touchStartX = useRef(null)
  const autoRef = useRef(null)

  useEffect(() => {
    let mounted = true;
    if (doctorSlug === 'preview') {
      // Hardcoded preview image
      setImages([
        {
          id: 'preview-img',
          image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          title: 'Ejemplo de galería',
          description: 'Esta es una imagen de ejemplo para la previsualización.',
        },
      ]);
      setLoading(false);
      return () => { };
    }
    const fetchGallery = async () => {
      try {
        const data = await galleryService.getPublicGallery(doctorSlug)
        if (!mounted) return
        setImages(data || [])
      } catch (err) {
        setImages([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (doctorSlug) fetchGallery()
    return () => { mounted = false }
  }, [doctorSlug])

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return
    autoRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(autoRef.current)
  }, [autoPlay, images.length])

  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    // For relative URLs, prepend the backend URL
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    // Remove /api/v1 suffix if present
    const backendURL = baseURL.replace(/\/api\/v1$/, '')
    return `${backendURL}${url.startsWith('/') ? url : '/' + url}`
  }

  const prev = () => {
    setAutoPlay(false)
    setIndex((i) => (i - 1 + images.length) % images.length)
  }

  const next = () => {
    setAutoPlay(false)
    setIndex((i) => (i + 1) % images.length)
  }

  const goTo = (i) => {
    setAutoPlay(false)
    setIndex(i)
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    const diff = touchStartX.current - x
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length])

  if (loading) {
    return (
      <SectionCard
        id="galeria"
        scrollMargin="scroll-mt-32"
        containerBgColor={containerBgColor}
        containerShadow={containerShadow}
        theme={theme}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Galería</h2>
        <div className="flex justify-center py-8">
          {/* Height placeholder to prevent layout shift */}
          <div className="w-full h-[56vw] md:h-[40vw] lg:h-[30vw] max-h-[720px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
          </div>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      id="galeria"
      scrollMargin="scroll-mt-32"
      containerBgColor={containerBgColor}
      containerShadow={containerShadow}
      className="w-full"
      theme={theme}
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Galería de Trabajo</h2>

      </div>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">La galería de trabajo se mostrará aquí próximamente.</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-center">
            <div
              className="relative h-[56vw] md:h-[40vw] lg:h-[30vw] max-h-[720px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
              style={{ width: galleryWidth, maxWidth: '100%', boxSizing: 'border-box' }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onMouseDown={onTouchStart}
              onMouseUp={onTouchEnd}
            >
              <button
                onClick={prev}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={next}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Slider principal sin crop ni centrado avanzado */}
              <div className="w-full h-full flex items-center justify-center">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    aria-hidden={i !== index}
                  >
                    <div
                      className="w-full h-full absolute inset-0 overflow-hidden bg-gray-100"
                    >
                      <img
                        src={img.image_url.startsWith('http') ? img.image_url : getImageUrl(img.image_url)}
                        alt={img.title || `Imagen ${i + 1}`}
                        className="w-full h-full object-contain"
                        loading={i === index ? 'eager' : 'lazy'}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    {(img.title || img.description) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        {img.title && <h3 className="text-white font-semibold">{img.title}</h3>}
                        {img.description && <p className="text-gray-200 text-sm">{img.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="mt-4 flex items-center justify-center space-x-3 overflow-auto py-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => goTo(i)}
                className={`border rounded-md overflow-hidden ${i === index ? 'ring-2 ring-offset-2' : ''}`}
                style={{ borderColor: i === index ? primaryColor : 'transparent', width: '6rem', height: '4rem', aspectRatio: '3/2', background: '#f3f4f6', position: 'relative' }}
              >
                <img
                  src={img.image_url.startsWith('http') ? img.image_url : getImageUrl(img.image_url)}
                  alt={img.title || `Thumb ${i + 1}`}
                  className="w-24 h-16 object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

