import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useToastStore } from '../../store/toastStore'
import { contactService } from '../../services/contactService'

export default function AppointmentRequestModal({ isOpen, onClose, doctorSlug, primaryColor }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: 'Control Ginecologico',
    date: '',
    time: ''
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToastStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formattedMessage = `
Motivo: ${formData.reason}
Fecha Solicitada: ${formData.date}
Hora Solicitada: ${formData.time}
`.trim();

      // Re-using the contactService to send the lead directly to the doctor's inbox/email
      await contactService.sendMessage({
        doctor_slug: doctorSlug,
        ...formData,
        // Prefijo opcional para distinguir que es una solicitud de cita
        message: `[SOLICITUD DE CITA] ${formattedMessage}`
      })
      showToast('Solicitud enviada con éxito. La doctora te contactará pronto.', 'success')
      setFormData({ name: '', email: '', phone: '', reason: 'Control Ginecologico', date: '', time: '' })
      onClose()
    } catch (error) {
      showToast('Error al enviar la solicitud', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Cita">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            placeholder="Ej. Ana Pérez"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            placeholder="tumail@ejemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono (WhatsApp)</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            placeholder="Ej. +584141234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de la Cita</label>
          <select
            required
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="Control Ginecologico">Control Ginecologico</option>
            <option value="Control Prenatal">Control Prenatal</option>
            <option value="Dolor pelvico">Dolor pelvico</option>
            <option value="Sangrado">Sangrado</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha solicitada</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora solicitada</label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} primaryColor={primaryColor}>
            {loading ? 'Enviando...' : 'Pedir Cita'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
