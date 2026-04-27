import { useState, useEffect } from 'react'
import { FiCpu, FiInstagram, FiImage, FiCopy, FiCheck, FiArrowLeft, FiLoader } from 'react-icons/fi'
import { blogService } from '../services/blogService'
import { doctorService } from '../../../services/doctorService'
import Button from '../../../components/common/Button'
import Spinner from '../../../components/common/Spinner'
import { useToastStore } from '../../../store/toastStore'
import { getImageUrl } from '../../../lib/imageUtils'
import html2canvas from 'html2canvas'

export default function SocialGeneratorPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [activeTab, setActiveTab] = useState('reel') // 'reel' or 'carousel'
  const [copiedField, setCopiedField] = useState(null)
  const { showToast } = useToastStore()

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

  const downloadCarousel = async () => {
    const element = document.getElementById('carousel-container')
    if (!element) return

    try {
      showToast('Generando imágenes...', 'loading')
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: null,
        scale: 2 // Higher quality
      })
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `carrusel-${selectedPost.slug_url}.png`
      link.click()
      showToast('¡Carrusel descargado!', 'success')
    } catch (error) {
      showToast('Error al descargar carrusel', 'error')
    }
  }

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
    showToast('Copiado al portapapeles', 'success')
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
            Transforma tus artículos de blog en Reels y Carruseles virales para redes sociales.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Post Selection */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">1. Selecciona un artículo</h2>
              <div className="space-y-4">
                <select
                  value={selectedPost?.id || ''}
                  onChange={(e) => {
                    const post = posts.find(p => p.id === parseInt(e.target.value))
                    setSelectedPost(post);
                    setGeneratedContent(null);
                  }}
                  className="block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border"
                >
                  <option value="" disabled>Elegir un artículo del blog...</option>
                  {posts.map(post => (
                    <option key={post.id} value={post.id}>
                      {post.title}
                    </option>
                  ))}
                </select>
                
                {selectedPost && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 animate-fadeIn">
                    <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Artículo Seleccionado</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-2">{selectedPost.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Publicado el {new Date(selectedPost.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedPost && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold mb-2">¿Qué quieres crear?</h3>
                <p className="text-xs text-indigo-100 mb-6">Nuestra IA analizará "{selectedPost.title}" para extraer lo más importante.</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleGenerate('reel')}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    <FiInstagram /> Guion para Reel
                  </button>
                  <button
                    onClick={() => handleGenerate('carousel')}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    <FiImage /> Estructura Carrusel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Generation Results */}
          <div className="lg:col-span-8">
            {!selectedPost ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FiCpu className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Selecciona un artículo de la izquierda<br/>para empezar a crear contenido.</p>
              </div>
            ) : generating ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <FiLoader className="w-16 h-16 text-indigo-600 animate-spin" />
                  <FiCpu className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
                </div>
                <p className="mt-6 text-lg font-bold text-gray-900 dark:text-white animate-pulse">
                  Nuestra IA está leyendo tu artículo...
                </p>
                <p className="text-gray-500 text-sm mt-2">Estamos extrayendo los mejores ganchos para redes.</p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => handleGenerate('reel')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    Guion de Reel
                  </button>
                  <button
                    onClick={() => handleGenerate('carousel')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'carousel' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    Carrusel de Imágenes
                  </button>
                </div>

                {activeTab === 'reel' ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Guion Estratégico para Reel</h3>
                        <p className="text-xs text-gray-500 mt-1">Optimizado para retención de audiencia.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const text = `HOOK: ${generatedContent.hook}\n\nESCENAS:\n${generatedContent.scenes.map(s => `${s.time} - ${s.text}\nAudio: ${s.audio}`).join('\n\n')}\n\nCTA: ${generatedContent.cta}`
                          copyToClipboard(text, 'full')
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-xs font-bold"
                      >
                        {copiedField === 'full' ? <FiCheck className="text-green-500" /> : <FiCopy />}
                        Copiar Guion
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      {/* Hook */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-2 block">El Gancho (Primeros 3 seg)</label>
                        <p className="text-lg font-bold text-gray-800 dark:text-white italic">"{generatedContent.hook}"</p>
                      </div>

                      {/* Scenes */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Desglose de Escenas</label>
                        {generatedContent.scenes.map((scene, i) => (
                          <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-2xl transition-colors group">
                            <div className="flex-shrink-0 w-16 text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 h-8 flex items-center justify-center rounded-lg">
                              {scene.time}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Visual</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">{scene.text}</p>
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Audio / Voz</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium italic">"{scene.audio}"</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <label className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase mb-2 block">Llamada a la Acción (CTA)</label>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{generatedContent.cta}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Estructura del Carrusel (Diapositivas)</h3>
                          <p className="text-[10px] text-gray-500 mt-1">IA generó {generatedContent.slides.length} diapositivas basadas en tu blog.</p>
                        </div>
                        <button 
                          onClick={downloadCarousel}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                          Descargar Diapositivas 📸
                        </button>
                      </div>

                      <div id="carousel-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl">
                        {generatedContent.slides.map((slide, i) => (
                          <div key={i} className="aspect-square bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 flex flex-col relative group overflow-hidden border border-gray-100 dark:border-gray-600 shadow-sm">
                            <span className="absolute top-2 right-4 text-5xl font-black text-black/5 dark:text-white/5">{i+1}</span>
                            <div className="mt-4">
                              <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-3 z-10 leading-tight uppercase tracking-wide">{slide.title}</h4>
                              <div className="h-0.5 w-8 bg-indigo-600/30 mb-4 rounded-full"></div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium z-10">{slide.content}</p>
                            </div>
                            <div className="mt-auto flex justify-between items-center">
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">GynSys IA</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(slide.title + "\n" + slide.content, i)
                                  }}
                                  className="p-2 bg-white dark:bg-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-gray-100 dark:border-gray-500"
                                >
                                  {copiedField === i ? <FiCheck className="text-green-500" /> : <FiCopy size={12} className="text-gray-400" />}
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center gap-2"><FiImage /> Sugerencias Visuales (IA Prompts)</h3>
                      </div>
                      <div className="space-y-3">
                        {generatedContent.image_prompts.map((prompt, i) => (
                          <div key={i} className="bg-white/10 p-3 rounded-xl text-sm flex justify-between items-center gap-4">
                            <span>{prompt}</span>
                            <button 
                              onClick={() => copyToClipboard(prompt, 'prompt-'+i)}
                              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              {copiedField === 'prompt-'+i ? <FiCheck /> : <FiCopy size={14} />}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-center">
                         <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black">
                            Generar Imágenes con IA ✨ (Próximamente)
                         </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
                  <FiCpu className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">"{selectedPost.title}"</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Haz clic en un formato a la izquierda para empezar a generar la estrategia social.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
