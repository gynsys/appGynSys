import React from 'react'
import Modal from '../common/Modal'
import { FiTrash2 } from 'react-icons/fi'
import Button from '../common/Button'
import Input from '../common/Input'
import Spinner from '../common/Spinner'

const FAQsSection = ({
  faqs,
  loading,
  faqSavingId,
  expandedFaqId,
  setExpandedFaqId,
  newFaq,
  setNewFaq,
  handleFaqFieldChange,
  handleSaveFAQ,
  handleDeleteFAQ,
  handleCreateFAQ,
  doctor
}) => {
  const primaryColor = doctor?.theme_primary_color || '#4F46E5'
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [faqToDelete, setFaqToDelete] = React.useState(null)

  const handleDeleteClick = (faqId) => {
    setFaqToDelete(faqId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!faqToDelete) return
    await handleDeleteFAQ(faqToDelete)
    setShowDeleteModal(false)
    setFaqToDelete(null)
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Preguntas Frecuentes</h2>
        <Button
          variant="outline"
          onClick={() => window.location.reload()} // Simplified
          className="text-sm"
        >
          Refrescar
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-6 dark:text-gray-400">
        Gestiona las preguntas frecuentes que se muestran en tu página pública.
      </p>

      {/* Create New FAQ */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Nueva Pregunta Frecuente</h3>
        <div className="space-y-4">
          <Input
            label="Pregunta"
            value={newFaq.question}
            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
            placeholder="Ej: ¿Cuáles son sus horarios de atención?"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            labelClassName="dark:text-gray-300"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Respuesta
            </label>
            <textarea
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Escribe la respuesta a la pregunta..."
            />
          </div>
          <div className="flex items-center space-x-4">

            <div className="flex items-end">
              <Button
                onClick={handleCreateFAQ}
                style={{ backgroundColor: primaryColor }}
                className="text-white"
              >
                Crear FAQ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing FAQs */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          No hay preguntas frecuentes. Crea una nueva arriba.
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedFaqId === faq.id ? 'transform rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedFaqId === faq.id && (
                <div className="px-5 pb-5 pt-2 space-y-4 bg-gray-50 border-t dark:bg-gray-800/50 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                      Pregunta
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFaqFieldChange(faq.id, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                      Respuesta
                    </label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => handleFaqFieldChange(faq.id, 'answer', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteClick(faq.id)}
                      disabled={faqSavingId === faq.id}
                    >
                      Eliminar
                    </Button>
                    <Button
                      onClick={() => handleSaveFAQ(faq)}
                      disabled={faqSavingId === faq.id}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white"
                    >
                      {faqSavingId === faq.id ? 'Guardando...' : 'Guardar FAQ'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
            ¿Estás seguro de que deseas eliminar esta pregunta frecuente?
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
  )
}

export default FAQsSection