import { useState, useRef } from 'react'
import Button from '../common/Button'
import Spinner from '../common/Spinner'
import api from '../../lib/axios'

export default function FileUpload({ 
  type = 'logo', 
  currentUrl, 
  onUploadSuccess,
  primaryColor = '#4F46E5' 
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0]
    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const endpoint = type === 'logo' ? '/uploads/logo' : '/uploads/photo'
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Get the URL from response
      const uploadedUrl = response.data.logo_url || response.data.photo_url
      
      if (onUploadSuccess && uploadedUrl) {
        onUploadSuccess(uploadedUrl)
      }
      
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir el archivo. Por favor intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/uploads')) return `http://localhost:8000${url}`
    return `http://localhost:8000/uploads/${type === 'logo' ? 'logos' : 'photos'}/${url}`
  }

  const displayUrl = preview || (currentUrl ? getImageUrl(currentUrl) : null)

  return (
    <div className="space-y-4">
      {/* Preview */}
      {displayUrl && (
        <div className="flex justify-center">
          <div className="relative">
            {type === 'logo' ? (
              <img
                src={displayUrl}
                alt="Preview"
                className="max-h-32 max-w-full object-contain border-2 border-gray-300 rounded-lg p-2"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <img
                src={displayUrl}
                alt="Preview"
                className="w-48 h-48 rounded-full object-cover border-4 shadow-lg"
                style={{ borderColor: primaryColor }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {type === 'logo' ? 'Logo' : 'Foto de Perfil'}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Formatos: JPEG, PNG, WebP. Máximo 5MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={uploading || !fileInputRef.current?.files[0]}
        style={{ backgroundColor: primaryColor }}
        className="text-white"
      >
        {uploading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Subiendo...
          </>
        ) : (
          `Subir ${type === 'logo' ? 'Logo' : 'Foto'}`
        )}
      </Button>
    </div>
  )
}

