import { useState, useEffect } from 'react'
import { doctorService } from '../../services/doctorService'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

export const useProfileData = () => {
  const { user, loadUser } = useAuthStore()
  const toast = useToastStore()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    especialidad: '',
    universidad: '',
    biografia: '',
    services_section_title: '',
    theme_primary_color: '#4F46E5',
    theme_body_bg_color: '',
    theme_container_bg_color: '',
    design_template: 'glass',
    design_template: 'glass',
    profile_image_border: true,
    card_shadow: true,
    container_shadow: true,
    contact_email: '',
    show_certifications_carousel: false,
    enabled_modules: []
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await doctorService.getCurrentUser()
      setDoctor(data)

      // Extract enabled modules from modules_status
      const enabledModules = data.modules_status
        ? data.modules_status.filter(m => m.is_enabled_for_user).map(m => m.code)
        : (data.enabled_modules || [])

      setFormData({
        nombre_completo: data.nombre_completo || '',
        especialidad: data.especialidad || '',
        universidad: data.universidad || '',
        biografia: data.biografia || '',
        services_section_title: data.services_section_title || '',
        theme_primary_color: data.theme_primary_color || '#4F46E5',
        theme_body_bg_color: data.theme_body_bg_color || '',
        theme_container_bg_color: data.theme_container_bg_color || '',
        design_template: data.design_template || 'glass',
        profile_image_border: data.profile_image_border !== undefined ? data.profile_image_border : true,
        card_shadow: data.card_shadow !== undefined ? data.card_shadow : true,
        container_shadow: data.container_shadow !== undefined ? data.container_shadow : true,
        contact_email: data.contact_email || '',
        social_youtube: data.social_youtube || '',
        social_instagram: data.social_instagram || '',
        social_tiktok: data.social_tiktok || '',
        social_x: data.social_x || '',
        social_facebook: data.social_facebook || '',
        show_certifications_carousel: data.show_certifications_carousel || false,
        enabled_modules: enabledModules
      })
    } catch (err) {
      toast.error('Error al cargar el perfil')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await doctorService.updateCurrentUser(formData)
      toast.success('Perfil actualizado correctamente')
      loadProfile(true) // Silent reload
      loadUser(true)
    } catch (err) {
      toast.error('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (url) => {
    try {
      await doctorService.updateCurrentUser({ logo_url: url })
      toast.success('Logo actualizado correctamente')
      loadProfile(true) // Silent reload
      loadUser(true)
    } catch (err) {
      toast.error('Error al actualizar el logo')
    }
  }

  const handlePhotoUpload = async (url) => {
    try {
      await doctorService.updateCurrentUser({ photo_url: url })
      toast.success('Foto actualizada correctamente')
      loadProfile(true) // Silent reload
      loadUser(true)
    } catch (err) {
      toast.error('Error al actualizar la foto')
    }
  }

  return {
    doctor,
    loading,
    saving,
    formData,
    handleChange,
    handleSubmit,
    handleLogoUpload,
    handlePhotoUpload
  }
}