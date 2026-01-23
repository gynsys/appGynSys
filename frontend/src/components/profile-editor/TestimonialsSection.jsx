import React from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import DragDropUpload from '../features/DragDropUpload'
import Spinner from '../common/Spinner'

const TestimonialsSection = ({
  testimonials,
  loading,
  testimonialSavingId,
  expandedTestimonialId,
  setExpandedTestimonialId,
  handleTestimonialFieldChange,
  handleSaveTestimonial,
  doctor
}) => {
  const primaryColor = doctor?.theme_primary_color || '#4F46E5'

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Testimonials</h2>
        <Button
          variant="outline"
          onClick={() => window.location.reload()} // Simplified refresh
          className="text-sm"
        >
          Refrescar
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-6 dark:text-gray-400">
        Actualiza la información que se muestra en la sección de testimonios de tu página pública.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          No tienes testimonios todavía. Cuando recibas testimonios aprobados aparecerán aquí para que los puedas editar.
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => {
            const isExpanded = expandedTestimonialId === testimonial.id
            const displayRating = testimonial.rating ? `${testimonial.rating} ${testimonial.rating === 1 ? 'estrella' : 'estrellas'}` : 'Sin valoración'
            return (
              <div key={testimonial.id} className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  onClick={() =>
                    setExpandedTestimonialId((prev) => (prev === testimonial.id ? null : testimonial.id))
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {testimonial.patient_name ? testimonial.patient_name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{testimonial.patient_name || 'Paciente'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{displayRating}</p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-4 bg-gray-50 border-t dark:bg-gray-800/50 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre del paciente"
                        name={`patient_name_${testimonial.id}`}
                        value={testimonial.patient_name || ''}
                        onChange={(e) => handleTestimonialFieldChange(testimonial.id, 'patient_name', e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        labelClassName="dark:text-gray-300"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                          Valoración (1 a 5)
                        </label>
                        <select
                          value={testimonial.rating ?? ''}
                          onChange={(e) =>
                            handleTestimonialFieldChange(
                              testimonial.id,
                              'rating',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Sin valoración</option>
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} {value === 1 ? 'estrella' : 'estrellas'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Foto del Paciente
                      </label>
                      <DragDropUpload
                        type="testimonial-photo"
                        currentUrl={testimonial.photo_url}
                        onUploadSuccess={(photoUrl) => {
                          const formattedUrl = photoUrl.startsWith('/uploads') ? photoUrl : `/uploads/${photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl}`
                          handleTestimonialFieldChange(testimonial.id, 'photo_url', formattedUrl)
                        }}
                        primaryColor={primaryColor}
                      />
                    </div>
                    <div className="flex items-start mt-4">
                      <div className="flex-shrink-0">
                        {testimonial.photo_url ? (
                          <img
                            key={testimonial.photo_url}
                            src={(() => {
                              const url = testimonial.photo_url
                              if (url.startsWith('http')) return url

                              const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
                              const serverRoot = apiBase.replace(/\/api\/v1\/?$/, '');

                              if (url.startsWith('/uploads')) return `${serverRoot}${url}`
                              if (url.startsWith('/testimonials/')) return `${serverRoot}/uploads${url}`
                              if (url.startsWith('testimonials/')) return `${serverRoot}/uploads/${url}`
                              return `${serverRoot}/uploads/${url.startsWith('/') ? url.slice(1) : url}`
                            })()}
                            alt={testimonial.patient_name}
                            className="w-20 h-20 rounded-full object-cover border-2"
                            style={{ borderColor: primaryColor }}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-20 h-20 rounded-full ${testimonial.photo_url ? 'hidden' : 'flex'} items-center justify-center text-white font-bold border-2`}
                          style={{
                            backgroundColor: primaryColor,
                            borderColor: primaryColor
                          }}
                        >
                          {testimonial.patient_name ? testimonial.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                      </div>
                      <p className="ml-4 text-sm text-gray-500 self-center">
                        Vista previa de la foto que se mostrará en la sección pública.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Comentario del paciente</label>
                      <textarea
                        value={testimonial.content || ''}
                        onChange={(e) => handleTestimonialFieldChange(testimonial.id, 'content', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Escribe el testimonio..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="secondary"
                        onClick={() => handleTestimonialFieldChange(testimonial.id, 'content', testimonial.content)}
                        disabled={testimonialSavingId === testimonial.id}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleSaveTestimonial(testimonial)}
                        disabled={testimonialSavingId === testimonial.id}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white"
                      >
                        {testimonialSavingId === testimonial.id ? 'Guardando...' : 'Guardar testimonio'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TestimonialsSection