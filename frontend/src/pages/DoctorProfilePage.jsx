import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doctorService } from '../services/doctorService'
import Navbar from '../components/layout/Navbar'
import AppointmentModal from '../components/features/AppointmentModal'
import TestimonialsSection from '../components/features/TestimonialsSection'
import GallerySection from '../components/features/GallerySection'

export default function DoctorProfilePage() {
  const { slug } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true)
        const data = await doctorService.getDoctorProfileBySlug(slug)
        setDoctor(data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Perfil no encontrado')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchDoctor()
    }
  }, [slug])

  // Apply theme colors dynamically
  useEffect(() => {
    if (doctor?.theme_primary_color) {
      document.documentElement.style.setProperty(
        '--primary-color',
        doctor.theme_primary_color
      )
    }
  }, [doctor])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil no encontrado</h1>
          <p className="text-gray-600">{error || 'El perfil que buscas no existe'}</p>
        </div>
      </div>
    )
  }

  const primaryColor = doctor.theme_primary_color || '#4F46E5' // Default indigo

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Navbar */}
      <Navbar 
        doctor={doctor} 
        primaryColor={primaryColor}
        onAppointmentClick={() => setIsAppointmentModalOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section - Right after navbar */}
        <section id="sobre-mi" className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Sobre Mí</h2>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Doctor Photo */}
                <div className="md:col-span-1 flex justify-center">
                  {doctor.photo_url ? (
                    <div className="relative">
                      <img
                        src={doctor.photo_url.startsWith('http') ? doctor.photo_url : `http://localhost:8000${doctor.photo_url}`}
                        alt={doctor.nombre_completo}
                        className="w-64 h-64 rounded-full object-cover shadow-lg border-4"
                        style={{ borderColor: primaryColor }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextElementSibling.style.display = 'flex'
                        }}
                      />
                      <div 
                        className="w-64 h-64 rounded-full hidden items-center justify-center text-6xl font-bold text-white shadow-lg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {doctor.nombre_completo.charAt(0)}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-64 h-64 rounded-full flex items-center justify-center text-6xl font-bold text-white shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {doctor.nombre_completo.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* About Content */}
                <div className="md:col-span-2">
                  {doctor.biografia ? (
                    <div className="space-y-4">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {doctor.biografia}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Soy la <strong>{doctor.nombre_completo}</strong>, {doctor.especialidad || 'Ginecólogo - Obstetra'} 
                        graduada de la prestigiosa <strong>Universidad Central de Venezuela (UCV)</strong>, 
                        una de las instituciones médicas más reconocidas de Latinoamérica.
                      </p>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Con años de experiencia en el campo de la ginecología y obstetricia, 
                        me especializo en el diagnóstico y tratamiento de <strong>Endometriosis</strong>, 
                        una condición que afecta a millones de mujeres en todo el mundo.
                      </p>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Mi enfoque se centra en brindar atención integral, personalizada y empática 
                        a cada una de mis pacientes, utilizando las técnicas más avanzadas y 
                        actualizadas en el campo de la medicina reproductiva y ginecológica.
                      </p>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Estoy comprometida con la educación de mis pacientes, ayudándolas a 
                        comprender su salud reproductiva y proporcionándoles las herramientas 
                        necesarias para tomar decisiones informadas sobre su bienestar.
                      </p>
                    </div>
                  )}
                  
                  {/* Credentials */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Formación Académica</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Ginecólogo - Obstetra, Universidad Central de Venezuela (UCV)</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Especialista en Endometriosis</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nuestros Servicios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Agendar Cita</h3>
                <p className="text-gray-600 mb-6">
                  Reserva tu cita de manera rápida y sencilla. Elige el horario que mejor se adapte a ti.
                </p>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Agendar Ahora
                </button>
              </div>
              <div className="text-center p-8 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pre-consulta</h3>
                <p className="text-gray-600 mb-6">
                  Completa el formulario antes de tu visita para agilizar el proceso.
                </p>
                <button
                  className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Llenar Formulario
                </button>
              </div>
              <div className="text-center p-8 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blog Médico</h3>
                <p className="text-gray-600 mb-6">
                  Lee artículos y consejos de salud escritos por nuestro equipo médico.
                </p>
                <button
                  className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Ver Blog
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection doctorSlug={slug} primaryColor={primaryColor} />

        {/* Gallery Section */}
        <GallerySection doctorSlug={slug} primaryColor={primaryColor} />
      </main>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        doctorId={doctor.id}
        primaryColor={primaryColor}
      />

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © {new Date().getFullYear()} {doctor.nombre_completo}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

