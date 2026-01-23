import { useState, useEffect } from 'react'
import { blogService } from '../../modules/blog/services/blogService'
import { useProfileData } from '../../components/profile-editor/useProfileData'
import { FiLayout, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { servicesService } from '../../services/servicesService'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import DragDropUpload from '../../components/features/DragDropUpload'
import { getImageUrl } from '../../lib/imageUtils'

export default function ServicesManager() {
  // Profile data for section title
  const {
    formData,
    handleChange,
    handleSubmit: handleProfileSubmit,
    saving: savingProfile
  } = useProfileData()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentService, setCurrentService] = useState(null)
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_blog: false,
    blog_slug: ''
  })
  const [blogPosts, setBlogPosts] = useState([])
  // Cargar posts del blog para el selector
  useEffect(() => {
    if (isModalOpen && serviceForm.link_blog) {
      blogService.getMyPosts().then(posts => setBlogPosts(posts)).catch(() => setBlogPosts([]))
    }
  }, [isModalOpen, serviceForm.link_blog])
  const { showToast } = useToastStore()
  const { user } = useAuthStore()
  const primaryColor = user?.theme_primary_color || '#4F46E5'

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await servicesService.getMyServices()
      setServices(data)
    } catch (error) {
      showToast('Error al cargar servicios', 'error')
    } finally {
      setLoading(false)
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)

  const handleOpenModal = (service = null) => {
    if (service) {
      setCurrentService(service)
      setServiceForm({
        title: service.title,
        description: service.description || '',
        image_url: service.image_url || '',
        link_blog: !!service.blog_slug,
        blog_slug: service.blog_slug || ''
      })
    } else {
      setCurrentService(null)
      setServiceForm({
        title: '',
        description: '',
        image_url: '',
        link_blog: false,
        blog_slug: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...serviceForm,
        blog_slug: serviceForm.link_blog ? serviceForm.blog_slug : null
      }
      if (currentService) {
        await servicesService.updateService(currentService.id, payload)
        showToast('Servicio actualizado', 'success')
      } else {
        await servicesService.createService(payload)
        showToast('Servicio creado', 'success')
      }
      setIsModalOpen(false)
      loadServices()
    } catch (error) {
      showToast('Error al guardar servicio: ' + (error.response?.data?.detail || error.message), 'error')
    }
  }

  const handleDeleteClick = (id) => {
    setServiceToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return

    try {
      await servicesService.deleteService(serviceToDelete)
      showToast('Servicio eliminado', 'success')
      loadServices()
      setIsDeleteModalOpen(false)
      setServiceToDelete(null)
    } catch (error) {
      showToast('Error al eliminar servicio', 'error')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Servicios</h1>
          <Button onClick={() => handleOpenModal()} style={{ backgroundColor: primaryColor }}>
            Nuevo Servicio
          </Button>
        </div>

        {/* Editable services section title */}
        <form onSubmit={handleProfileSubmit} className="mb-8 flex items-center gap-4">
          <label htmlFor="services_section_title" className="text-lg font-medium text-gray-900 dark:text-white">Título de sección servicios:</label>
          <input
            id="services_section_title"
            name="services_section_title"
            type="text"
            value={formData.services_section_title || ''}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-96 bg-white dark:bg-gray-700 dark:text-white"
            placeholder="Ej: Nuestros Servicios"
            disabled={savingProfile}
          />
          <Button type="submit" style={{ backgroundColor: primaryColor }} disabled={savingProfile}>
            {savingProfile ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>

        <div className="flex flex-wrap justify-center gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden w-full sm:w-80">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                {service.image_url ? (
                  <img
                    src={getImageUrl(service.image_url)}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiLayout className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-6">{service.description}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No tienes servicios registrados.</p>
            <p className="text-gray-400 dark:text-gray-500">Agrega tus servicios para que aparezcan en tu perfil.</p>
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentService ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Imagen
            </label>
            <DragDropUpload
              type="service-image"
              onUploadSuccess={(url) => setServiceForm({ ...serviceForm, image_url: url })}
              currentUrl={serviceForm.image_url}
              primaryColor={primaryColor}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (máx 25 palabras recomendado)
            </label>
            <textarea
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="link_blog"
              checked={serviceForm.link_blog}
              onChange={e => setServiceForm({ ...serviceForm, link_blog: e.target.checked })}
            />
            <label htmlFor="link_blog" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enlace al Blog
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400" title="Marca este check para enlazar al blog">
              <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
              Marca este check para enlazar al blog
            </span>
          </div>
          {serviceForm.link_blog && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entrada de Blog asociada</label>
              <select
                value={serviceForm.blog_slug}
                onChange={e => setServiceForm({ ...serviceForm, blog_slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecciona una entrada...</option>
                {blogPosts.map(post => (
                  <option key={post.slug} value={post.slug}>{post.title}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">Solo se mostrarán entradas publicadas.</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" style={{ backgroundColor: primaryColor }}>
              {currentService ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center text-red-100 bg-red-100 w-12 h-12 rounded-full mx-auto mb-4">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            ¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
