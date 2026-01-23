import { useState, useEffect, useRef } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import ImageResize from 'quill-image-resize-module-react'
import Button from '../../../components/common/Button'
import DragDropUpload from '../../../components/features/DragDropUpload'
import { useAuthStore } from '../../../store/authStore'
import SEOConfiguration from './SEOConfiguration'

// Custom Image Blot to persist inline styles (alignment) and dimensions
const BaseImage = Quill.import('formats/image')

class ImageBlot extends BaseImage {
  static create(value) {
    const node = super.create(value)
    if (typeof value === 'string') {
      node.setAttribute('src', value)
    } else if (typeof value === 'object') {
      // Handle object values if passed
      if (value.url) node.setAttribute('src', value.url)
      // Apply persisted attributes
      if (value.alt) node.setAttribute('alt', value.alt)
      if (value.width) node.setAttribute('width', value.width)
      if (value.height) node.setAttribute('height', value.height)
      if (value.style) node.setAttribute('style', value.style)
    }
    return node
  }

  static value(node) {
    return {
      url: node.getAttribute('src'),
      alt: node.getAttribute('alt'),
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
      style: node.getAttribute('style') // Crucial for persist floats
    }
  }
}
ImageBlot.blotName = 'image'
ImageBlot.tagName = 'img'
Quill.register(ImageBlot, true)

// Register Image Resize Module
Quill.register('modules/imageResize', ImageResize)

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  }
}

export default function BlogEditor({ post, onSave, onCancel }) {
  const { user } = useAuthStore() // Get current doctor info for SEO generation
  const summaryRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    cover_image: '',
    is_published: false,
    is_in_menu: false,
    menu_weight: 0,
    menu_icon: ''
  })

  // Initialize SEO state
  const [seoData, setSeoData] = useState({
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    schema_type: 'Article',
    robots_index: true,
    robots_follow: true,
    social_title: '',
    social_description: '',
    social_image: ''
  })

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        summary: post.summary || '',
        cover_image: post.cover_image || '',
        is_published: post.is_published,
        is_in_menu: post.is_in_menu || false,
        menu_weight: post.menu_weight || 0,
        menu_icon: post.menu_icon || ''
      })
      if (post.seo_config) {
        setSeoData(post.seo_config)
      }
    }
  }, [post])

  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.style.height = 'auto'
      summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px'
    }
  }, [formData.summary])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Merge SEO data into submission
    const dataToSave = {
      ...formData,
      seo_config: seoData
    }
    console.log('Submitting Blog Post:', dataToSave)
    onSave(dataToSave)
  }

  const handleCoverUpload = (url) => {
    console.log('Cover Image Upload Success:', url)
    setFormData(prev => ({
      ...prev,
      cover_image: url
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">

      {/* Main Content Column (Left) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Entrada</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3 border"
              placeholder="Escribe un título atractivo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resumen / Extracto</label>
            <textarea
              ref={summaryRef}
              name="summary"
              rows={2}
              value={formData.summary}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border overflow-hidden resize-none"
              placeholder="Breve descripción para listas y tarjetas..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido Principal</label>
            </div>
            <div className="min-h-[500px] mb-12 bg-white dark:bg-gray-900">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                className="h-full dark:text-white"
                modules={modules}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Column (Right) */}
      <div className="lg:col-span-1 space-y-6">

        {/* Publish Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Publicación</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="is_published"
                name="is_published"
                type="checkbox"
                checked={formData.is_published}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Publicar inmediatamente
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" variant="primary" className="w-full justify-center">
                {post ? 'Actualizar Entrada' : 'Publicar Entrada'}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel} className="w-full justify-center">
                Cancelar
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 mb-2">Imagen Destacada</h3>
          <DragDropUpload
            type="blog-cover"
            currentUrl={formData.cover_image}
            onUploadSuccess={handleCoverUpload}
            compact={true}
            autoUpload={true}
          />
        </div>

        {/* SEO Configuration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <SEOConfiguration
            seoData={seoData}
            onChange={setSeoData}
            postTitle={formData.title}
            postContent={formData.content}
            doctorName={user?.nombre_completo}
          />
        </div>

        {/* Mega Menu Config */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Opciones de Menú</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_in_menu"
                  type="checkbox"
                  name="is_in_menu"
                  checked={formData.is_in_menu}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_in_menu" className="font-medium text-gray-700 dark:text-gray-300">Aparecer en Mega Menú</label>
                <p className="text-gray-500 text-xs">Mostrar en el menú principal del sitio</p>
              </div>
            </div>

            {formData.is_in_menu && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Corto / Icono</label>
                <input
                  type="text"
                  name="menu_icon"
                  value={formData.menu_icon}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  placeholder="Ej: Endometriosis"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </form>
  )
}
