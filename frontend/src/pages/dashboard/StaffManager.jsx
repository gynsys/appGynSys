import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import GynSysLoader from '../../components/common/GynSysLoader';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import api from '../../lib/axios';

export default function StaffManager() {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/staff/');
      setStaffList(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('Error al cargar la lista de personal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo || !formData.email || !formData.password) {
      showToast('Por favor, completa todos los campos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/staff/', formData);
      showToast('Médico añadido exitosamente. Se le ha enviado un correo con sus credenciales.', 'success');
      setShowAddModal(false);
      setFormData({ nombre_completo: '', email: '', password: '' });
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      showToast(error.response?.data?.detail || 'Error al añadir médico', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/staff/${staffToDelete.id}`);
      showToast('Médico eliminado exitosamente', 'success');
      setShowDeleteModal(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      showToast('Error al eliminar médico', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <GynSysLoader fullScreen={false} text="Cargando personal..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Personal</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra los médicos que tienen acceso a la plataforma institucional.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Médico
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {staffList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {staff.nombre_completo.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{staff.nombre_completo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {staff.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(staff)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay médicos registrados</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza añadiendo un médico a tu clínica.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Añadir Médico">
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Temporal</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">El médico podrá cambiarla después de iniciar sesión.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Añadiendo...' : 'Añadir Médico'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Médico">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar al médico <strong>{staffToDelete?.nombre_completo}</strong>?
            Esta acción revocará su acceso al sistema de la clínica.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
