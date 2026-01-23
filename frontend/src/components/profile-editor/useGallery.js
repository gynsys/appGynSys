import { useState, useEffect } from 'react'
import { galleryService } from '../../services/galleryService'
import { useToastStore } from '../../store/toastStore'

export const useGallery = () => {
  const { toast } = useToastStore()
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [gallerySavingId, setGallerySavingId] = useState(null)
  const [expandedGalleryId, setExpandedGalleryId] = useState(null)
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false)

  useEffect(() => {
    loadGallery()
  }, [])

  const loadGallery = async () => {
    setLoading(true)
    try {
      const data = await galleryService.getMyGallery()
      setGallery(data || [])
    } catch (err) {
      toast.error('Error al cargar la galería')
    } finally {
      setLoading(false)
    }
  }

  const handleGalleryFieldChange = (id, field, value) => {
    setGallery(prev =>
      prev.map(img => img.id === id ? { ...img, [field]: value } : img)
    )
  }

  const handleSaveGalleryImage = async (galleryImage) => {
    setGallerySavingId(galleryImage.id)
    try {
      const updated = await galleryService.updateGalleryImage(galleryImage.id, {
        title: galleryImage.title,
        description: galleryImage.description,
        display_order: galleryImage.display_order,
        is_active: galleryImage.is_active
      })
      setGallery(prev =>
        prev.map(img => img.id === galleryImage.id ? updated : img)
      )
      toast.success('Imagen de galería actualizada correctamente')
      setExpandedGalleryId(null)
    } catch (err) {
      toast.error('Error al actualizar la imagen de galería')
    } finally {
      setGallerySavingId(null)
    }
  }

  const handleDeleteGalleryImage = async (galleryId) => {
    try {
      await galleryService.deleteGalleryImage(galleryId)
      setGallery(prev => prev.filter(img => img.id !== galleryId))
      toast.success('Imagen de galería eliminada correctamente')
    } catch (err) {
      toast.error('Error al eliminar la imagen de galería')
    }
  }

  const handleUploadGalleryImage = async (file, title = '', description = '') => {
    setUploadingGalleryImage(true)
    try {
      const created = await galleryService.uploadGalleryImage(file, title, description)
      setGallery(prev => [...prev, created])
      toast.success('Imagen subida correctamente')
      setExpandedGalleryId(created.id)
    } catch (err) {
      toast.error('Error al subir la imagen')
    } finally {
      setUploadingGalleryImage(false)
    }
  }

  return {
    gallery,
    loading,
    gallerySavingId,
    expandedGalleryId,
    setExpandedGalleryId,
    uploadingGalleryImage,
    loadGallery,
    handleGalleryFieldChange,
    handleSaveGalleryImage,
    handleDeleteGalleryImage,
    handleUploadGalleryImage
  }
}