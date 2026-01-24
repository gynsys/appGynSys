import { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAdminStore } from '../../store/adminStore'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import ScheduleModal from '../../components/features/ScheduleModal'
import { useToastStore } from '../../store/toastStore'

export default function AdminTenantsPage() {
  const {
    tenants,
    plans,
    modules,
    loading,
    error,
    fetchTenants,
    fetchPlans,
    fetchModules,
    createTenant,
    updateTenant,
    updateTenantStatus,
    deleteTenant,
    updateTenantModules
  } = useAdminStore()

  const { showToast } = useToastStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showModulesModal, setShowModulesModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [tenantToDelete, setTenantToDelete] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    plan_id: '',
    search: ''
  })

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    slug: '',
    telefono: '',
    especialidad: '',
    biografia: '',
    plan_id: '',
    status: 'active'
  })

  const [moduleSelections, setModuleSelections] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchTenants(),
        fetchPlans(),
        fetchModules()
      ])
    } catch (error) {
      showToast('Error al cargar los datos', 'error')
    }
  }

  const handleCreateTenant = async (e) => {
    e.preventDefault()
    try {
      await createTenant(formData)
      setShowCreateModal(false)
      setFormData({ nombre_completo: '', email: '', password: '', slug: '', telefono: '', especialidad: '', biografia: '', plan_id: '', status: 'active' })
      showToast('Tenant creado exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al crear tenant', 'error')
    }
  }

  const handleEditTenant = async (e) => {
    e.preventDefault()
    try {
      await updateTenant(selectedTenant.id, formData)
      setShowEditModal(false)
      setSelectedTenant(null)
      showToast('Tenant actualizado exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al actualizar tenant', 'error')
    }
  }

  const handleSaveSchedule = async (tenantId, scheduleData) => {
    try {
      await updateTenant(tenantId, scheduleData)
      setShowScheduleModal(false)
      setSelectedTenant(null)
      showToast('Horarios actualizados exitosamente', 'success')
    } catch (error) {
      showToast(error.message || 'Error al actualizar horarios', 'error')
    }
  }

  const openScheduleModal = (tenant) => {
    setSelectedTenant(tenant)
    setShowScheduleModal(true)
  }

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await updateTenantStatus(tenantId, { status: newStatus })
      showToast('Estado del tenant actualizado', 'success')
    } catch (error) {
      showToast('Error al actualizar estado', 'error')
    }
  }

  const handleDeleteTenant = (tenant) => {
    setTenantToDelete(tenant)
    setShowDeleteModal(true)
  }

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return

    try {
      await deleteTenant(tenantToDelete.id)
      setShowDeleteModal(false)
      setTenantToDelete(null)
      showToast('Tenant eliminado exitosamente', 'success')
    } catch (error) {
      showToast('Error al eliminar tenant', 'error')
    }
  }

  const openEditModal = (tenant) => {
    setSelectedTenant(tenant)
    setFormData({
      nombre_completo: tenant.nombre_completo,
      email: tenant.email,
      slug: tenant.slug,
      telefono: tenant.telefono || '',
      especialidad: tenant.especialidad || '',
      biografia: tenant.biografia || '',
      plan_id: tenant.plan_id,
      status: tenant.status
    })
    setShowEditModal(true)
  }

  const openModulesModal = (tenant) => {
    setSelectedTenant(tenant)
    // Initialize module selections based on enabled modules
    // Handle both array of strings (from list) and array of objects (from detail)
    const enabledModuleCodes = tenant.enabled_modules?.map(m => (typeof m === 'object' ? m.code : m)) || []

    // -------------------------------------------------------------------------
    // ⚠️ IMPORTANTE: SI AGREGAS UN NUEVO MÓDULO (Ej: 'nuevo_modulo')
    // DEBES AGREGARLO A ESTA LISTA DE FILTRO PARA QUE APAREZCA EN ESTE MODAL.
    // -------------------------------------------------------------------------
    const filteredModules = modules.filter(module => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations', 'chat'].includes(module.code))

    setModuleSelections(filteredModules.map(module => ({
      module_id: module.id,
      is_enabled: enabledModuleCodes.includes(module.code)
    })))
    setShowModulesModal(true)
  }

  const handleModuleToggle = (moduleId) => {
    setModuleSelections(prev =>
      prev.map(selection =>
        selection.module_id === moduleId
          ? { ...selection, is_enabled: !selection.is_enabled }
          : selection
      )
    )
  }

  const handleUpdateModules = async () => {
    try {
      await updateTenantModules(selectedTenant.id, moduleSelections)
      setShowModulesModal(false)
      setSelectedTenant(null)
      showToast('Módulos del tenant actualizados', 'success')
    } catch (error) {
      showToast('Error al actualizar módulos', 'error')
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesStatus = !filters.status || tenant.status === filters.status
    const matchesPlan = !filters.plan_id || tenant.plan_id === parseInt(filters.plan_id)
    const matchesSearch = !filters.search ||
      tenant.nombre_completo.toLowerCase().includes(filters.search.toLowerCase()) ||
      tenant.email.toLowerCase().includes(filters.search.toLowerCase())

    return matchesStatus && matchesPlan && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Tenants</h1>
            <p className="mt-2 text-gray-600">Administra los tenants del sistema SaaS</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Tenant
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="suspended">Suspendido</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={filters.plan_id}
                onChange={(e) => setFilters(prev => ({ ...prev, plan_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ status: '', plan_id: '', search: '' })}
                variant="secondary"
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
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
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tenant.nombre_completo}</div>
                          <div className="text-sm text-gray-500">{tenant.email}</div>
                          <div className="text-sm text-gray-500">Slug: {tenant.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {plans.find(p => p.id === tenant.plan_id)?.name || 'Sin plan'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={tenant.status}
                          onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(tenant.status)}`}
                        >
                          <option value="active">Activo</option>
                          <option value="paused">Pausado</option>
                          <option value="suspended">Suspendido</option>
                          <option value="pending" disabled>Pendiente</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tenant.enabled_modules?.length || 0} módulos
                        </div>
                        <button
                          onClick={() => openModulesModal(tenant)}
                          className="text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          Gestionar
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => openScheduleModal(tenant)}
                          size="sm"
                          variant="outline"
                        >
                          📅 Horarios
                        </Button>
                        <Button
                          onClick={() => openEditModal(tenant)}
                          size="sm"
                          variant="secondary"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteTenant(tenant)}
                          size="sm"
                          variant="danger"
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTenants.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron tenants</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        {selectedTenant && (
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            tenant={selectedTenant}
            onSave={handleSaveSchedule}
          />
        )}

        {/* Create Tenant Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nuevo Tenant"
        >
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan *
              </label>
              <select
                required
                value={formData.plan_id}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_id: parseInt(e.target.value) || '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/mes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biografía
              </label>
              <textarea
                value={formData.biografia}
                onChange={(e) => setFormData(prev => ({ ...prev, biografia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Breve descripción del profesional..."
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
                {loading ? <Spinner size="sm" /> : 'Crear Tenant'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Tenant Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Tenant"
        >
          <form onSubmit={handleEditTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan
                </label>
                <select
                  value={formData.plan_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_id: parseInt(e.target.value) || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/mes
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biografía
              </label>
              <textarea
                value={formData.biografia || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, biografia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Breve descripción del profesional..."
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
                {loading ? <Spinner size="sm" /> : 'Actualizar Tenant'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modules Modal */}
        <Modal
          isOpen={showModulesModal}
          onClose={() => setShowModulesModal(false)}
          title={`Gestionar Extras - ${selectedTenant?.nombre_completo}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona los extras que estarán disponibles para este tenant:
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modules
                // ---------------------------------------------------------------------
                // ⚠️ IMPORTANTE: TAMBIÉN ACTUALIZAR ESTE FILTRO SI AGREGAS UN NUEVO MÓDULO
                // ---------------------------------------------------------------------
                .filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations'].includes(m.code))
                .map((module) => {
                  const isSelected = moduleSelections.find(s => s.module_id === module.id)?.is_enabled || false
                  return (
                    <div key={module.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleModuleToggle(module.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${module.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {module.is_active ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModulesModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateModules} disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Actualizar Extras'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Eliminar Tenant"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Esta acción es irreversible. Se eliminarán todos los datos asociados al tenant.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              ¿Estás seguro de que quieres eliminar al tenant <span className="font-bold text-gray-900">{tenantToDelete?.nombre_completo}</span>?
            </p>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteTenant}
                variant="danger"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : 'Sí, Eliminar Tenant'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}