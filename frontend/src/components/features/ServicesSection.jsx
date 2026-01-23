import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { servicesService } from '../../services/servicesService'
import { getImageUrl } from '../../lib/imageUtils'

import SectionCard from '../common/SectionCard'

export default function ServicesSection({ doctorSlug, primaryColor = '#4F46E5', cardShadow = true, containerShadow = true, containerBgColor, sectionTitle, theme }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (doctorSlug) {
      loadServices()
    }
  }, [doctorSlug])

  const loadServices = async () => {
    try {
      const data = await servicesService.getPublicServices(doctorSlug)
      setServices(data)
    } catch (error) {
      console.error("Error loading services:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || services.length === 0) return null

  // Helper: get blog link for service if exists
  const getBlogLink = (service) => {
    // Example: service.blog_slug or service.blog_entry_url
    if (service.blog_slug) {
      return `/dr/${doctorSlug}/blog/${service.blog_slug}`
    }
    return null
  }

  return (
    <SectionCard
      id="servicios"
      scrollMargin="scroll-mt-28"
      containerBgColor={containerBgColor}
      title={sectionTitle}
      theme={theme}
    >
      <div className="flex flex-wrap justify-center gap-6">
        {services.map((service) => {
          const blogLink = getBlogLink(service)
          const cardContent = (
            <>
              {service.image_url ? (
                <div className="h-48 w-full bg-gray-100 dark:bg-gray-600">
                  <img
                    src={getImageUrl(service.image_url)}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-300">
                  <span className="text-4xl">🏥</span>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">{service.title}</h3>
                {service.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm text-justify line-clamp-6 px-2">
                    {service.description}
                  </p>
                )}
              </div>
            </>
          )
          return blogLink ? (
            <Link
              key={service.id}
              to={blogLink}
              className={`w-full sm:w-72 min-h-[400px] border-2 dark:border-gray-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col bg-white dark:bg-gray-700 ${cardShadow ? 'hover:shadow-lg' : ''}`}
              style={{ borderColor: '' }}
              title="Ver más en el blog"
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={service.id}
              className={`w-full sm:w-72 min-h-[400px] border-2 dark:border-gray-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col bg-white dark:bg-gray-700 ${cardShadow ? 'hover:shadow-lg' : ''}`}
              style={{ borderColor: '' }}
            >
              {cardContent}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
