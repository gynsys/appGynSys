import React, { useState } from 'react'
import { getImageUrl } from '../../lib/imageUtils'
import Modal from '../common/Modal'
import { FiTrash2 } from 'react-icons/fi'
import Button from '../common/Button'
import Input from '../common/Input'
import DragDropUpload from '../features/DragDropUpload'
import Spinner from '../common/Spinner'
import galleryService from '/src/services/galleryService.js'

const GallerySection = ({
  gallery,
  loading,
  gallerySavingId,
  expandedGalleryId,
  setExpandedGalleryId,
  uploadingGalleryImage,
  handleGalleryFieldChange,
  handleSaveGalleryImage,
  handleDeleteGalleryImage,
  handleUploadGalleryImage,
  doctor
}) => {
  const primaryColor = doctor?.theme_primary_color || '#4F46E5'
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState(null)
  const [isBulkDelete, setIsBulkDelete] = useState(false)

  const handleDeleteClick = (imageId) => {
    setImageToDelete(imageId)
    setIsBulkDelete(false)
    setShowDeleteModal(true)
  }

  const handleBulkDeleteClick = () => {
    setIsBulkDelete(true)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (isBulkDelete) {
      for (const imageId of selectedImages) {
        await handleDeleteGalleryImage(imageId)
      }
      setSelectedImages(new Set())
    } else if (imageToDelete) {
      await handleDeleteGalleryImage(imageToDelete)
    }
    setShowDeleteModal(false)
    setImageToDelete(null)
    setIsBulkDelete(false)
  }

  // Crear array de 10 posiciones fijas.
  // Prioriza imágenes con `display_order` válido (0-9).
  // Si display_order es inválido o >= 10, se trata como sin asignar.
  const assignedMap = new Map()
  const unassignedFeatured = []
  const unassignedOthers = []

    ; (gallery || []).forEach(img => {
      const order = Number(img.display_order)
      // Validar si tiene un slot asignado válido (0-9)
      if (typeof img.display_order === 'number' && order >= 0 && order < 10) {
        assignedMap.set(order, img)
      } else if (img.featured) {
        unassignedFeatured.push(img)
      } else {
        unassignedOthers.push(img)
      }
    })

  const fixedGallerySlots = Array.from({ length: 10 }, (_, index) => {
    let image = assignedMap.get(index) || null

    // Si el slot está vacío, rellenar con imágenes no asignadas
    if (!image) {
      // 1. Primero las featured
      if (unassignedFeatured.length > 0) {
        image = unassignedFeatured.shift()
      }
      // 2. Luego el resto
      else if (unassignedOthers.length > 0) {
        image = unassignedOthers.shift()
      }
    }
    return {
      slot: index,
      image: image || null,
      isOccupied: !!image
    }
  })

  const occupiedSlots = fixedGallerySlots.filter(slot => slot.isOccupied).length
  const canUploadMore = occupiedSlots < 10

  const handleImageSelect = (imageId) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const handleSelectAll = () => {
    const allImageIds = gallery.map(img => img.id)
    setSelectedImages(new Set(allImageIds))
  }

  const handleDeselectAll = () => {
    setSelectedImages(new Set())
  }

  const handleBulkDelete = async () => {
    for (const imageId of selectedImages) {
      await handleDeleteGalleryImage(imageId)
    }
    setSelectedImages(new Set())
  }

  const handleReplaceImage = async (imageId) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          // Llamar al servicio para reemplazar la imagen
          await galleryService.replaceGalleryImage(imageId, file)
          alert('Imagen reemplazada exitosamente.')
          // Aquí podrías recargar la galería si es necesario, pero asumimos que el componente se actualiza
        } catch (error) {
          console.error('Error al reemplazar imagen:', error)
          alert('Error al reemplazar la imagen. Inténtalo de nuevo.')
        }
      }
    }
    input.click()
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Galería del Home</h2>
        <div className="text-sm text-gray-600">
          {occupiedSlots}/10 imágenes
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Gestiona las 10 imágenes que se muestran en el slider del home. Sube imágenes, edita títulos y descripciones.
      </p>

      {/* Upload New Gallery Image - Solo si hay espacio disponible */}
      {canUploadMore && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Nueva Imagen</h3>
          <div className="space-y-4">
            <DragDropUpload
              type="gallery"
              currentUrl={null}
              onUploadSuccess={async (galleryImageData) => {
                if (galleryImageData && galleryImageData.id) {
                  // Encontrar el primer slot disponible
                  const availableSlot = fixedGallerySlots.find(slot => !slot.isOccupied)
                  if (availableSlot) {
                    // Actualizar el display_order de la nueva imagen
                    await handleGalleryFieldChange(galleryImageData.id, 'display_order', availableSlot.slot)
                    await handleSaveGalleryImage({ ...galleryImageData, display_order: availableSlot.slot })
                  }
                }
              }}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      )}

      {/* Fixed Gallery Grid - 10 Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {fixedGallerySlots.map((slot) => {
            const galleryImage = slot.image

            return (
              <div key={slot.slot} className="border rounded-lg shadow-sm bg-white overflow-hidden">
                {/* Image Display */}
                <div className="aspect-square bg-gray-100 relative">
                  {galleryImage?.image_url ? (
                    <img
                      src={galleryImage.image_url.startsWith('http')
                        ? galleryImage.image_url
                        : getImageUrl(galleryImage.image_url)}
                      alt={galleryImage.title || `Imagen ${slot.slot + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Slot {slot.slot + 1}</p>
                      </div>
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  {galleryImage && (
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        id={`select_${galleryImage.id}`}
                        checked={selectedImages.has(galleryImage.id)}
                        onChange={() => handleImageSelect(galleryImage.id)}
                        className="w-4 h-4 text-indigo-600 bg-white border-2 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Image Info and Actions */}
                <div className="p-4">
                  {galleryImage ? (
                    <>
                      <h4 className="font-semibold text-gray-900 mb-2 truncate">
                        {galleryImage.title || 'Sin título'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {galleryImage.description || 'Sin descripción'}
                      </p>

                      {/* Action Buttons - Siempre visibles para imágenes ocupadas */}
                      {galleryImage && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplaceImage(galleryImage.id)}
                            className="px-2 py-1 text-xs"
                          >
                            Cambiar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(galleryImage.id)}
                            className="px-2 py-1 text-xs"
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Slot vacío</p>
                      <p className="text-xs mt-1">Sube una imagen arriba</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk Actions - Solo si hay imágenes seleccionadas */}
      {selectedImages.size > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">
            {selectedImages.size} imagen(es) seleccionada(s)
          </h4>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Seleccionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deseleccionar Todas
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDeleteClick}>
              Eliminar Seleccionadas
            </Button>
          </div>
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
            {isBulkDelete
              ? `¿Estás seguro de que deseas eliminar las ${selectedImages.size} imágenes seleccionadas?`
              : '¿Estás seguro de que deseas eliminar esta imagen?'}
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

export default GallerySection