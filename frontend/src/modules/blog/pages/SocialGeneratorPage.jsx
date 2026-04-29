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
  const [fontSize, setFontSize] = useState(14)
  const [headerFontSize, setHeaderFontSize] = useState(10)
  const [watermarkImage, setWatermarkImage] = useState(null)
  const [imagePositions, setImagePositions] = useState({})
  const [imageSize, setImageSize] = useState(100)
  const [dragging, setDragging] = useState(null)
  const [slideAlignments, setSlideAlignments] = useState({})
  const slideRefs = useRef({})
  const [imageSizes, setImageSizes] = useState({})
  const [imageRotations, setImageRotations] = useState({})
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [transformState, setTransformState] = useState(null)

  const [doctorLogoBase64, setDoctorLogoBase64] = useState(null)
  
  const { showToast } = useToastStore()
  const { user: doctor } = useAuthStore()

  useEffect(() => {
    loadPosts()
    if (doctor?.logo_url) {
      loadDoctorLogo(getImageUrl(doctor.logo_url))
    } else {
      setDoctorLogoBase64(getFallbackLogo())
    }
  }, [doctor])

  const loadDoctorLogo = async (url) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setDoctorLogoBase64(reader.result);
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading doctor logo, using fallback:", error);
      setDoctorLogoBase64(getFallbackLogo());
    }
  }

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

  const handleWatermark = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setWatermarkImage(reader.result)
    reader.readAsDataURL(file)
  }

  const handleDragStart = (e, slideIndex) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedImageIndex(slideIndex)
    const rect = slideRefs.current[slideIndex]?.getBoundingClientRect()
    if (!rect) return
    const pos = imagePositions[slideIndex] || { x: 50, y: 70 }
    setDragging({
      slideIndex,
      offsetX: e.clientX - rect.left - (pos.x / 100) * rect.width,
      offsetY: e.clientY - rect.top - (pos.y / 100) * rect.height,
      rect
    })
  }

  const handleTransformStart = (e, slideIndex, type) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedImageIndex(slideIndex)
    const imgElement = document.getElementById(`custom-img-${slideIndex}`)
    const rect = imgElement?.getBoundingClientRect()
    if (!rect) return
    setTransformState({
      type,
      slideIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialSize: imageSizes[slideIndex] || imageSize,
      initialRotation: imageRotations[slideIndex] || 0,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    })
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragging) {
        const { slideIndex, offsetX, offsetY, rect } = dragging
        const xPct = Math.min(90, Math.max(10, ((e.clientX - rect.left - offsetX) / rect.width) * 100))
        const yPct = Math.min(90, Math.max(10, ((e.clientY - rect.top - offsetY) / rect.height) * 100))
        setImagePositions(prev => ({ ...prev, [slideIndex]: { x: xPct, y: yPct } }))
      } else if (transformState) {
        const { type, slideIndex, startX, startY, initialSize, initialRotation, centerX, centerY } = transformState
        if (type === 'resize') {
          const deltaX = e.clientX - startX
          const newSize = Math.max(50, initialSize + deltaX)
          setImageSizes(prev => ({ ...prev, [slideIndex]: newSize }))
        } else if (type === 'rotate') {
          const startAngle = Math.atan2(startY - centerY, startX - centerX)
          const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
          const angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
          setImageRotations(prev => ({ ...prev, [slideIndex]: initialRotation + angleDiff }))
        }
      }
    }
    const handlePointerUp = () => {
      setDragging(null)
      setTransformState(null)
    }
    
    if (dragging || transformState) {
      window.addEventListener('mousemove', handlePointerMove)
      window.addEventListener('mouseup', handlePointerUp)
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
    }
  }, [dragging, transformState, imageSizes, imageSize, imageRotations])

  const setSlideAlignment = (slideIndex, alignPct) => {
    setSlideAlignments(prev => ({ ...prev, [slideIndex]: alignPct }))
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

  // Generador de Iniciales SVG (Inmune a CORS)
  const getFallbackLogo = () => {
    const name = doctor?.nombre_completo || 'GynSys';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const svg = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="#4F46E5"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="40">${initials}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };


  const renderSlideContent = (slide, i, isPreview = false) => {
    return (
      <div
         key={i}
         ref={el => { if (!isPreview) slideRefs.current[i] = el; }}
         className="carousel-slide-item aspect-square rounded-[40px] p-8 flex flex-col relative group shadow-xl overflow-hidden"
         style={{ backgroundColor: bgColor, border: isPreview ? 'none' : '1px solid #e5e7eb' }}
         onClick={() => { if (!isPreview) setSelectedImageIndex(null); }}
       >
         {watermarkImage && (
           <img src={watermarkImage} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" style={{ opacity: 0.08 }} />
         )}
         
         <div className="flex items-center justify-start gap-3 mb-6 border-b border-gray-100 dark:border-gray-700/50 pb-4 w-full relative z-10">
           <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
             {doctorLogoBase64 ? (
               <img src={doctorLogoBase64} alt="Logo" className="w-full h-full object-contain" />
             ) : <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">GS</div>}
           </div>
           <span
             style={{ fontSize: (headerFontSize * (isPreview ? 1.5 : 1)) + 'px' }}
             className={`font-black uppercase tracking-tight ${bgColor === '#000000' ? 'text-white' : 'text-gray-900 dark:text-white'}`}
           >{doctor?.nombre_completo}</span>
         </div>
         
         {!isPreview && (
           <span className="absolute top-20 right-8 text-7xl font-black text-black/5 dark:text-white/5 pointer-events-none">{i+1}</span>
         )}
         
         <div className="flex-1 flex flex-col px-2 text-center h-full relative z-10 pointer-events-none">
           <div style={{ height: `${slideAlignments[i] ?? 50}%` }} className="transition-all duration-300 flex-shrink-0"></div>
           <div className="flex-shrink-0 pointer-events-auto">
             {editingIndex === i && !isPreview ? (
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
                 <h4
                   className={`font-black mb-3 uppercase leading-tight ${bgColor === '#000000' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}
                   style={{ fontSize: ((fontSize + 4) * (isPreview ? 1.4 : 1)) + 'px' }}
                 >{slide.title}</h4>
                 <div className="h-1 w-12 bg-indigo-600/30 mb-3 rounded-full mx-auto"></div>
                 <p
                   className={`font-bold leading-relaxed ${bgColor === '#000000' ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}
                   style={{ fontSize: (fontSize * (isPreview ? 1.4 : 1)) + 'px' }}
                 >{slide.content}</p>
               </>
             )}
           </div>
           <div style={{ height: `${100 - (slideAlignments[i] ?? 50)}%` }} className="transition-all duration-300 flex-shrink-0"></div>
         </div>
         
         {slide.customImage && (
           <div
             className={`absolute z-20 transition-shadow ${(!isPreview && selectedImageIndex === i) ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-xl' : ''}`}
             style={{
               left: (imagePositions[i] ? imagePositions[i].x : 50) + '%',
               top: (imagePositions[i] ? imagePositions[i].y : 70) + '%',
               transform: `translate(-50%, -50%) rotate(${imageRotations[i] || 0}deg)`,
               cursor: (dragging && dragging.slideIndex === i) ? 'grabbing' : (isPreview ? 'default' : 'grab'),
               userSelect: 'none'
             }}
             onMouseDown={(e) => { if(!isPreview) handleDragStart(e, i) }}
           >
             <div className="relative group/img">
               <img
                 id={`custom-img-${i}`}
                 src={slide.customImage}
                 className="rounded-xl shadow-md border-2 border-white/50 object-cover pointer-events-none"
                 style={{ 
                   width: (imageSizes[i] || imageSize) * (isPreview ? 1.5 : 1) + 'px', 
                   height: (imageSizes[i] || imageSize) * (isPreview ? 1.5 : 1) + 'px' 
                 }}
                 alt="Custom"
                 draggable={false}
               />
               
               {!isPreview && selectedImageIndex === i && (
                 <>
                   <div 
                     className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center cursor-alias text-[12px] text-gray-500 hover:text-indigo-600 z-30"
                     onMouseDown={(e) => handleTransformStart(e, i, 'rotate')}
                   >↻</div>
                   <div 
                     className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-30"
                     onMouseDown={(e) => handleTransformStart(e, i, 'resize')}
                   ></div>
                 </>
               )}
               
               {!isPreview && (
                 <button onClick={(e) => { e.stopPropagation(); removeCustomImage(i); }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity slide-actions z-40"><FiTrash2 size={12}/></button>
               )}
             </div>
           </div>
         )}
         
         {!isPreview && (
           <div className="absolute bottom-4 right-4 slide-actions z-30 flex gap-1 pointer-events-auto">
             <div className="flex flex-col items-center gap-1 bg-white/80 dark:bg-gray-700/80 p-1.5 rounded-lg mr-1 backdrop-blur shadow-sm">
               <input type="range" min="0" max="100" value={slideAlignments[i] ?? 50} 
                 onChange={(e) => setSlideAlignment(i, Number(e.target.value))} 
                 className="w-16 accent-indigo-600 cursor-pointer h-1 bg-gray-200 rounded-lg appearance-none"
               />
               <span className="text-[7px] font-black uppercase text-gray-500 leading-none mt-1">Alineación</span>
             </div>
             <div className="flex flex-col gap-1">
               <button onClick={(e) => { e.stopPropagation(); setPreviewIndex(i); }} className="p-1.5 bg-white/80 text-indigo-600 rounded-lg hover:bg-white shadow-sm"><FiMaximize2 size={12}/></button>
               <button onClick={(e) => { e.stopPropagation(); setEditingIndex(i === editingIndex ? null : i); }} className="p-1.5 bg-white/80 text-amber-500 rounded-lg hover:bg-white shadow-sm"><FiEdit3 size={12}/></button>
               <label className="p-1.5 bg-white/80 text-blue-500 rounded-lg hover:bg-white shadow-sm cursor-pointer" onClick={e => e.stopPropagation()}>
                 <FiPlusCircle size={12}/>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAddImage(i, e)} />
               </label>
               <button onClick={(e) => { e.stopPropagation(); copyToClipboard(slide.title + '\n' + slide.content, i); }} className="p-1.5 bg-white/80 text-gray-400 rounded-lg hover:bg-white shadow-sm">
                 {copiedField === i ? <FiCheck className="text-green-500" size={12} /> : <FiCopy size={12} />}
               </button>
             </div>
           </div>
         )}
      </div>
    );
  };

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-[1480px] mx-auto px-4 pt-6">
        
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" />
            Crear Contenido IA
          </h1>
        </header>



        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Element 1: Sidebar Selection */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">1. Selecciona un artículo</h2>
              <select
                value={selectedPost?.id || ''}
                onChange={(e) => {
                  const post = posts.find(p => p.id === parseInt(e.target.value))
                  setSelectedPost(post);
                  setGeneratedContent(null);
                }}
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-medium p-3 border truncate font-manrope"
              >
                <option value="" disabled>Elegir artículo...</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedPost && (
          <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl animate-fadeIn relative w-full lg:w-[1095px]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-black mb-1">¿Qué quieres crear hoy?</h3>
                <p className="text-indigo-100 text-sm">Transforma tu artículo en contenido viral para redes sociales.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto min-w-[400px]">
                <button 
                  onClick={() => handleGenerate('reel')} 
                  disabled={generating} 
                  className="flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl font-black transition-all border border-white/10"
                >
                  <FiInstagram className="text-xl" /> Guion para Reel
                </button>
                <button 
                  onClick={() => handleGenerate('carousel')} 
                  disabled={generating} 
                  className="flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl font-black transition-all border border-white/10"
                >
                  <FiImage className="text-xl" /> Estructura Carrusel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Area: Generated Content or Placeholder - Moved below as per magenta box */}
        <div className="mt-8">
          {generating ? (
              <div className="h-[300px] w-full lg:w-[1095px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100">
                <FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="font-bold text-gray-900 dark:text-white font-manrope">IA procesando contenido...</p>
              </div>
            ) : generatedContent ? (
              <div className="w-full lg:w-[1095px] space-y-6 animate-fadeIn">
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
                             <p className="text-[10px] font-black uppercase text-gray-600 mb-1 leading-none">Color Fondo</p>
                             <span className="text-[10px] font-mono text-gray-600 uppercase leading-none">{bgColor}</span>
                           </div>
                           <input 
                             type="color"
                             value={bgColor}
                             onChange={(e) => setBgColor(e.target.value)}
                             className="h-[40px] w-[80px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm"
                           />
                        </div>

                        {/* Font size - content */}
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Fuente Contenido</p>
                          <div className="flex items-center gap-2">
                            <input type="range" min={10} max={24} step={1} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-24 accent-indigo-600" />
                            <span className="text-[10px] font-mono text-gray-600 w-8">{fontSize}px</span>
                          </div>
                        </div>

                        {/* Font size - doctor name */}
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Fuente Nombre</p>
                          <div className="flex items-center gap-2">
                            <input type="range" min={8} max={20} step={1} value={headerFontSize} onChange={(e) => setHeaderFontSize(Number(e.target.value))} className="w-24 accent-purple-600" />
                            <span className="text-[10px] font-mono text-gray-600 w-8">{headerFontSize}px</span>
                          </div>
                        </div>

                        {/* Image size */}
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Tam. Imagen</p>
                          <div className="flex items-center gap-2">
                            <input type="range" min={60} max={200} step={10} value={imageSize} onChange={(e) => setImageSize(Number(e.target.value))} className="w-24 accent-blue-600" />
                            <span className="text-[10px] font-mono text-gray-600 w-12">{imageSize}px</span>
                          </div>
                        </div>

                        {/* Watermark */}
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Marca de Agua</p>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-xs font-bold text-gray-700 transition-all">
                              <FiUpload size={12} /> {watermarkImage ? 'Cambiar' : 'Subir'}
                              <input type="file" className="hidden" accept="image/*" onChange={handleWatermark} />
                            </label>
                            {watermarkImage && (
                              <button onClick={() => setWatermarkImage(null)} className="p-1 bg-red-100 text-red-500 rounded-lg hover:bg-red-200">
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <button onClick={downloadCarousel} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700">Descargar ZIP 📦</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {generatedContent.slides.map((slide, i) => renderSlideContent(slide, i))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] w-full lg:w-[1095px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100">
                <FiCpu className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">Editor de Contenido IA</h3>
                <p className="text-gray-500 text-sm text-center">Selecciona un artículo para comenzar.</p>
              </div>
            )}
          </div>
        </div>

      {/* Preview Modal */}
      {previewIndex !== null && generatedContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          {previewIndex > 0 && (
            <button onClick={() => setPreviewIndex(previewIndex - 1)} className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:scale-110">
              <FiChevronLeft size={32} />
            </button>
          )}
          
          <div className="w-full max-w-xl shadow-2xl transition-all duration-300 scale-[1.1] md:scale-[1.3] z-[105]">
            {renderSlideContent(generatedContent.slides[previewIndex], previewIndex, true)}
          </div>
          
          {previewIndex < generatedContent.slides.length - 1 && (
            <button onClick={() => setPreviewIndex(previewIndex + 1)} className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:scale-110">
              <FiChevronRight size={32} />
            </button>
          )}

          <button onClick={() => setPreviewIndex(null)} className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:bg-red-500">
            <FiX size={32} />
          </button>
        </div>
      )}
    </div>
  )
}
