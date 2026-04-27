import { useState, useEffect, useRef } from 'react'
import { 
  FiCpu, FiInstagram, FiImage, FiCopy, FiCheck, 
  FiLoader, FiMaximize2, FiX, FiChevronLeft, FiChevronRight,
  FiEdit3, FiPlusCircle, FiTrash2, FiUpload
} from 'react-icons/fi'
import { blogService } from '../services/blogService'
import Spinner from '../../../components/common/Spinner'
import { useToastStore } from '../../../store/toastStore'
import { getImageUrl } from '../../../lib/imageUtils'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { useAuthStore } from '../../../store/authStore'

export default function SocialGeneratorPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [activeTab, setActiveTab] = useState('reel')
  const [copiedField, setCopiedField] = useState(null)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [previewIndex, setPreviewIndex] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  
  const { showToast } = useToastStore()
  const { user: doctor } = useAuthStore()
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await blogService.getMyPosts()
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      showToast('Error al cargar artículos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (type) => {
    if (!selectedPost) return
    try {
      setGenerating(true)
      setActiveTab(type)
      const response = await blogService.generateSocialContent(selectedPost.id, type)
      setGeneratedContent(response)
      setGenerating(false)
      showToast('¡Estrategia generada!', 'success')
    } catch (error) {
      showToast('Error en la IA', 'error')
      setGenerating(false)
    }
  }

  const handleEditSlide = (index, field, value) => {
    const newSlides = [...generatedContent.slides]
    newSlides[index][field] = value
    setGeneratedContent({ ...generatedContent, slides: newSlides })
  }

  const handleAddImage = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newSlides = [...generatedContent.slides]
        newSlides[index].customImage = reader.result
        setGeneratedContent({ ...generatedContent, slides: newSlides })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCustomImage = (index) => {
    const newSlides = [...generatedContent.slides]
    delete newSlides[index].customImage
    setGeneratedContent({ ...generatedContent, slides: newSlides })
  }

  const downloadCarousel = async () => {
    const zip = new JSZip()
    const slides = document.querySelectorAll('.carousel-slide-item')
    if (slides.length === 0) return

    try {
      showToast('Empaquetando carrusel...', 'loading')
      const actionButtons = document.querySelectorAll('.slide-actions')
      actionButtons.forEach(btn => btn.style.display = 'none')

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i], {
          useCORS: true,
          scale: 3,
          backgroundColor: bgColor,
          logging: false
        })
        const imgData = canvas.toDataURL('image/png').split(',')[1]
        zip.file(`Slide_${i + 1}.png`, imgData, { base64: true })
      }

      actionButtons.forEach(btn => btn.style.display = 'flex')
      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `carrusel-${selectedPost.slug_url}.zip`
      link.click()
      showToast('¡ZIP descargado!', 'success')
    } catch (error) {
      showToast('Error al descargar', 'error')
    }
  }

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" />
            Crear Contenido IA
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">1. Selecciona un artículo</h2>
              <select
                value={selectedPost?.id || ''}
                onChange={(e) => {
                  const post = posts.find(p => p.id === parseInt(e.target.value))
                  setSelectedPost(post);
                  setGeneratedContent(null);
                }}
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border truncate"
              >
                <option value="" disabled>Elegir artículo...</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedPost && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="font-bold mb-4">¿Qué quieres crear?</h3>
                <div className="space-y-3">
                  <button onClick={() => handleGenerate('reel')} disabled={generating} className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all">
                    <FiInstagram /> Guion para Reel
                  </button>
                  <button onClick={() => handleGenerate('carousel')} disabled={generating} className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all">
                    <FiImage /> Estructura Carrusel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {generating ? (
              <div className="h-[300px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100">
                <FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="font-bold text-gray-900 dark:text-white">IA procesando contenido...</p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button onClick={() => setActiveTab('reel')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Guion</button>
                  <button onClick={() => setActiveTab('carousel')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'carousel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Carrusel</button>
                </div>

                {activeTab === 'carousel' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-gray-400 mb-1 leading-none">Color Fondo</p>
                             <span className="text-[10px] font-mono text-gray-300 uppercase leading-none">{bgColor}</span>
                           </div>
                           <input 
                             type="color"
                             value={bgColor}
                             onChange={(e) => setBgColor(e.target.value)}
                             className="h-[40px] w-[80px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm"
                           />
                        </div>
                        <button onClick={downloadCarousel} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700">Descargar ZIP 📦</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {generatedContent.slides.map((slide, i) => (
                          <div key={i} className="carousel-slide-item aspect-square rounded-[40px] p-8 flex flex-col relative group border border-gray-100 dark:border-gray-600 shadow-xl overflow-hidden" style={{ backgroundColor: bgColor }}>
                            
                            {/* Header Aligned Left */}
                            <div className="flex items-center justify-start gap-3 mb-6 border-b border-gray-100 dark:border-gray-700/50 pb-4 w-full">
                              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                {doctor?.logo_url ? (
                                  <img 
                                    src={getImageUrl(doctor.logo_url)} 
                                    crossOrigin="anonymous" 
                                    alt="Logo" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (doctor?.nombre_completo || 'GS'); }}
                                  />
                                ) : <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">GS</div>}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-tight ${bgColor === '#000000' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {doctor?.nombre_completo}
                              </span>
                            </div>

                            <span className="absolute top-20 right-8 text-7xl font-black text-black/5 dark:text-white/5 pointer-events-none">{i+1}</span>
                            
                            <div className="flex-1 flex flex-col justify-center text-center px-2">
                              {editingIndex === i ? (
                                <div className="space-y-4 slide-actions">
                                  <input 
                                    className="w-full p-2 text-sm font-black uppercase border rounded-lg dark:bg-gray-700 dark:text-white"
                                    value={slide.title}
                                    onChange={(e) => handleEditSlide(i, 'title', e.target.value)}
                                  />
                                  <textarea 
                                    className="w-full p-2 text-xs border rounded-lg dark:bg-gray-700 dark:text-white"
                                    rows="4"
                                    value={slide.content}
                                    onChange={(e) => handleEditSlide(i, 'content', e.target.value)}
                                  />
                                  <button onClick={() => setEditingIndex(null)} className="w-full py-2 bg-green-500 text-white text-[10px] font-black uppercase rounded-lg">Guardar Cambios</button>
                                </div>
                              ) : (
                                <>
                                  <h4 className={`text-xl font-black mb-3 uppercase leading-tight ${bgColor === '#000000' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{slide.title}</h4>
                                  
                                  {/* Reducción de espacio del 50% */}
                                  <div className="h-1 w-12 bg-indigo-600/30 mb-3 rounded-full mx-auto"></div>
                                  
                                  <p className={`text-sm font-bold leading-relaxed ${bgColor === '#000000' ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>{slide.content}</p>
                                  
                                  {/* Custom Image Area */}
                                  {slide.customImage && (
                                    <div className="mt-4 relative group/img mx-auto max-w-[120px]">
                                      <img src={slide.customImage} className="rounded-xl shadow-md border-2 border-white/50 object-cover aspect-square" alt="Custom" />
                                      <button onClick={() => removeCustomImage(i)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity slide-actions"><FiTrash2 size={12}/></button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Floating Actions */}
                            <div className="mt-6 flex justify-end items-center absolute bottom-6 right-6 slide-actions z-20">
                                <div className="flex gap-2">
                                  <button onClick={() => setPreviewIndex(i)} className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-sm text-indigo-600 rounded-lg hover:bg-white"><FiMaximize2 size={14}/></button>
                                  <button onClick={() => setEditingIndex(i === editingIndex ? null : i)} className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-sm text-amber-500 rounded-lg hover:bg-white"><FiEdit3 size={14}/></button>
                                  
                                  <label className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-sm text-blue-500 rounded-lg hover:bg-white cursor-pointer">
                                    <FiPlusCircle size={14}/>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAddImage(i, e)} />
                                  </label>

                                  <button onClick={() => copyToClipboard(`${slide.title}\n${slide.content}`, i)} className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-sm text-gray-400 rounded-lg hover:bg-white">
                                    {copiedField === i ? <FiCheck className="text-green-500" /> : <FiCopy size={14} />}
                                  </button>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'reel' && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">Guion Estratégico</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                        <label className="text-[10px] font-black text-indigo-600 uppercase mb-1 block">Hook</label>
                        <p className="text-lg font-bold text-gray-800 dark:text-white italic">"{generatedContent.hook}"</p>
                      </div>
                      <div className="space-y-4">
                        {generatedContent.scenes.map((scene, i) => (
                          <div key={i} className="flex gap-4 p-4 border-b last:border-0 border-gray-50 dark:border-gray-700">
                            <div className="text-[10px] font-black text-indigo-600">{scene.time}</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-400 mb-1">Visual: <span className="font-medium text-gray-800 dark:text-gray-200">{scene.text}</span></p>
                              <p className="text-xs font-bold text-indigo-600">Audio: <span className="font-medium italic text-gray-800 dark:text-gray-200">"{scene.audio}"</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100">
                <FiCpu className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Editor de Contenido IA</h3>
                <p className="text-gray-500 text-sm">Selecciona un artículo para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewIndex !== null && generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <button onClick={() => setPreviewIndex(null)} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><FiX size={32} /></button>
          
          <div className="relative w-full max-w-lg aspect-square rounded-[50px] p-12 flex flex-col" style={{ backgroundColor: bgColor }}>
            <div className="flex items-center justify-start gap-4 mb-10 border-b border-gray-100/20 pb-6 w-full">
              <div className="w-14 h-14 bg-white rounded-xl overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
                 {doctor?.logo_url ? <img src={getImageUrl(doctor.logo_url)} crossOrigin="anonymous" className="w-full h-full object-contain" /> : <div className="text-indigo-600 font-black">GS</div>}
              </div>
              <span className={`text-sm font-black uppercase ${bgColor === '#000000' ? 'text-white' : 'text-gray-900'}`}>{doctor?.nombre_completo}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center">
              <h4 className={`text-3xl font-black mb-4 uppercase leading-tight ${bgColor === '#000000' ? 'text-white' : 'text-indigo-600'}`}>{generatedContent.slides[previewIndex].title}</h4>
              <div className="h-2 w-20 bg-indigo-600/30 mb-4 rounded-full mx-auto"></div>
              <p className={`text-xl font-bold leading-relaxed ${bgColor === '#000000' ? 'text-gray-200' : 'text-gray-700'}`}>{generatedContent.slides[previewIndex].content}</p>
              
              {generatedContent.slides[previewIndex].customImage && (
                <img src={generatedContent.slides[previewIndex].customImage} className="mt-6 mx-auto rounded-2xl shadow-xl max-h-[150px] object-contain" alt="Preview" />
              )}
            </div>
            
            <div className="absolute bottom-10 right-10 text-sm font-black text-gray-400/30">{previewIndex + 1} / {generatedContent.slides.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
