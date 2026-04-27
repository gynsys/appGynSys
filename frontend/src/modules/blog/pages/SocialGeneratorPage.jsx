import { useState, useEffect } from 'react'
import { 
  FiCpu, FiInstagram, FiImage, FiCopy, FiCheck, FiArrowLeft, 
  FiLoader, FiMaximize2, FiX, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi'
import { blogService } from '../services/blogService'
import Button from '../../../components/common/Button'
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
  const [activeTab, setActiveTab] = useState('reel') // 'reel' or 'carousel'
  const [copiedField, setCopiedField] = useState(null)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [previewIndex, setPreviewIndex] = useState(null)
  
  const { showToast } = useToastStore()
  const { user: doctor } = useAuthStore()

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

  const nextSlide = () => {
    if (previewIndex < generatedContent.slides.length - 1) {
      setPreviewIndex(previewIndex + 1)
    }
  }

  const prevSlide = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1)
    }
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
          <p className="text-gray-500 dark:text-gray-400 mt-2">Personaliza tus posts para redes sociales.</p>
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
              
              {selectedPost && (
                <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50">
                  <p className="text-[10px] text-indigo-400 uppercase font-black mb-1">Título Completo</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">{selectedPost.title}</p>
                </div>
              )}
            </div>

            {selectedPost && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="font-bold mb-4">¿Qué quieres crear?</h3>
                <div className="space-y-3">
                  <button onClick={() => handleGenerate('reel')} disabled={generating} className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    <FiInstagram /> Guion para Reel
                  </button>
                  <button onClick={() => handleGenerate('carousel')} disabled={generating} className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    <FiImage /> Estructura Carrusel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {!selectedPost ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200">
                <FiCpu className="w-10 h-10 text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm">Elige un artículo para empezar.</p>
              </div>
            ) : generating ? (
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

                {activeTab === 'reel' ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">Guion Estratégico</h3>
                      <button onClick={() => copyToClipboard(`HOOK: ${generatedContent.hook}\n\nCTA: ${generatedContent.cta}`, 'full')} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {copiedField === 'full' ? <FiCheck className="text-green-500" /> : <FiCopy size={14}/>}
                      </button>
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
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">Configuración del Carrusel</h3>
                        </div>
                        <div className="flex items-center gap-6">
                          {/* Professional Color Selector (Same as Profile Appearance) */}
                          <div className="flex items-center gap-4">
                             <div className="text-right">
                               <p className="text-[10px] font-black uppercase text-gray-400 mb-1 leading-none">Color Fondo</p>
                               <span className="text-[10px] font-mono text-gray-300 uppercase leading-none">{bgColor}</span>
                             </div>
                             <input 
                               type="color"
                               value={bgColor}
                               onChange={(e) => setBgColor(e.target.value)}
                               className="h-[40px] w-[80px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                               id="theme_body_bg_color"
                             />
                          </div>
                          
                          <button onClick={downloadCarousel} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all">Descargar ZIP 📦</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {generatedContent.slides.map((slide, i) => (
                          <div key={i} className="carousel-slide-item aspect-square rounded-[40px] p-10 flex flex-col relative group border border-gray-100 dark:border-gray-600 shadow-xl overflow-hidden" style={{ backgroundColor: bgColor }}>
                            
                            {/* Slide Header */}
                            <div className="flex items-center justify-center gap-4 mb-10 border-b border-gray-100 dark:border-gray-700/50 pb-6 w-full">
                              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                {doctor?.logo_url ? (
                                  <img 
                                    src={getImageUrl(doctor.logo_url)} 
                                    crossOrigin="anonymous" 
                                    alt="Logo" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { 
                                      e.target.onerror = null; 
                                      e.target.src = 'https://ui-avatars.com/api/?background=4F46E5&color=fff&name=' + (doctor?.nombre_completo || 'GS'); 
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">GS</div>
                                )}
                              </div>
                              <span className={`text-[12px] font-black uppercase whitespace-nowrap overflow-hidden text-ellipsis ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {doctor?.nombre_completo || 'Dra. Mariel Herrera'}
                              </span>
                            </div>

                            <span className="absolute top-24 right-10 text-8xl font-black text-black/5 dark:text-white/5 pointer-events-none">{i+1}</span>
                            
                            <div className="flex-1 flex flex-col justify-center text-center px-4">
                              <h4 className={`text-2xl font-black mb-6 uppercase leading-tight ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{slide.title}</h4>
                              <div className="h-1.5 w-16 bg-indigo-600/40 mb-6 rounded-full mx-auto"></div>
                              <p className={`text-base font-bold leading-relaxed ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>{slide.content}</p>
                            </div>

                            <div className="mt-8 flex justify-end items-center absolute bottom-8 right-8 slide-actions z-20">
                                <div className="flex gap-2">
                                  <button onClick={() => setPreviewIndex(i)} className="p-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-lg text-indigo-600 rounded-xl hover:bg-white transition-all"><FiMaximize2 size={16}/></button>
                                  <button onClick={() => copyToClipboard(`${slide.title}\n${slide.content}`, i)} className="p-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-lg text-gray-400 rounded-xl hover:bg-white transition-all">
                                    {copiedField === i ? <FiCheck className="text-green-500" /> : <FiCopy size={16} />}
                                  </button>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <FiCpu className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Editor de Contenido IA</h3>
                <p className="text-gray-500 text-sm">Selecciona un artículo para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Preview Modal with Navigation */}
      {previewIndex !== null && generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn">
          <button onClick={() => setPreviewIndex(null)} className="absolute top-6 right-6 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-[60]"><FiX size={32} /></button>
          
          <button onClick={prevSlide} disabled={previewIndex === 0} className="absolute left-4 md:left-10 p-6 text-white/50 hover:text-white disabled:opacity-0 transition-all z-[60]"><FiChevronLeft size={64} /></button>
          <button onClick={nextSlide} disabled={previewIndex === generatedContent.slides.length - 1} className="absolute right-4 md:right-10 p-6 text-white/50 hover:text-white disabled:opacity-0 transition-all z-[60]"><FiChevronRight size={64} /></button>

          <div className="relative w-full max-w-2xl aspect-square rounded-[60px] p-16 shadow-2xl flex flex-col" style={{ backgroundColor: bgColor }}>
            <div className="flex items-center justify-center gap-6 mb-12 border-b border-gray-100/20 pb-8 w-full">
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                {doctor?.logo_url ? (
                  <img 
                    src={getImageUrl(doctor.logo_url)} 
                    crossOrigin="anonymous" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-sm font-black">GS</div>
                )}
              </div>
              <span className={`text-base font-black uppercase tracking-tight ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-gray-900'}`}>{doctor?.nombre_completo}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center">
              <h4 className={`text-4xl font-black mb-10 uppercase leading-tight ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-indigo-600'}`}>{generatedContent.slides[previewIndex].title}</h4>
              <div className="h-3 w-24 bg-indigo-600/40 mb-12 rounded-full mx-auto"></div>
              <p className={`text-2xl font-bold leading-relaxed ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-gray-200' : 'text-gray-700'}`}>{generatedContent.slides[previewIndex].content}</p>
            </div>
            
            <div className="absolute bottom-16 right-16 text-lg font-black text-gray-400/30">{previewIndex + 1} / {generatedContent.slides.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
