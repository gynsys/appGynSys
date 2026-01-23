import { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAdminStore } from '../../store/adminStore'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { useToastStore } from '../../store/toastStore'
import { FiTrash2 } from 'react-icons/fi'

export default function AdminModulesPage() {
  const {
    modules,
    loading,
    error,
    fetchModules,

    updateModule,
    deleteModule
  } = useAdminStore()

  const { showToast } = useToastStore()


  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // NOTE: This fetches ALL modules from the database.
      // The backend endpoint `read_modules` in `backend/app/api/v1/endpoints/admin.py`
      // must have `active_only=False` to return inactive modules like 'chat' initially.
      // If a new module doesn't appear here, check that endpoint first!
      const fetchedModules = await fetchModules()
      console.log('🔍 DEBUG - Modules fetched from API:', fetchedModules)
      console.log('🔍 DEBUG - Total modules:', fetchedModules?.length)
      console.log('🔍 DEBUG - Module codes:', fetchedModules?.map(m => m.code))
    } catch (error) {
      console.error('❌ DEBUG - Error loading modules:', error)
      showToast('Error al cargar los módulos', 'error')
    }
  }



  const handleEditModule = async (e) => {
    e.preventDefault()
    try {
      await updateModule(selectedModule.id, formData)
      setShowEditModal(false)
      setSelectedModule(null)
      resetForm()
      showToast('Módulo actualizado exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al actualizar módulo', 'error')
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState(null)

  const handleDeleteClick = (moduleId) => {
    setModuleToDelete(moduleId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!moduleToDelete) return

    try {
      await deleteModule(moduleToDelete)
      showToast('Módulo eliminado exitosamente', 'success')
      setShowDeleteModal(false)
      setModuleToDelete(null)
    } catch (error) {
      showToast('Error al eliminar módulo', 'error')
    }
  }

  const openEditModal = (module) => {
    setSelectedModule(module)
    setFormData({
      name: module.name,
      code: module.code,
      description: module.description,
      is_active: module.is_active
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    })
  }

  return (
    <AdminLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Módulos</h1>
            <p className="mt-2 text-gray-600">Administra los módulos disponibles en el sistema</p>
          </div>
        </div>

        {/* Modules List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    console.log('🎨 DEBUG - Modules in render:', modules)
                    console.log('🎨 DEBUG - Modules count:', modules?.length)

                    return modules
                      // ---------------------------------------------------------------------
                      // ⚠️ IMPORTANTE: FILTRO DE MÓDULOS SAAS
                      // Solo mostramos los módulos "Extra" (de pago) en el panel de Admin.
                      // Los módulos estándar (Galería, Servicios, etc.) se gestionan internamente.
                      // ---------------------------------------------------------------------
                      .filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations', 'chat'].includes(m.code))
                      .map((module) => (
                        <tr key={module.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full ${module.is_active ? 'bg-green-400' : 'bg-gray-400'
                                  }`}></div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{module.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {module.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {module.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${module.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {module.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              onClick={() => openEditModal(module)}
                              size="sm"
                              variant="secondary"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(module.id)}
                              size="sm"
                              variant="danger"
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))
                  })()}
                </tbody>
              </table>
              {modules.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay módulos</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer módulo del sistema.</p>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Edit Module Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Módulo"
        >
          <form onSubmit={handleEditModule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Módulo *
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
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones bajos</p>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Actualizar Módulo'}
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
              ¿Estás seguro de que deseas eliminar este módulo?
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
    </AdminLayout>
  )
}