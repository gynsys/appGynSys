import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiHome, FiLayout, FiTrash2 } from 'react-icons/fi'
import { locationService } from '../../services/locationService'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import DragDropUpload from '../../components/features/DragDropUpload'
import { getImageUrl } from '../../lib/imageUtils'

const generateScheduleLabel = (days, hours) => {
  if (!days || days.length === 0) return 'Sin horario definido';

  const dayNames = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };

  const sortedDays = [...days].sort((a, b) => {
    // Adjust logic if Monday(1) is first and Sunday(0) last, or standard JS.
    // Let's treat 1-6 then 0 as last (Mon-Sun)
    const orderA = a === 0 ? 7 : a;
    const orderB = b === 0 ? 7 : b;
    return orderA - orderB;
  });

  // Check for consecutive range (e.g. Mon-Fri)
  let dayString = '';
  const isConsecutive = sortedDays.every((day, index) => {
    if (index === 0) return true;
    const prev = sortedDays[index - 1];
    const prevOrder = prev === 0 ? 7 : prev;
    const currOrder = day === 0 ? 7 : day;
    return currOrder === prevOrder + 1;
  });

  if (isConsecutive && sortedDays.length > 2) {
    dayString = `${dayNames[sortedDays[0]]} a ${dayNames[sortedDays[sortedDays.length - 1]]}`;
  } else {
    dayString = sortedDays.map(d => dayNames[d]).join(', ');
  }

  const formatTime = (h) => {
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}${ampm}`;
  };

  return `${dayString} de ${formatTime(hours.start)} a ${formatTime(hours.end)}`;
};

export default function LocationsManager() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    google_maps_url: '',
    image_url: '',
    schedule: {
      label: '',
      days: [1, 2, 3, 4, 5],
      hours: { start: 8, end: 17 }
    }
  })
  const { showToast } = useToastStore()
  const { user } = useAuthStore()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const data = await locationService.getMyLocations()
      setLocations(data)
    } catch (error) {
      showToast('Error al cargar ubicaciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (location = null) => {
    if (location) {
      setCurrentLocation(location)
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city || '',
        phone: location.phone || '',
        google_maps_url: location.google_maps_url || '',
        image_url: location.image_url || '',
        schedule: location.schedule || {
          label: 'Lunes a Viernes de 8am a 5pm',
          days: [1, 2, 3, 4, 5],
          hours: { start: 8, end: 17 }
        }
      })
    } else {
      setCurrentLocation(null)
      setFormData({
        name: '',
        address: '',
        city: '',
        phone: '',
        google_maps_url: '',
        image_url: '',
        schedule: {
          label: 'Lunes a Viernes de 8am a 5pm',
          days: [1, 2, 3, 4, 5],
          hours: { start: 8, end: 17 }
        }
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentLocation) {
        await locationService.updateLocation(currentLocation.id, formData)
        showToast('Ubicación actualizada', 'success')
      } else {
        await locationService.createLocation(formData)
        showToast('Ubicación creada', 'success')
      }
      setIsModalOpen(false)
      loadLocations()
    } catch (error) {
      showToast('Error al guardar ubicación', 'error')
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState(null)

  const handleDeleteClick = (id) => {
    setLocationToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!locationToDelete) return

    try {
      await locationService.deleteLocation(locationToDelete)
      showToast('Ubicación eliminada', 'success')
      loadLocations()
      setIsDeleteModalOpen(false)
      setLocationToDelete(null)
    } catch (error) {
      showToast('Error al eliminar ubicación', 'error')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Ubicaciones</h1>
        <Button onClick={() => handleOpenModal()}>
          Nueva Ubicación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {location.image_url && (
              <img
                src={getImageUrl(location.image_url)}
                alt={location.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{location.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{location.address}</p>
              {location.city && <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{location.city}</p>}
              {location.phone && <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">📞 {location.phone}</p>}

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenModal(location)}
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(location.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen de la Sede</label>
            <DragDropUpload
              type="location-photo"
              currentUrl={formData.image_url}
              onUploadSuccess={(url) => setFormData({ ...formData, image_url: url })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Ej. Consultorio Centro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Google Maps</label>
            <input
              type="url"
              value={formData.google_maps_url}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Configuración de Horario (Chatbot)</h3>



            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Días Laborales</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 1, label: 'Lun' },
                  { id: 2, label: 'Mar' },
                  { id: 3, label: 'Mié' },
                  { id: 4, label: 'Jue' },
                  { id: 5, label: 'Vie' },
                  { id: 6, label: 'Sáb' },
                  { id: 0, label: 'Dom' }
                ].map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      const currentDays = formData.schedule?.days || [];
                      const newDays = currentDays.includes(day.id)
                        ? currentDays.filter(d => d !== day.id)
                        : [...currentDays, day.id].sort(); // Sorted for consistent display

                      const newLabel = generateScheduleLabel(newDays, formData.schedule?.hours);

                      setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, days: newDays, label: newLabel }
                      });
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${(formData.schedule?.days || []).includes(day.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Apertura (24h)</label>
                <select
                  value={formData.schedule?.hours?.start ?? 8}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    const newHours = { ...formData.schedule.hours, start: newStart };
                    const newLabel = generateScheduleLabel(formData.schedule.days, newHours);

                    setFormData({
                      ...formData,
                      schedule: {
                        ...formData.schedule,
                        hours: newHours,
                        label: newLabel
                      }
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Cierre (24h)</label>
                <select
                  value={formData.schedule?.hours?.end ?? 17}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value);
                    const newHours = { ...formData.schedule.hours, end: newEnd };
                    const newLabel = generateScheduleLabel(formData.schedule.days, newHours);

                    setFormData({
                      ...formData,
                      schedule: {
                        ...formData.schedule,
                        hours: newHours,
                        label: newLabel
                      }
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 dark:text-white"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiqueta del Horario (Automática)</label>
              <input
                type="text"
                disabled
                value={formData.schedule?.label || ''}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border cursor-not-allowed dark:text-gray-300"
                placeholder="Se generará automáticamente..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar
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
            ¿Estás seguro de eliminar esta ubicación? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="secondary"
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
    </div >
  )
}
