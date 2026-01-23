import { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAdminStore } from '../../store/adminStore'
import Spinner from '../../components/common/Spinner'

export default function AdminDashboardPage() {
  const { tenants, plans, modules, fetchTenants, fetchPlans, fetchModules, loading, error } = useAdminStore()
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalPlans: 0,
    totalModules: 0
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchTenants(),
          fetchPlans(),
          fetchModules()
        ])
      } catch (error) {
      }
    }
    loadData()
  }, [fetchTenants, fetchPlans, fetchModules])

  useEffect(() => {
    if (tenants.length > 0 || plans.length > 0 || modules.length > 0) {
      setStats({
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'active').length,
        totalPlans: plans.length,
        totalModules: modules.filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations'].includes(m.code)).length
      })
    }
  }, [tenants, plans, modules])

  if (loading && tenants.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-4 text-red-700 bg-red-100 border-l-4 border-red-500 rounded shadow-md max-w-2xl w-full mx-4" role="alert">
            <p className="font-bold text-lg mb-2">Error cargando datos</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-2 text-gray-600">Gestión completa de tenants, planes y módulos del sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTenants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tenants Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeTenants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Planes Disponibles</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Módulos del Sistema</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalModules}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tenants */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Tenants Recientes</h3>
              <a href="/admin/tenants" className="text-sm text-indigo-600 hover:text-indigo-900">Ver todos</a>
            </div>
            <div className="p-6">
              {tenants.slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {tenants.slice(0, 5).map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(tenant.nombre_completo || tenant.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{tenant.nombre_completo}</p>
                          <p className="text-sm text-gray-500">{tenant.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : tenant.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {tenant.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay tenants registrados</p>
              )}
            </div>
          </div>

          {/* System Modules */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Módulos del Sistema</h3>
            </div>
            <div className="p-6">
              {modules.filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations'].includes(m.code)).length > 0 ? (
                <div className="space-y-4">
                  {modules.filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations'].includes(m.code)).map((module) => (
                    <div key={module.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${module.is_active ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{module.name}</p>
                          <p className="text-sm text-gray-500">{module.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${module.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {module.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay módulos configurados</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}