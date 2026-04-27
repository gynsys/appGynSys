import { useState, useEffect } from 'react'
import { FiCpu, FiInstagram, FiImage, FiCopy, FiCheck, FiArrowLeft, FiLoader, FiMaximize2, FiX } from 'react-icons/fi'
import { blogService } from '../services/blogService'
import { doctorService } from '../../../services/doctorService'
import Button from '../../../components/common/Button'
import Spinner from '../../../components/common/Spinner'
import { useToastStore } from '../../../store/toastStore'
import { getImageUrl } from '../../../lib/imageUtils'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { TwitterPicker } from 'react-color'
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
  const [previewSlide, setPreviewSlide] = useState(null)
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
      showToast('¡Estrategia generada con éxito!', 'success')
      
    } catch (error) {
      showToast('Error al generar contenido con IA', 'error')
      setGenerating(false)
    }
  }

  // Helper to convert image to base64 for html2canvas
  const getBase64Image = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return url;
    }
  };

  const downloadCarousel = async () => {
    const zip = new JSZip()
    const slides = document.querySelectorAll('.carousel-slide-item')
    
    if (slides.length === 0) return

    try {
      showToast('Preparando paquete de imágenes...', 'loading')
      
      // Temporary hide UI buttons inside slides for capture
      const copyButtons = document.querySelectorAll('.copy-slide-btn')
      copyButtons.forEach(btn => btn.style.display = 'none')

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i], {
          useCORS: true,
          allowTaint: false,
          backgroundColor: bgColor,
          scale: 3,
          logging: false
        })
        const imgData = canvas.toDataURL('image/png').split(',')[1]
        zip.file(`Slide_${i + 1}.png`, imgData, { base64: true })
      }

      copyButtons.forEach(btn => btn.style.display = 'block')

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `carrusel-${selectedPost.slug_url}.zip`
      link.click()
      
      showToast('¡ZIP descargado!', 'success')
    } catch (error) {
      console.error(error)
      showToast('Error al generar el ZIP', 'error')
    }
  }

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
    showToast('Copiado', 'success')
  }

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" />
            Crear Contenido IA
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Transforma tus artículos de blog en Reels y Carruseles virales.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">1. Selecciona un artículo</h2>
              <select
                value={selectedPost?.id || ''}
                onChange={(e) => {
                  const post = posts.find(p => p.id === parseInt(e.target.value))
                  setSelectedPost(post);
                  setGeneratedContent(null);
                }}
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border"
              >
                <option value="" disabled>Elegir artículo...</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>{post.title}</option>
                ))}
              </select>
              
              {selectedPost && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Título</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{selectedPost.title}</p>
                </div>
              )}
            </div>

            {selectedPost && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
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
              <div className="h-[400px] flex flex-col items-center justify-center text-center bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FiCpu className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Selecciona un artículo de la izquierda.</p>
              </div>
            ) : generating ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <FiLoader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-lg font-bold text-gray-900 dark:text-white animate-pulse">Generando estrategia con IA...</p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6 animate-fadeIn">
                
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button onClick={() => setActiveTab('reel')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Guion</button>
                  <button onClick={() => setActiveTab('carousel')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'carousel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Carrusel</button>
                </div>

                {activeTab === 'reel' ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slideIn">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Guion para Reel</h3>
                      <button onClick={() => {
                        const text = `HOOK: ${generatedContent.hook}\n\nESCENAS:\n${generatedContent.scenes.map(s => `${s.time} - ${s.text}\nAudio: ${s.audio}`).join('\n\n')}\n\nCTA: ${generatedContent.cta}`
                        copyToClipboard(text, 'full')
                      }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold">
                        {copiedField === 'full' ? <FiCheck className="text-green-500" /> : <FiCopy />} Copiar
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <label className="text-[10px] font-black text-indigo-600 uppercase mb-2 block">Hook</label>
                        <p className="text-lg font-bold text-gray-800 dark:text-white italic">"{generatedContent.hook}"</p>
                      </div>
                      <div className="space-y-4">
                        {generatedContent.scenes.map((scene, i) => (
                          <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-2xl">
                            <div className="w-16 text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 h-8 flex items-center justify-center rounded-lg">{scene.time}</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Visual: <span className="font-medium normal-case text-gray-800 dark:text-gray-200">{scene.text}</span></p>
                              <p className="text-xs font-bold text-indigo-600 uppercase">Audio: <span className="font-medium italic normal-case text-gray-800 dark:text-gray-200">"{scene.audio}"</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-slideIn">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Ajustes del Carrusel</h3>
                          <p className="text-[10px] text-gray-500 mt-1">Personaliza el fondo y previsualiza.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                          <TwitterPicker color={bgColor} onChange={(c) => setBgColor(c.hex)} triangle="hide" />
                          <button onClick={downloadCarousel} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg">Descargar ZIP 📦</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {generatedContent.slides.map((slide, i) => (
                          <div key={i} className="carousel-slide-item aspect-square rounded-3xl p-8 flex flex-col relative group border border-gray-100 dark:border-gray-600 shadow-xl" style={{ backgroundColor: bgColor }}>
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-700/50 pb-4">
                              {doctor?.logo_url && <img src={getImageUrl(doctor.logo_url)} crossOrigin="anonymous" alt="Logo" className="w-10 h-10 object-contain" />}
                              <div className="flex flex-col overflow-hidden">
                                <span className={`text-xs font-black uppercase whitespace-nowrap ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                  {doctor?.nombre_completo || 'GynSys'}
                                </span>
                              </div>
                            </div>

                            <span className="absolute top-20 right-8 text-7xl font-black text-black/5 dark:text-white/5 pointer-events-none">{i+1}</span>
                            
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className={`text-xl font-black mb-4 uppercase leading-tight ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{slide.title}</h4>
                              <div className="h-1 w-12 bg-indigo-600/40 mb-4 rounded-full"></div>
                              <p className={`text-sm font-medium leading-relaxed ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>{slide.content}</p>
                            </div>

                            <div className="mt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50 pt-4">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">GynSys IA</span>
                                <div className="flex gap-2 copy-slide-btn">
                                  <button onClick={() => setPreviewSlide(slide)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FiMaximize2 size={14}/></button>
                                  <button onClick={() => copyToClipboard(`${slide.title}\n${slide.content}`, i)} className="p-2 bg-gray-50 text-gray-400 rounded-lg">
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
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto"><FiCpu className="w-10 h-10 text-indigo-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generador IA</h3>
                <p className="text-gray-500">Selecciona un artículo para empezar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Preview Modal */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg aspect-square bg-white rounded-3xl p-12 shadow-2xl overflow-hidden" style={{ backgroundColor: bgColor }}>
            <button onClick={() => setPreviewSlide(null)} className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-20"><FiX size={24} /></button>
            
            <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
              {doctor?.logo_url && <img src={getImageUrl(doctor.logo_url)} crossOrigin="anonymous" alt="Logo" className="w-12 h-12 object-contain" />}
              <span className={`text-sm font-black uppercase whitespace-nowrap ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-gray-900'}`}>{doctor?.nombre_completo}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center h-[60%]">
              <h4 className={`text-3xl font-black mb-6 uppercase leading-tight ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-white' : 'text-indigo-600'}`}>{previewSlide.title}</h4>
              <div className="h-1.5 w-16 bg-indigo-600/40 mb-8 rounded-full"></div>
              <p className={`text-lg font-medium leading-relaxed ${bgColor === '#000000' || bgColor === '#2b2b2b' ? 'text-gray-200' : 'text-gray-700'}`}>{previewSlide.content}</p>
            </div>
            
            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center border-t border-gray-100 pt-6">
               <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">GynSys Asistente IA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
