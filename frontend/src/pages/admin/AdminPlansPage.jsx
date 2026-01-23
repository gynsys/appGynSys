import { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAdminStore } from '../../store/adminStore'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { useToastStore } from '../../store/toastStore'
import { FiTrash2 } from 'react-icons/fi'

export default function AdminPlansPage() {
  const {
    plans,
    loading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  } = useAdminStore()

  const { showToast } = useToastStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [errorShown, setErrorShown] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    max_testimonials: 10,
    max_gallery_images: 20,
    max_faqs: 15,
    custom_domain: false,
    analytics_dashboard: false,
    priority_support: false,
    features: '',
    is_active: true
  })

  useEffect(() => {
    if (plans.length === 0 && !loading) {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      await fetchPlans()
    } catch (error) {
      showToast('Error al cargar los planes', 'error')
    }
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        max_testimonials: parseInt(formData.max_testimonials),
        max_gallery_images: parseInt(formData.max_gallery_images),
        max_faqs: parseInt(formData.max_faqs),
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : []
      }
      await createPlan(planData)
      setShowCreateModal(false)
      resetForm()
      showToast('Plan creado exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al crear plan', 'error')
    }
  }

  const handleEditPlan = async (e) => {
    e.preventDefault()
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        max_testimonials: parseInt(formData.max_testimonials),
        max_gallery_images: parseInt(formData.max_gallery_images),
        max_faqs: parseInt(formData.max_faqs),
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : []
      }
      await updatePlan(selectedPlan.id, planData)
      setShowEditModal(false)
      setSelectedPlan(null)
      resetForm()
      showToast('Plan actualizado exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al actualizar plan', 'error')
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [planToDelete, setPlanToDelete] = useState(null)

  const handleDeleteClick = (planId) => {
    setPlanToDelete(planId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!planToDelete) return

    try {
      await deletePlan(planToDelete)
      showToast('Plan eliminado exitosamente', 'success')
      setShowDeleteModal(false)
      setPlanToDelete(null)
    } catch (error) {
      showToast('Error al eliminar plan', 'error')
    }
  }

  const openEditModal = (plan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price ? plan.price.toString() : '',
      max_testimonials: plan.max_testimonials || 10,
      max_gallery_images: plan.max_gallery_images || 20,
      max_faqs: plan.max_faqs || 15,
      custom_domain: plan.custom_domain || false,
      analytics_dashboard: plan.analytics_dashboard || false,
      priority_support: plan.priority_support || false,
      features: plan.features ? plan.features.join('\n') : '',
      is_active: plan.is_active
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      max_testimonials: 10,
      max_gallery_images: 20,
      max_faqs: 15,
      custom_domain: false,
      analytics_dashboard: false,
      priority_support: false,
      features: '',
      is_active: true
    })
  }

  return (
    <AdminLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Planes</h1>
            <p className="mt-2 text-gray-600">Administra los planes de suscripción disponibles</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Plan
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {plan.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Precio:</span>
                      <span className="text-sm font-semibold">${plan.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Máx. Testimonios:</span>
                      <span className="text-sm font-semibold">{plan.max_testimonials}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Máx. Imágenes Galería:</span>
                      <span className="text-sm font-semibold">{plan.max_gallery_images}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Máx. FAQs:</span>
                      <span className="text-sm font-semibold">{plan.max_faqs}</span>
                    </div>
                  </div>

                  {(plan.custom_domain || plan.analytics_dashboard || plan.priority_support) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Características Premium:</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.custom_domain && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Dominio Personalizado
                          </span>
                        )}
                        {plan.analytics_dashboard && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Dashboard Analytics
                          </span>
                        )}
                        {plan.priority_support && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Soporte Prioritario
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Características:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-gray-500">+{plan.features.length - 3} más...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openEditModal(plan)}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(plan.id)}
                      size="sm"
                      variant="danger"
                      className="flex-1"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {plans.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay planes</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer plan de suscripción.</p>
          </div>
        )}

        {/* Create Plan Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nuevo Plan"
        >
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo Testimonios *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_testimonials}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_testimonials: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo Imágenes Galería *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_gallery_images}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_gallery_images: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo FAQs *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_faqs}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_faqs: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="custom_domain"
                  checked={formData.custom_domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="custom_domain" className="ml-2 block text-sm text-gray-900">
                  Dominio Personalizado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="analytics_dashboard"
                  checked={formData.analytics_dashboard}
                  onChange={(e) => setFormData(prev => ({ ...prev, analytics_dashboard: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="analytics_dashboard" className="ml-2 block text-sm text-gray-900">
                  Dashboard de Analytics
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="priority_support"
                  checked={formData.priority_support}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority_support: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="priority_support" className="ml-2 block text-sm text-gray-900">
                  Soporte Prioritario
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Características (una por línea)
              </label>
              <textarea
                rows={4}
                placeholder="Característica 1&#10;Característica 2&#10;Característica 3"
                value={formData.features}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Crear Plan'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Plan Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Plan"
        >
          <form onSubmit={handleEditPlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo Testimonios *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_testimonials}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_testimonials: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo Imágenes Galería *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_gallery_images}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_gallery_images: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo FAQs *
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_faqs}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_faqs: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_custom_domain"
                  checked={formData.custom_domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_custom_domain" className="ml-2 block text-sm text-gray-900">
                  Dominio Personalizado
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_analytics_dashboard"
                  checked={formData.analytics_dashboard}
                  onChange={(e) => setFormData(prev => ({ ...prev, analytics_dashboard: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_analytics_dashboard" className="ml-2 block text-sm text-gray-900">
                  Dashboard de Analytics
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_priority_support"
                  checked={formData.priority_support}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority_support: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_priority_support" className="ml-2 block text-sm text-gray-900">
                  Soporte Prioritario
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Características (una por línea)
              </label>
              <textarea
                rows={4}
                placeholder="Característica 1&#10;Característica 2&#10;Característica 3"
                value={formData.features}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Actualizar Plan'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirmar eliminación"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center text-red-100 bg-red-100 w-12 h-12 rounded-full mx-auto mb-4">
              <FiTrash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-600 text-center">
              ¿Estás seguro de que deseas eliminar este plan?
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout >
  )
}