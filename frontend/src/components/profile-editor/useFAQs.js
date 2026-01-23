import { useState, useEffect } from 'react'
import { faqService } from '../../services/faqService'
import { useToastStore } from '../../store/toastStore'

export const useFAQs = () => {
  const { showToast } = useToastStore()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [faqSavingId, setFaqSavingId] = useState(null)
  const [expandedFaqId, setExpandedFaqId] = useState(null)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', display_order: 0 })

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    setLoading(true)
    try {
      const data = await faqService.getMyFAQs()
      setFaqs(data || [])
    } catch (err) {
      showToast('Error al cargar preguntas frecuentes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFaqFieldChange = (id, field, value) => {
    setFaqs(prev =>
      prev.map(f => f.id === id ? { ...f, [field]: value } : f)
    )
  }

  const handleSaveFAQ = async (faq) => {
    setFaqSavingId(faq.id)
    try {
      const updated = await faqService.updateFAQ(faq.id, {
        question: faq.question,
        answer: faq.answer,
        display_order: faq.display_order
      })
      setFaqs(prev =>
        prev.map(f => f.id === faq.id ? updated : f)
      )
      showToast('Pregunta frecuente actualizada correctamente', 'success')
      setExpandedFaqId(null)
    } catch (err) {
      showToast('Error al actualizar la pregunta frecuente', 'error')
    } finally {
      setFaqSavingId(null)
    }
  }

  const handleDeleteFAQ = async (faqId) => {
    try {
      await faqService.deleteFAQ(faqId)
      setFaqs(prev => prev.filter(f => f.id !== faqId))
      showToast('Pregunta frecuente eliminada correctamente', 'success')
    } catch (err) {
      showToast('Error al eliminar la pregunta frecuente', 'error')
    }
  }

  const handleCreateFAQ = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      showToast('Por favor completa la pregunta y la respuesta', 'error')
      return
    }
    try {
      const created = await faqService.createFAQ(newFaq)
      setFaqs(prev => [...prev, created])
      setNewFaq({ question: '', answer: '', display_order: 0 })
      showToast('Pregunta frecuente creada correctamente', 'success')
    } catch (err) {
      showToast('Error al crear la pregunta frecuente', 'error')
    }
  }

  return {
    faqs,
    loading,
    faqSavingId,
    expandedFaqId,
    setExpandedFaqId,
    newFaq,
    setNewFaq,
    loadFAQs,
    handleFaqFieldChange,
    handleSaveFAQ,
    handleDeleteFAQ,
    handleCreateFAQ
  }
}