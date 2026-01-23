import { useState, useEffect } from 'react'
import { getImageUrl } from '../../lib/imageUtils'
import { useAuthStore } from '../../store/authStore'
import { galleryService } from '../../services/galleryService'

export default function HeroSlider() {
  const { user } = useAuthStore()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      if (user?.slug_url) {
        try {
          const data = await galleryService.getPublicGallery(user.slug_url)
          const featuredImages = data.filter(img => img.featured).slice(0, 4)
          setImages(featuredImages)
        } catch (err) {
          setImages(defaultImages)
        }
      } else {
        setImages(defaultImages)
      }
      setLoading(false)
    }

    fetchImages()
  }, [user])

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlay, images.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
    setAutoPlay(false)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setAutoPlay(false)
  }

  // Imágenes por defecto si no hay galería
  const defaultImages = [
    {
      id: 'default-1',
      image_url: '/sample-gallery/img1.png',
      title: 'Atención Médica Personalizada',
      description: 'Consultas especializadas en ginecología y obstetricia'
    },
    {
      id: 'default-2',
      image_url: '/sample-gallery/img2.png',
      title: 'Tecnología de Vanguardia',
      description: 'Equipos modernos para el mejor diagnóstico'
    },
    {
      id: 'default-3',
      image_url: '/sample-gallery/img3.png',
      title: 'Cuidado Integral de la Mujer',
      description: 'Desde la adolescencia hasta la menopausia'
    },
    {
      id: 'default-4',
      image_url: '/sample-gallery/img4.png',
      title: 'Consultorio Moderno',
      description: 'Espacio profesional dedicado al cuidado integral de la mujer'
    },
    {
      id: 'default-5',
      image_url: '/sample-gallery/img5.png',
      title: 'Experiencia y Confianza',
      description: 'Más de 10 años dedicados a la salud femenina'
    }
  ]

  const displayImages = images.length > 0 ? images : defaultImages

  if (loading || displayImages.length === 0) {
    return null
  }

  const currentImage = displayImages[currentIndex]
  const imageUrl = currentImage.image_url?.startsWith('http')
    ? currentImage.image_url
    : getImageUrl(currentImage.image_url)

  const bgStyle = {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  }

  return (
    <section className="relative w-1/2 h-[500px] overflow-hidden bg-gray-900 mx-auto">

      {/* Background Image */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={bgStyle}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            {currentImage.title}
          </h2>
          {currentImage.description && (
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {currentImage.description}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
            aria-label="Anterior"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
            aria-label="Siguiente"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-play Control */}
      {displayImages.length > 1 && (
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className="absolute top-4 right-4 z-20 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm transition-all"
        >
          {autoPlay ? 'Pausar' : 'Reproducir'}
        </button>
      )}
    </section>
  )
}