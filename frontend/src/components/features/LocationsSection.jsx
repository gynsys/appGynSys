import { useState, useEffect } from 'react'
import { FiPhone, FiMapPin, FiClock } from 'react-icons/fi'
import { locationService } from '../../services/locationService'
import { getImageUrl } from '../../lib/imageUtils'
import ContactModal from './ContactModal'

import SectionCard from '../common/SectionCard'

export default function LocationsSection({ doctor, primaryColor, cardShadow = true, containerShadow = true, containerBgColor, theme }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    if (doctor?.slug_url) {
      loadLocations()
    }
  }, [doctor])

  const loadLocations = async () => {
    try {
      const data = await locationService.getPublicLocations(doctor.slug_url)
      setLocations(data)
    } catch (error) {
      console.error("Error loading locations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || locations.length === 0) return null

  return (
    <SectionCard
      id="ubicaciones"
      scrollMargin="scroll-mt-32"
      containerBgColor={containerBgColor}
      title="Ubicaciones"
      theme={theme}
    >
      <div className="flex flex-wrap justify-center gap-8">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`w-full max-w-sm border-2 dark:border-gray-600 rounded-xl overflow-hidden transition-shadow flex flex-col h-full bg-white dark:bg-gray-700 ${cardShadow ? 'hover:shadow-lg' : ''}`}
            style={{ borderColor: '' }} // Let Tailwind handle border color
          >
            {location.image_url && (
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-600">
                <img
                  src={getImageUrl(location.image_url)}
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{location.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">{location.address}</p>
              {location.city && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{location.city}</p>
              )}
              {location.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                  <FiPhone className="w-5 h-5 mr-2" />
                  {location.phone}
                </div>
              )}
              {location.schedule?.label && (
                <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                  <FiClock className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-sm">{location.schedule.label}</span>
                </div>
              )}
              {location.google_maps_url && (
                <a
                  href={location.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 w-full mt-auto"
                  style={{ backgroundColor: primaryColor }}
                >
                  <FiMapPin className="w-5 h-5 mr-2" />
                  Ver en Mapa
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => setIsContactModalOpen(true)}
          className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg transform hover:scale-105 duration-200"
          style={{ backgroundColor: primaryColor }}
        >
          Contáctame
        </button>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        doctorSlug={doctor?.slug_url}
        primaryColor={primaryColor}
      />
    </SectionCard>
  )
}
