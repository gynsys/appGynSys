import { useState, useEffect } from 'react'
import { galleryService } from '../../services/galleryService'

export default function GallerySection({ doctorSlug, primaryColor = '#4F46E5' }) {
  const [galleryImages, setGalleryImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    console.log('GallerySection: Cargando galería para:', doctorSlug)
    const fetchGallery = async () => {
      try {
        const data = await galleryService.getPublicGallery(doctorSlug)
        console.log('GallerySection: Imágenes recibidas:', data)
        setGalleryImages(data)
      } catch (err) {
        console.error('Error fetching gallery:', err)
      } finally {
        setLoading(false)
      }
    }

    if (doctorSlug) {
      fetchGallery()
    }
  }, [doctorSlug])

  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `http://localhost:8000${url}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Galería</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      </div>
    )
  }

  // Always show gallery section, even if empty

  return (
    <>
      <section id="galeria" className="mb-20">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Galería de Trabajo</h2>
          
          {galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-600 text-lg">
                La galería de trabajo se mostrará aquí próximamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={getImageUrl(image.image_url)}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium">{image.title}</p>
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getImageUrl(selectedImage.image_url)}
              alt={selectedImage.title || 'Gallery image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {(selectedImage.title || selectedImage.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 rounded-b-lg">
                {selectedImage.title && (
                  <h3 className="text-white text-xl font-semibold mb-2">{selectedImage.title}</h3>
                )}
                {selectedImage.description && (
                  <p className="text-gray-200">{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

