import { useEffect, useState, useRef } from 'react';
import { doctorService } from '../../services/doctorService';
import { useAuthStore } from '../../store/authStore';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { MdOutlineCameraEnhance } from 'react-icons/md';
import { galleryService } from '../../services/galleryService';
import { useAuth } from '../../features/auth/useAuth';
import { getImageUrl } from '../../lib/imageUtils';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';

export default function GalleryManager() {
  const dropRef = useRef(null);
  const { user, loadUser } = useAuthStore();
  const primaryColor = user?.theme_primary_color || '#4F46E5';
  // Persist galleryWidth in backend and localStorage
  // Estado local para el ancho visual y el pendiente a guardar
  // galleryWidthNum es el valor numérico (ej: 80), galleryWidthStr es el string con '%'
  const getInitialGalleryWidth = () => {
    const fromUser = user && user.gallery_width ? parseInt(user.gallery_width) : null;
    const fromStorage = localStorage.getItem('galleryWidth') ? parseInt(localStorage.getItem('galleryWidth')) : null;
    return fromUser || fromStorage || 100;
  };
  const [galleryWidthNum, setGalleryWidthNum] = useState(getInitialGalleryWidth);
  const galleryWidthStr = galleryWidthNum + '%';
  // Estado para saber si hay cambios sin guardar
  // Estado para saber si hay cambios sin guardar (numérico)
  const [pendingGalleryWidth, setPendingGalleryWidth] = useState(null);

  // Sincroniza el valor local con el del usuario cuando cambia el usuario (tras guardar o login)
  // Solo sincroniza si no hay cambios pendientes
  useEffect(() => {
    if (user && user.gallery_width && pendingGalleryWidth === null) {
      setGalleryWidthNum(parseInt(user.gallery_width));
      localStorage.setItem('galleryWidth', user.gallery_width);
    }
  }, [user, pendingGalleryWidth]);

  // Guardar en localStorage en cada cambio visual
  useEffect(() => {
    localStorage.setItem('galleryWidth', galleryWidthStr);
  }, [galleryWidthStr]);


  // Cuando cambia el slider, solo actualiza el estado local y marca como pendiente
  const handleGalleryWidthChange = (e) => {
    const value = parseInt(e.target.value);
    setGalleryWidthNum(value);
    setPendingGalleryWidth(value);
  };

  // Guardar en backend solo al hacer clic en Guardar
  const handleSaveGalleryWidth = () => {
    if (user && pendingGalleryWidth !== null && parseInt(user.gallery_width) !== pendingGalleryWidth) {
      // Actualiza el valor local inmediatamente para evitar saltos
      setGalleryWidthNum(pendingGalleryWidth);
      const widthToSave = pendingGalleryWidth + '%';
      setPendingGalleryWidth(null);
      doctorService.updateCurrentUser({ gallery_width: widthToSave })
        .then(() => {
          if (typeof loadUser === 'function') loadUser();
          success('¡Ancho de galería guardado con éxito!');
        })
        .catch(err => {
          error('Error al guardar el ancho de galería');
        });
    }
  };

  const { isAuthenticated } = useAuth();
  const { success, error } = useToastStore();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch gallery from API
  const fetchGallery = async () => {
    setLoading(true);
    try {
      const data = await galleryService.getMyGallery();
      setImages(data || []);
    } catch (err) {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    fetchGallery();
  }, [isAuthenticated]);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add('ring-2', 'ring-indigo-400');
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('ring-2', 'ring-indigo-400');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return error('Selecciona un archivo');
    setUploading(true);
    try {
      await galleryService.uploadGalleryImage(file, title, description);
      setFile(null);
      setTitle('');
      setDescription('');
      fetchGallery();
      success('Imagen subida correctamente');
    } catch (err) {
      error('Error al subir imagen');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Edit modal state
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // Handler para abrir el modal de eliminar
  const handleDeleteClick = (img) => {
    setImageToDelete(img);
    setDeleteModalOpen(true);
  };

  // Filtrar imágenes featured
  const featuredImages = images.filter(img => img.featured);

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    try {
      await galleryService.deleteGalleryImage(imageToDelete.id);
      success('Imagen eliminada');
      setDeleteModalOpen(false);
      setImageToDelete(null);
      fetchGallery();
    } catch (err) {
      error('Error al eliminar imagen');
    }
  };

  const cropperAspectRatio = 1; // cuadrado, igual que el slider
  const cropperContainerStyle = {
    width: (user && user.gallery_width) ? user.gallery_width : galleryWidthStr,
    aspectRatio: '1/1',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const openEditModal = (img) => {
    setEditingImage(img)
    setEditTitle(img.title || '')
    setEditDescription(img.description || '')
    setEditFeatured(img.featured || false)
    setEditDisplayOrder(img.display_order || 0)
  }

  const closeEditModal = () => {
    setEditingImage(null)
    setEditTitle('')
    setEditDescription('')
    setEditFeatured(false)
    setEditDisplayOrder(0)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingImage) return
    setSaving(true)
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        featured: editFeatured,
        display_order: editDisplayOrder,
      }


      await galleryService.updateGalleryImage(editingImage.id, payload)
      success('Imagen actualizada correctamente')
      closeEditModal()
      fetchGallery()
    } catch (err) {
      error('Error al actualizar imagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Gestor de Galería</h1>




      {/* (Crop inline/modal removed) Ajustes ahora en el modal de edición individual */}

      {/* (Preview removed) The modal cropper below now matches GallerySection sizing. */}

      {/* Upload Form */}

      <form onSubmit={handleUpload} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow w-full" style={{ minHeight: 287 }}>
        <h2 className="text-xl font-semibold mb-4 w-full text-gray-900 dark:text-white">Subir Nueva Imagen</h2>
        {/* Contenedor padre de inputs y drag and drop */}
        {/* Contenedor padre: Columna vertical */}
        <div className="flex flex-col gap-6 w-full">

          {/* Inputs Section */}
          <div className="w-full space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Título (opcional)</label>
              <input
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Título de la imagen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
              <input
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Drag and Drop Section */}
          <div className="flex flex-col items-center w-full">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 self-start">Archivo de Imagen</label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-2 p-8 relative group bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              style={{ minHeight: 180, borderColor: '#9ca3af' }}
              tabIndex={0}
              aria-label="Arrastra y suelta una imagen aquí o haz clic para seleccionar"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center mb-4">
                <IoCloudUploadOutline className="h-12 w-12 text-gray-500 dark:text-gray-400 mb-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Arrastra y suelta imagen aquí</span>
              </div>
              <div className="flex items-center w-full my-4">
                <hr className="flex-grow border-gray-400" />
                <span className="mx-2 text-gray-500 dark:text-gray-400 font-medium">o</span>
                <hr className="flex-grow border-gray-400" />
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="flex items-center gap-2 px-6 py-2 rounded border-2 bg-white dark:bg-gray-800 font-semibold text-base transition-colors focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onClick={e => { e.stopPropagation(); document.getElementById('fileInput').click(); }}
              >
                <MdOutlineCameraEnhance className="h-5 w-5" />
                Seleccionar desde dispositivo
              </button>
              <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center font-medium">Formatos: JPEG, PNG, WebP. Máximo 5MB</p>
              {file && <div className="text-sm mt-3 font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">Seleccionado: {file.name} ({Math.round(file.size / 1024)} KB)</div>}
            </div>

            {file && (
              <button
                type="submit"
                disabled={uploading}
                className="mt-4 w-full px-4 py-3 rounded-lg text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                style={{ backgroundColor: primaryColor }}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Subiendo...
                  </span>
                ) : (
                  'Guardar Imagen'
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2">Cargando galería...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 dark:text-gray-400">No hay imágenes en la galería. Sube tu primera imagen arriba.</p>
        </div>
      ) : (
        <>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map(img => (
              <div key={img.id} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-lg">
                  {img.crop && img.crop.croppedArea ? (() => {
                    const area = img.crop.croppedArea;
                    const scale = 100 / area.width;
                    return (
                      <img
                        src={getImageUrl(img.image_url)}
                        alt={img.title || 'Imagen de galería'}
                        style={{
                          position: 'absolute',
                          left: `${-area.x * scale}%`,
                          top: `${-area.y * scale}%`,
                          width: `${scale * 100}%`,
                          height: 'auto',
                          minHeight: '100%',
                          minWidth: '100%',
                          background: '#f3f4f6',
                        }}
                      />
                    );
                  })() : (
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.title || 'Imagen de galería'}
                      className="w-full h-48 object-cover"
                    />
                  )}

                </div>
                <div className="p-4">
                  <div className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                    {img.title || <span className="text-gray-400 italic">Sin título</span>}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {img.description || <span className="text-gray-400 italic">Sin descripción</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    Orden: {img.display_order || 0} • {img.is_active ? '✓ Activa' : '✗ Inactiva'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEditModal(img)}
                      className="flex-1 px-3 py-2 rounded text-sm border"
                      style={{
                        borderColor: primaryColor,
                        color: primaryColor,
                        background: 'transparent',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <FiEdit2 size={18} /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(img)}
                      className="flex-1 px-3 py-2 rounded text-sm text-white"
                      style={{
                        background: primaryColor,
                        border: 'none',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <FiTrash2 size={18} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[40vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Imagen</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Título
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Atención Médica Personalizada"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Descripción</label>
                    <input
                      className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Consultas especializadas en ginecología"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 rounded font-semibold"
                    style={{
                      background: primaryColor,
                      color: '#fff',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2 rounded font-semibold border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    style={{
                      borderColor: primaryColor,
                      color: primaryColor,
                      boxShadow: 'none',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Imagen"
      >
        <div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              ¿Estás seguro de que deseas eliminar esta imagen de la galería? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={confirmDelete}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
