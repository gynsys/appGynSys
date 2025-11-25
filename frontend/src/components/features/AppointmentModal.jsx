import { useState } from 'react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { appointmentService } from '../../services/appointmentService'

export default function AppointmentModal({ isOpen, onClose, doctorId, primaryColor = '#4F46E5' }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_type: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Convertir fecha local a formato ISO para el backend
      const appointmentData = {
        ...formData,
        doctor_id: doctorId,
      }
      
      // Si hay fecha, convertirla a formato ISO
      if (appointmentData.appointment_date) {
        const date = new Date(appointmentData.appointment_date)
        appointmentData.appointment_date = date.toISOString()
      }
      
      await appointmentService.createAppointment(appointmentData)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({
          patient_name: '',
          patient_email: '',
          patient_phone: '',
          appointment_date: '',
          appointment_type: '',
          notes: '',
        })
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="¡Cita Agendada!" size="md">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Cita Agendada Exitosamente!
          </h3>
          <p className="text-gray-600">
            Te contactaremos pronto para confirmar tu cita.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agendar Cita" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre Completo"
            name="patient_name"
            value={formData.patient_name}
            onChange={handleChange}
            required
            placeholder="Tu nombre completo"
          />

          <Input
            label="Email"
            name="patient_email"
            type="email"
            value={formData.patient_email}
            onChange={handleChange}
            placeholder="tu@email.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            name="patient_phone"
            type="tel"
            value={formData.patient_phone}
            onChange={handleChange}
            placeholder="+1234567890"
          />

          <Input
            label="Fecha y Hora"
            name="appointment_date"
            type="datetime-local"
            value={formData.appointment_date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Consulta
          </label>
          <select
            name="appointment_type"
            value={formData.appointment_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            style={{ focusRingColor: primaryColor }}
          >
            <option value="">Selecciona un tipo</option>
            <option value="Consulta General">Consulta General</option>
            <option value="Control">Control</option>
            <option value="Revisión">Revisión</option>
            <option value="Seguimiento">Seguimiento</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Adicionales (Opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Información adicional sobre tu consulta..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: primaryColor }}
            className="text-white hover:opacity-90"
          >
            {loading ? 'Agendando...' : 'Agendar Cita'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

