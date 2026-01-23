import { useState, useEffect } from 'react'
import { testimonialService } from '../../services/testimonialService'
import { useToastStore } from '../../store/toastStore'

export const useTestimonials = () => {
  const { toast } = useToastStore()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [testimonialSavingId, setTestimonialSavingId] = useState(null)
  const [expandedTestimonialId, setExpandedTestimonialId] = useState(null)

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    setLoading(true)
    try {
      const data = await testimonialService.getMyTestimonials()
      setTestimonials(data || [])
    } catch (err) {
      toast.error('Error al cargar testimonios')
    } finally {
      setLoading(false)
    }
  }

  const handleTestimonialFieldChange = (id, field, value) => {
    setTestimonials(prev =>
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    )
  }

  const handleSaveTestimonial = async (testimonial) => {
    setTestimonialSavingId(testimonial.id)
    try {
      const updated = await testimonialService.updateTestimonial(testimonial.id, {
        patient_name: testimonial.patient_name,
        rating: testimonial.rating,
        content: testimonial.content,
        photo_url: testimonial.photo_url
      })
      setTestimonials(prev =>
        prev.map(t => t.id === testimonial.id ? updated : t)
      )
      toast.success('Testimonio actualizado correctamente')
      setExpandedTestimonialId(null)
      // Trigger updates
      localStorage.setItem('testimonials_updated', Date.now().toString())
      window.dispatchEvent(new CustomEvent('testimonialsUpdated'))
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      toast.error('Error al actualizar el testimonio')
    } finally {
      setTestimonialSavingId(null)
    }
  }

  return {
    testimonials,
    loading,
    testimonialSavingId,
    expandedTestimonialId,
    setExpandedTestimonialId,
    loadTestimonials,
    handleTestimonialFieldChange,
    handleSaveTestimonial
  }
}