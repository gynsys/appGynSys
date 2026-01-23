import React, { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminHeader } from '../components/layout/AdminHeader'
import Spinner from '../components/common/Spinner'
import ProfileTabsLayout from '../components/profile-editor/ProfileTabsLayout'
import { useProfileData } from '../components/profile-editor/useProfileData'
import { useTestimonials } from '../components/profile-editor/useTestimonials'
import { useFAQs } from '../components/profile-editor/useFAQs'

const ProfileEditorPage = () => {
  const navigate = useNavigate()

  const profileData = useProfileData()
  const testimonialsData = useTestimonials()
  const faqsData = useFAQs()

  const { doctor, loading } = profileData

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el perfil</h1>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del perfil.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  const primaryColor = doctor?.theme_primary_color || '#4F46E5'

  return (
    <Fragment>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Navbar */}


        {/* Main Content */}
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="">
              <div className="flex items-center justify-between mb-8 px-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Perfil</h1>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  &larr; Volver
                </button>
              </div>

              <ProfileTabsLayout
                {...profileData}
                testimonialsData={testimonialsData}
                faqsData={faqsData}
              />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default ProfileEditorPage

