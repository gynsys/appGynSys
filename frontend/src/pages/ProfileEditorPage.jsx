import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doctorService } from '../services/doctorService'
import { useAuthStore } from '../store/authStore'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import FileUpload from '../components/features/FileUpload'
import Spinner from '../components/common/Spinner'

export default function ProfileEditorPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    especialidad: '',
    biografia: '',
    theme_primary_color: '#4F46E5',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const fetchDoctor = async () => {
      try {
        const data = await doctorService.getCurrentUser()
        setDoctor(data)
        setFormData({
          nombre_completo: data.nombre_completo || '',
          especialidad: data.especialidad || '',
          biografia: data.biografia || '',
          theme_primary_color: data.theme_primary_color || '#4F46E5',
        })
      } catch (err) {
        setError('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchDoctor()
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const updated = await doctorService.updateCurrentUser(formData)
      setDoctor(updated)
      setSuccess('Perfil actualizado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (logoUrl) => {
    try {
      const updated = await doctorService.updateCurrentUser({ logo_url: logoUrl })
      setDoctor(updated)
      setSuccess('Logo actualizado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Error al actualizar el logo')
    }
  }

  const handlePhotoUpload = async (photoUrl) => {
    try {
      const updated = await doctorService.updateCurrentUser({ photo_url: photoUrl })
      setDoctor(updated)
      setSuccess('Foto actualizada exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Error al actualizar la foto')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const primaryColor = doctor?.theme_primary_color || '#4F46E5'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Editar Perfil</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo</h2>
              <FileUpload
                type="logo"
                currentUrl={doctor?.logo_url}
                onUploadSuccess={handleLogoUpload}
                primaryColor={primaryColor}
              />
            </div>

            {/* Photo Upload */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
              <FileUpload
                type="photo"
                currentUrl={doctor?.photo_url}
                onUploadSuccess={handlePhotoUpload}
                primaryColor={primaryColor}
              />
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Información Básica</h2>
              
              <Input
                label="Nombre Completo"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
              />

              <Input
                label="Especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                placeholder="Ej: Ginecólogo - Obstetra"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  name="biografia"
                  value={formData.biografia}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Escribe tu biografía profesional..."
                />
              </div>

              <Input
                label="Color Primario (Hex)"
                name="theme_primary_color"
                type="color"
                value={formData.theme_primary_color}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: primaryColor }}
                className="text-white"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

