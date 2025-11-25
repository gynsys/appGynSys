import { useState, useEffect } from 'react'
import { testimonialService } from '../../services/testimonialService'

export default function TestimonialsSection({ doctorSlug, primaryColor = '#4F46E5' }) {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 TestimonialsSection NUEVO DISEÑO - Cargando para:', doctorSlug)
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialService.getPublicTestimonials(doctorSlug)
        console.log('✅ Testimonios recibidos:', data)
        setTestimonials(data)
      } catch (err) {
        console.error('❌ Error fetching testimonials:', err)
      } finally {
        setLoading(false)
      }
    }

    if (doctorSlug) {
      fetchTestimonials()
    }
  }, [doctorSlug])

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
      <section id="testimonios" className="mb-20">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Testimonios de Nuestros Pacientes</h2>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="testimonios" className="mb-20">
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Testimonios de Nuestros Pacientes
        </h2>
        
        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 text-lg">
              Los testimonios de nuestros pacientes se mostrarán aquí próximamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
              >
                {/* Patient Photo Section */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex flex-col items-center">
                  {/* Photo Circle */}
                  <div className="relative mb-4">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {testimonial.patient_name.charAt(0).toUpperCase()}
                    </div>
                    {testimonial.is_featured && (
                      <div 
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                        style={{ backgroundColor: primaryColor }}
                        title="Testimonio Destacado"
                      >
                        ⭐
                      </div>
                    )}
                  </div>
                  
                  {/* Patient Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {testimonial.patient_name}
                  </h3>
                  
                  {/* Rating */}
                  {testimonial.rating && (
                    <div className="mt-2">
                      {renderStars(testimonial.rating)}
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="mb-4">
                    <svg 
                      className="w-8 h-8 opacity-20 mb-2"
                      style={{ color: primaryColor }}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed text-base flex-grow italic">
                    "{testimonial.content}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

