import { useState, useEffect, useRef } from 'react'
import { 
  FiCpu, FiInstagram, FiImage, FiCopy, FiCheck, 
  FiLoader, FiMaximize2, FiX, FiChevronLeft, FiChevronRight,
  FiEdit3, FiPlusCircle, FiTrash2, FiUpload, FiLayers,
  FiType, FiBox, FiSettings, FiMousePointer, FiMove
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
  const [headerFontSize, setHeaderFontSize] = useState(15)
  const [titleColor, setTitleColor] = useState('#4f46e5')
  const [contentColor, setContentColor] = useState('#374151')
  const [headerColor, setHeaderColor] = useState('#111827')
  const [watermarkImage, setWatermarkImage] = useState(null)
  const [imagePositions, setImagePositions] = useState({})
  const [imageSize, setImageSize] = useState(100)
  const [dragging, setDragging] = useState(null)
  const [slideAlignments, setSlideAlignments] = useState({})
  const slideRefs = useRef({})
  const [imageSizes, setImageSizes] = useState({})
  const [imageRotations, setImageRotations] = useState({})
  const [selectedImageId, setSelectedImageId] = useState(null) // "slideIndex-imgIndex"
  const [contentPositions, setContentPositions] = useState({})
  const [contentRotations, setContentRotations] = useState({})
  const [selectedContentIndex, setSelectedContentIndex] = useState(null)
  const [transformState, setTransformState] = useState(null)
  const [imageZIndexes, setImageZIndexes] = useState({})
  const [extraElements, setExtraElements] = useState({}) // { slideIndex: [{id, type, content, x, y, size, rotation, color}] }
  const [activeSidebarTab, setActiveSidebarTab] = useState('text')
  const [selectedExtraId, setSelectedExtraId] = useState(null) // "slideIndex-elementId"
  const [currentSlidePage, setCurrentSlidePage] = useState(0)

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

  const handleTestDesign = () => {
    setActiveTab('carousel')
    const testData = {
      type: 'carousel',
      slides: [
        { title: "DISEÑO DE PRUEBA 1", content: "• Este es un boceto para pruebas\n• Puedes editar este texto libremente\n• Prueba los degradados y capas" },
        { title: "DISEÑO DE PRUEBA 2", content: "• Añade iconos médicos desde el panel\n• Envía elementos al fondo\n• Cambia los colores de fondo" }
      ],
      image_prompts: ["Ginecología moderna", "Tecnología médica"]
    }
    
    // Add some default extra elements to test features
    const sampleExtra = [
      {
        id: 'test-blob-' + Date.now(),
        type: 'icon',
        content: 'blob1',
        x: 20,
        y: 20,
        width: 200,
        height: 200,
        rotation: 0,
        color: '#e0e7ff',
        color2: '#c7d2fe',
        useGradient: true,
        gradientDir: '135deg',
        zIndex: 10
      },
      {
        id: 'test-stetho-' + Date.now(),
        type: 'icon',
        content: 'stetho',
        x: 80,
        y: 80,
        width: 60,
        height: 60,
        rotation: -15,
        color: '#4f46e5',
        color2: '#9333ea',
        useGradient: true,
        gradientDir: 'to bottom right',
        zIndex: 40
      }
    ]
    
    setGeneratedContent(testData)
    setExtraElements({ 0: sampleExtra })
    showToast('Lienzo de prueba cargado', 'success')
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
        if (!newSlides[index].customImages) newSlides[index].customImages = []
        newSlides[index].customImages.push(reader.result)
        setGeneratedContent({ ...generatedContent, slides: newSlides })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCustomImage = (slideIndex, imgIndex) => {
    const newSlides = [...generatedContent.slides]
    newSlides[slideIndex].customImages.splice(imgIndex, 1)
    setGeneratedContent({ ...generatedContent, slides: newSlides })
    setSelectedImageId(null)
  }

  const handleWatermark = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setWatermarkImage(reader.result)
    reader.readAsDataURL(file)
  }

  const addExtraElement = (slideIndex, type, content = '') => {
    const id = Math.random().toString(36).substr(2, 9)
    const newElement = {
      id,
      type,
      content: content || (type === 'text' ? 'Nuevo Texto' : 'arrow'),
      x: 50,
      y: 30,
      width: type === 'text' ? 100 : 60,
      height: type === 'text' ? 40 : 60,
      rotation: 0,
      color: type === 'text' ? contentColor : titleColor,
      color2: '#4f46e5',
      useGradient: false,
      gradientDir: 'to bottom right',
      zIndex: 30
    }
    
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || []
      return { ...prev, [slideIndex]: [...slideElements, newElement] }
    })
    setSelectedExtraId(`${slideIndex}-${id}`)
  }

  const updateExtraElement = (slideIndex, elementId, updates) => {
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || []
      const newElements = slideElements.map(el => el.id === elementId ? { ...el, ...updates } : el)
      return { ...prev, [slideIndex]: newElements }
    })
  }

  const removeExtraElement = (slideIndex, elementId) => {
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || []
      const newElements = slideElements.filter(el => el.id !== elementId)
      return { ...prev, [slideIndex]: newElements }
    })
    setSelectedExtraId(null)
  }

  const handleDragStart = (e, slideIndex, type = 'image', imgIndex = null, extraId = null) => {
    e.preventDefault()
    e.stopPropagation()
    
    let id = slideIndex
    if (type === 'image') id = `${slideIndex}-${imgIndex}`
    if (type === 'extra') id = `${slideIndex}-${extraId}`
    
    if (type === 'image') {
      setSelectedImageId(id)
      setSelectedContentIndex(null)
      setSelectedExtraId(null)
    } else if (type === 'content') {
      setSelectedContentIndex(slideIndex)
      setSelectedImageId(null)
      setSelectedExtraId(null)
    } else {
      setSelectedExtraId(id)
      setSelectedImageId(null)
      setSelectedContentIndex(null)
    }
    
    const rect = slideRefs.current[slideIndex]?.getBoundingClientRect()
    if (!rect) return
    
    let pos = { x: 50, y: 50 }
    if (type === 'image') pos = imagePositions[id] || { x: 50, y: 70 }
    else if (type === 'content') pos = contentPositions[slideIndex] || { x: 50, y: 50 }
    else if (type === 'extra') {
      const el = extraElements[slideIndex]?.find(e => e.id === extraId)
      pos = el ? { x: el.x, y: el.y } : { x: 50, y: 50 }
    }
      
    setDragging({
      type,
      slideIndex,
      imgIndex,
      extraId,
      id,
      offsetX: e.clientX - rect.left - (pos.x / 100) * rect.width,
      offsetY: e.clientY - rect.top - (pos.y / 100) * rect.height,
      rect
    })
  }

  const handleTransformStart = (e, slideIndex, type, imgIndex = null, extraId = null) => {
    e.preventDefault()
    e.stopPropagation()
    
    let id = slideIndex
    if (imgIndex !== null) id = `${slideIndex}-${imgIndex}`
    if (extraId !== null) id = `${slideIndex}-${extraId}`
    
    const rect = slideRefs.current[slideIndex]?.getBoundingClientRect()
    
    let pos = { x: 50, y: 50 }
    let initialWidth = 100
    let initialHeight = 100
    let initialRotation = 0
    
    if (imgIndex !== null) {
      pos = imagePositions[id] || { x: 50, y: 70 }
      initialWidth = imageSizes[id] || imageSize
      initialHeight = imageSizes[id] || imageSize
      initialRotation = imageRotations[id] || 0
    } else if (extraId !== null) {
      const el = extraElements[slideIndex]?.find(e => e.id === extraId)
      if (el) {
        pos = { x: el.x, y: el.y }
        initialWidth = el.width || el.size
        initialHeight = el.height || el.size
        initialRotation = el.rotation
      }
    }
    if (!rect) return
    setTransformState({
      transformType: type, // 'resize', 'resize-w', 'resize-h', 'rotate'
      elementType: imgIndex !== null ? 'image' : 'extra',
      slideIndex,
      imgIndex,
      extraId,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth,
      initialHeight,
      initialRotation,
      rect,
      centerX: rect.left + (pos.x / 100) * rect.width,
      centerY: rect.top + (pos.y / 100) * rect.height
    })
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragging) {
        const { type, slideIndex, id, extraId, offsetX, offsetY, rect } = dragging
        const xPct = Math.min(95, Math.max(5, ((e.clientX - rect.left - offsetX) / rect.width) * 100))
        const yPct = Math.min(95, Math.max(5, ((e.clientY - rect.top - offsetY) / rect.height) * 100))
        
        if (type === 'image') {
          setImagePositions(prev => ({ ...prev, [id]: { x: xPct, y: yPct } }))
        } else if (type === 'content') {
          setContentPositions(prev => ({ ...prev, [slideIndex]: { x: xPct, y: yPct } }))
        } else if (type === 'extra') {
          updateExtraElement(slideIndex, extraId, { x: xPct, y: yPct })
        }
      } else if (transformState) {
        const { transformType, elementType, slideIndex, id, extraId, startX, startY, initialWidth, initialHeight, initialRotation, centerX, centerY } = transformState
        if (transformType === 'resize') {
          const deltaX = e.clientX - startX
          const newSize = Math.max(elementType === 'image' ? 50 : 10, initialWidth + deltaX)
          if (elementType === 'image') setImageSizes(prev => ({ ...prev, [id]: newSize }))
          else if (elementType === 'extra') updateExtraElement(slideIndex, extraId, { width: newSize, height: newSize })
        } else if (transformType === 'resize-w') {
          const deltaX = e.clientX - startX
          updateExtraElement(slideIndex, extraId, { width: Math.max(10, initialWidth + deltaX) })
        } else if (transformType === 'resize-h') {
          const deltaY = e.clientY - startY
          updateExtraElement(slideIndex, extraId, { height: Math.max(10, initialHeight + deltaY) })
        } else if (transformType === 'rotate') {
          const startAngle = Math.atan2(startY - centerY, startX - centerX)
          const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
          const angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
          if (elementType === 'image') setImageRotations(prev => ({ ...prev, [id]: initialRotation + angleDiff }))
          else if (elementType === 'extra') updateExtraElement(slideIndex, extraId, { rotation: initialRotation + angleDiff })
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



  const rotateImage90 = (id) => {
    const current = imageRotations[id] || 0
    setImageRotations(prev => ({ ...prev, [id]: (current + 90) % 360 }))
  }

  const sendImageToBack = (id) => {
    setImageZIndexes(prev => ({ ...prev, [id]: 5 }))
  }

  const bringImageToFront = (id) => {
    setImageZIndexes(prev => ({ ...prev, [id]: 20 }))
  }

  const downloadCarousel = async () => {
    const zip = new JSZip()
    // Query the hidden export slides
    const slides = document.querySelectorAll('.export-slide-item')
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


  const renderSlideContent = (slide, i, isPreview = false, isExport = false) => {
    const isHidden = isExport;
    return (
      <div
         key={i + (isExport ? '-export' : '')}
         ref={el => { if (!isPreview && !isExport) slideRefs.current[i] = el; }}
         className={`${isExport ? 'export-slide-item' : 'carousel-slide-item'} rounded-none p-10 flex flex-col relative group shadow-xl overflow-hidden`}
         style={{ 
           backgroundColor: bgColor, 
           border: '1px solid #d1d5db', 
           width: '410px', 
           height: '410px',
           position: isExport ? 'relative' : undefined 
         }}
         onClick={() => { if (!isPreview && !isExport) { setSelectedImageId(null); setSelectedContentIndex(null); setSelectedExtraId(null); } }}
       >
         {watermarkImage && (
           <img src={watermarkImage} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" style={{ opacity: 0.08 }} />
         )}
         
         <div className="flex items-center justify-start gap-3 mb-10 border-b border-gray-100 dark:border-gray-700/50 pb-6 w-full relative z-30">
           <div className="w-12 h-12 flex items-center justify-center overflow-hidden flex-shrink-0">
             {doctorLogoBase64 ? (
               <img src={doctorLogoBase64} alt="Logo" className="w-full h-full object-contain" />
             ) : <div className="w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black">GS</div>}
           </div>
           <span
             style={{ 
               fontSize: headerFontSize + 'px',
               color: headerColor
             }}
             className="font-black uppercase tracking-tight"
           >{doctor?.nombre_completo}</span>
         </div>
         
         {!isPreview && !isExport && (
           <span className="absolute top-20 right-8 text-7xl font-black text-black/5 dark:text-white/5 pointer-events-none">{i+1}</span>
         )}
         
         {/* Main Content (Title + Body) - Now Draggable */}
         <div 
           className={`absolute z-10 transition-shadow pointer-events-auto w-[calc(100%-4rem)] px-4 ${(!isPreview && !isExport && selectedContentIndex === i) ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-2xl p-4 bg-white/5 backdrop-blur-sm' : ''}`}
           style={{
             left: (contentPositions[i] ? contentPositions[i].x : 50) + '%',
             top: (contentPositions[i] ? contentPositions[i].y : (slideAlignments[i] ?? 60)) + '%',
             transform: `translate(-50%, -50%) rotate(${contentRotations[i] || 0}deg)`,
             cursor: (dragging && dragging.type === 'content' && dragging.slideIndex === i) ? 'grabbing' : ((isPreview || isExport) ? 'default' : 'grab'),
             userSelect: 'none'
           }}
           onMouseDown={(e) => { if(!isPreview && !isExport) handleDragStart(e, i, 'content') }}
           onClick={(e) => { if(!isPreview && !isExport) { e.stopPropagation(); setSelectedContentIndex(i); setSelectedImageIndex(null); } }}
         >
           <div className="text-center relative">
             {(editingIndex === i && !isPreview && !isExport) ? (
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
                   className="font-black mb-3 uppercase leading-tight"
                   style={{ 
                     fontSize: (fontSize + 4) + 'px',
                     color: titleColor
                   }}
                 >{slide.title}</h4>
                 <div className="h-1 w-12 bg-indigo-600/30 mb-3 rounded-full mx-auto"></div>
                 <p
                   className="font-bold leading-relaxed whitespace-pre-wrap"
                   style={{ 
                     fontSize: fontSize + 'px',
                     color: contentColor
                   }}
                 >{slide.content}</p>
               </>
             )}
           </div>
         </div>
         
         {slide.customImages?.map((img, imgIdx) => {
            const imgId = `${i}-${imgIdx}`
            return (
              <div
                key={imgId}
                className={`absolute z-20 transition-shadow ${(!isPreview && !isExport && selectedImageId === imgId) ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-xl' : ''}`}
                style={{
                  left: (imagePositions[imgId] ? imagePositions[imgId].x : 50) + '%',
                  top: (imagePositions[imgId] ? imagePositions[imgId].y : 70) + '%',
                  transform: `translate(-50%, -50%) rotate(${imageRotations[imgId] || 0}deg)`,
                  zIndex: imageZIndexes[imgId] || 20,
                  cursor: (dragging && dragging.id === imgId) ? 'grabbing' : ((isPreview || isExport) ? 'default' : 'grab'),
                  userSelect: 'none'
                }}
                onMouseDown={(e) => { if(!isPreview && !isExport) handleDragStart(e, i, 'image', imgIdx) }}
                onClick={(e) => { if(!isPreview && !isExport) { e.stopPropagation(); setSelectedImageId(imgId); setSelectedContentIndex(null); setSelectedExtraId(null); } }}
              >
                <div className="relative group/img">
                  <img
                    src={img}
                    className="rounded-xl shadow-md border-2 border-white/50 object-cover pointer-events-none"
                    style={{ 
                      width: (imageSizes[imgId] || imageSize) + 'px', 
                      height: (imageSizes[imgId] || imageSize) + 'px' 
                    }}
                    alt="Custom"
                    draggable={false}
                  />
                  
                  {!isPreview && !isExport && selectedImageId === imgId && (
                    <>
                      <div 
                        className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center cursor-alias text-[12px] text-gray-500 hover:text-indigo-600 z-30"
                        onMouseDown={(e) => handleTransformStart(e, i, 'rotate', imgIdx)}
                      >↻</div>
                      {/* Proportional Resize handle (bottom-right) */}
                      <div 
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleTransformStart(e, i, 'resize', imgIdx)}
                      ></div>
                      <button type="button" className={`absolute -bottom-2 -left-2 w-7 h-7 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-pointer z-30 transition-colors ${imageZIndexes[imgId] === 5 ? 'bg-amber-500 text-white' : 'bg-white text-indigo-600 hover:bg-gray-50'}`}
                        onClick={(e) => { e.stopPropagation(); imageZIndexes[imgId] === 5 ? bringImageToFront(imgId) : sendImageToBack(imgId); }}
                        title={imageZIndexes[imgId] === 5 ? "Traer al frente" : "Enviar al fondo"}
                      >
                        <FiLayers size={12} />
                      </button>
                    </>
                  )}
                  
                  {!isPreview && !isExport && (
                    <button onClick={(e) => { e.stopPropagation(); removeCustomImage(i, imgIdx); }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity slide-actions z-40"><FiTrash2 size={12}/></button>
                  )}
                </div>
              </div>
            )
          })}

          {extraElements[i]?.map((el) => {
            const elId = `${i}-${el.id}`
            return (
              <div
                key={el.id}
                className={`absolute z-[30] transition-shadow ${(!isPreview && !isExport && selectedExtraId === elId) ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''} ${el.type === 'text' ? 'p-2 rounded-lg' : ''}`}
                style={{
                  left: el.x + '%',
                  top: el.y + '%',
                  transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                  zIndex: el.zIndex || 30,
                  cursor: (dragging && dragging.id === elId) ? 'grabbing' : ((isPreview || isExport) ? 'default' : 'grab'),
                  userSelect: 'none'
                }}
                onMouseDown={(e) => { if(!isPreview && !isExport) handleDragStart(e, i, 'extra', null, el.id) }}
                onClick={(e) => { if(!isPreview && !isExport) { e.stopPropagation(); setSelectedExtraId(elId); setSelectedImageId(null); setSelectedContentIndex(null); } }}
              >
                {el.type === 'text' ? (
                  <div 
                    contentEditable={!isPreview && !isExport && selectedExtraId === elId}
                    suppressContentEditableWarning
                    className="font-bold whitespace-nowrap outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 transition-all"
                    style={{ 
                      fontSize: (el.width/5) + 'px', 
                      color: el.color,
                      background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2})` : 'transparent',
                      WebkitBackgroundClip: el.useGradient ? 'text' : 'initial',
                      WebkitTextFillColor: el.useGradient ? 'transparent' : 'initial'
                    }}
                    onBlur={(e) => updateExtraElement(i, el.id, { content: e.target.innerText })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => { if (!isPreview && !isExport && selectedExtraId === elId) e.stopPropagation(); }}
                  >
                    {el.content}
                  </div>
                ) : (
                  <div 
                    style={{ 
                      width: el.width + 'px', 
                      height: el.height + 'px', 
                      color: el.color
                    }}
                    className="flex items-center justify-center overflow-visible"
                  >
                    {el.content === 'arrow' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                    </svg>}
                    {el.content === 'arrow-left' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M7.99 11H20v2H7.99v3L4 12l3.99-4z"/>
                    </svg>}
                    {el.content === 'arrow-up' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M13 7.99V20h-2V7.99H8L12 4l4 3.99z"/>
                    </svg>}
                    {el.content === 'arrow-down' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M11 16.01V4h2v12.01h3L12 20l-4-3.99z"/>
                    </svg>}
                    {el.content === 'line' && <div className="w-full h-full" style={{ background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2})` : el.color, minHeight: '1px' }} />}
                    {el.content === 'circle' && <div className="w-full h-full rounded-full" style={{ background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2})` : el.color }} />}
                    {el.content === 'square' && <div className="w-full h-full" style={{ background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2})` : el.color }} />}
                    {el.content === 'rounded-square' && <div className="w-full h-full rounded-[20%]" style={{ background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2})` : el.color }} />}
                    {el.content === 'star' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>}
                    {el.content === 'heart' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>}
                    {el.content === 'cloud' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M17.5 19c-3.037 0-5.5-2.463-5.5-5.5 0-1.47.576-2.805 1.517-3.801C11.523 9.243 9.407 8 7 8 3.134 8 0 11.134 0 15c0 3.866 3.134 7 7 7h10.5c3.037 0 5.5-2.463 5.5-5.5S20.537 11 17.5 11c-.347 0-.684.032-1.01.094.006-.031.01-.062.01-.094 0-2.485-2.015-4.5-4.5-4.5-1.228 0-2.341.493-3.155 1.292C8.36 7.307 8 8.11 8 9c0 1.228.493 2.341 1.292 3.155C8.493 12.97 8 14.083 8 15.307c0 1.24.49 2.364 1.284 3.189-.806.81-1.284 1.92-1.284 3.144C8 24.16 10.34 26.5 13.16 26.5c1.225 0 2.336-.43 3.204-1.146C17.218 26 18.533 26.5 20 26.5c3.037 0 5.5-2.463 5.5-5.5 0-.583-.092-1.144-.261-1.668.463.108.944.168 1.441.168 3.037 0 5.5-2.463 5.5-5.5S29.717 8.5 26.68 8.5c-.347 0-.684.032-1.01.094C25.676 5.867 23.56 4.623 21.043 4.623 18.257 4.623 16 6.88 16 9.667c0 .347.032.684.094 1.01C14.867 10.676 13.623 8.56 13.623 6.043 13.623 3.257 15.88 1 18.667 1c2.787 0 5.043 2.256 5.043 5.043 0 .347-.032.684-.094 1.01C1.221 0 2.336.43 3.204 1.146C27.676 7.5 28.99 7 30.457 7 33.494 7 35.957 9.463 35.957 12.5S33.494 18 30.457 18H20.457"/></svg>}
                    {el.content === 'bubble' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>}
                    {el.content === 'bullet' && <div className="w-full h-full rounded-full bg-current" />}
                    {el.content === 'bullet-check' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>}
                    
                    {/* New Specialized Icons */}
                    {el.content === 'stetho' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm8-10h-2c0-4.4-3.6-8-8-8s-8 3.6-8 8H2c0 5.5 4.5 10 10 10s10-4.5 10-10z"/>
                    </svg>}
                    {el.content === 'dna' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M18.8 15.6c-.6-.6-1.5-.6-2.1 0l-1.1 1.1-1.1-1.1c-.6-.6-1.5-.6-2.1 0s-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1.3.3.7.4 1.1.4s.8-.1 1.1-.4l1.1-1.1 1.1 1.1c.3.3.7.4 1.1.4s.8-.1 1.1-.4c.6-.6.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.5-.6.5-1.5-.1-2.1zM5.2 8.4c.6.6 1.5.6 2.1 0l1.1-1.1 1.1 1.1c.6.6 1.5.6 2.1 0s.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.6-.6.6-1.5 0-2.1-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4l-1.1 1.1-1.1-1.1c-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4c-.6.6-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1z"/>
                    </svg>}
                    {el.content === 'utero' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8 0-1.5.4-2.8 1.1-4 .6 1.1 1.6 2 2.9 2.6-.1.5-.2 1.1-.2 1.6 0 2.2 1.8 4 4 4s4-1.8 4-4c0-.5-.1-1.1-.2-1.6 1.3-.6 2.3-1.5 2.9-2.6.7 1.2 1.1 2.5 1.1 4 0 4.4-3.6 8-8 8z"/>
                    </svg>}
                    {el.content === 'blob1' && <svg viewBox="0 0 200 200" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87.1,-15.7,85.2,-0.9C83.3,13.8,76.1,27.7,67.6,40.1C59.1,52.5,49.3,63.5,37.3,71.1C25.3,78.7,11.1,82.9,-3.4,88.7C-17.9,94.5,-32.7,101.9,-45.3,97.7C-57.9,93.5,-68.3,77.7,-76.1,62.3C-83.9,46.9,-89.1,31.9,-90.1,16.8C-91.1,1.7,-87.9,-13.5,-82,-27.1C-76.1,-40.7,-67.5,-52.7,-56.3,-62C-45.1,-71.3,-31.3,-77.9,-17.1,-80.9C-2.9,-83.9,11.7,-83.3,44.7,-76.4Z" transform="translate(100 100)" />
                    </svg>}
                    {el.content === 'sparkle' && <svg viewBox="0 0 24 24" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} className="w-full h-full overflow-visible">
                      {el.useGradient && <defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="100%" style={{stopColor: el.color2}} /></linearGradient></defs>}
                      <path d="M12 2l2.4 7.2L22 11.6l-7.6 2.4L12 22l-2.4-7.6L2 11.6l7.6-2.4L12 2z"/>
                    </svg>}
                  </div>
                )}

                {!isPreview && !isExport && selectedExtraId === elId && (
                  <>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-alias text-[10px] z-40" onMouseDown={(e) => handleTransformStart(e, i, 'rotate', null, el.id)}>↻</div>
                    
                    {/* Width Resize handle */}
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-8 bg-indigo-600 rounded-full cursor-ew-resize z-40" onMouseDown={(e) => handleTransformStart(e, i, 'resize-w', null, el.id)}></div>
                    
                    {/* Height Resize handle */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-indigo-600 rounded-full cursor-ns-resize z-40" onMouseDown={(e) => handleTransformStart(e, i, 'resize-h', null, el.id)}></div>
                    
                    {/* Proportional Resize handle (bottom-right) */}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform" onMouseDown={(e) => handleTransformStart(e, i, 'resize', null, el.id)}></div>
                    

                  </>
                )}
              </div>
            )
          })}
         
         {!isPreview && (
           <div className="absolute bottom-4 right-4 slide-actions z-30 flex gap-1 pointer-events-auto">
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
                <button 
                  onClick={handleTestDesign}
                  className="col-span-1 sm:col-span-2 flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 p-4 rounded-2xl font-black transition-all shadow-lg text-white"
                >
                  🧪 Iniciar Modo Boceto (Sin IA)
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
                       {/* Row 1: Colors */}
                       <div className="flex flex-wrap items-center gap-8 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700/50">
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

                         <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-gray-600 mb-1 leading-none">Color Título</p>
                              <span className="text-[10px] font-mono text-gray-600 uppercase leading-none">{titleColor}</span>
                            </div>
                            <input 
                              type="color"
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm"
                            />
                         </div>

                         <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-gray-600 mb-1 leading-none">Color Texto</p>
                              <span className="text-[10px] font-mono text-gray-600 uppercase leading-none">{contentColor}</span>
                            </div>
                            <input 
                              type="color"
                              value={contentColor}
                              onChange={(e) => setContentColor(e.target.value)}
                              className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm"
                            />
                         </div>

                         <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-gray-600 mb-1 leading-none">Color Nombre</p>
                              <span className="text-[10px] font-mono text-gray-600 uppercase leading-none">{headerColor}</span>
                            </div>
                            <input 
                              type="color"
                              value={headerColor}
                              onChange={(e) => setHeaderColor(e.target.value)}
                              className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm"
                            />
                         </div>
                       </div>

                       {/* Row 2: Font Sizes and Image Options */}
                       <div className="flex flex-wrap items-center justify-between gap-8 mb-8">
                         <div className="flex flex-wrap items-center gap-8">
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
                               <input type="range" min={8} max={24} step={1} value={headerFontSize} onChange={(e) => setHeaderFontSize(Number(e.target.value))} className="w-24 accent-purple-600" />
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
                         </div>

                         <button onClick={downloadCarousel} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                           Descargar ZIP 📦
                         </button>
                       </div>

                       <div className="flex gap-8 items-start">
                        {/* Sidebar (Canva-like) */}
                        <div className="w-64 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex overflow-hidden min-h-[500px] sticky top-24">
                           <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col items-center py-6 gap-6">
                              <button onClick={() => setActiveSidebarTab('text')} className={`p-3 rounded-xl transition-all ${activeSidebarTab === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-400'}`} title="Texto"><FiType size={20}/></button>
                              <button onClick={() => setActiveSidebarTab('shapes')} className={`p-3 rounded-xl transition-all ${activeSidebarTab === 'shapes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-400'}`} title="Elementos"><FiBox size={20}/></button>
                           </div>
                           <div className="flex-1 p-5 overflow-y-auto">
                              {activeSidebarTab === 'text' && (
                                <div className="space-y-6 animate-fadeIn">
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Fuentes y Textos</p>
                                      <button 
                                        onClick={() => addExtraElement(currentSlidePage, 'text')} 
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                      >
                                        <FiPlusCircle /> Agregar caja de texto
                                      </button>
                                   </div>
                                   <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Diseño de Capas</h3>
                           </div>
                                   <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                      <p className="text-[10px] font-black uppercase text-gray-400 mb-3">Estilos rápidos</p>
                                      <div className="space-y-2">
                                         <button onClick={() => addExtraElement(currentSlidePage, 'text', 'Añadir un título')} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-black text-sm">Añadir un título</button>
                                         <button onClick={() => addExtraElement(currentSlidePage, 'text', 'Añadir un subtítulo')} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs">Añadir un subtítulo</button>
                                         <button onClick={() => addExtraElement(currentSlidePage, 'text', 'Añadir texto de cuerpo')} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-[10px]">Añadir texto de cuerpo</button>
                                      </div>
                                   </div>
                                </div>
                              )}
                              {activeSidebarTab === 'shapes' && (
                                <div className="space-y-6 animate-fadeIn">
                                   <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Elementos Gráficos</p>
                                   <div className="grid grid-cols-2 gap-3">
                                      {[
                                        { id: 'circle', label: 'Círculo', icon: <div className="w-8 h-8 rounded-full bg-current"/> },
                                        { id: 'square', label: 'Rectángulo', icon: <div className="w-8 h-8 bg-current"/> },
                                        { id: 'rounded-square', label: 'R. Redon.', icon: <div className="w-8 h-8 bg-current rounded-[20%]"/> },
                                        { id: 'arrow', label: 'Flecha Der', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/></svg> },
                                        { id: 'arrow-left', label: 'Flecha Izq', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M7.99 11H20v2H7.99v3L4 12l3.99-4z"/></svg> },
                                        { id: 'arrow-up', label: 'Flecha Arr', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7.99V20h-2V7.99H8L12 4l4 3.99z"/></svg> },
                                        { id: 'arrow-down', label: 'Flecha Aba', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M11 16.01V4h2v12.01h3L12 20l-4-3.99z"/></svg> },
                                        { id: 'star', label: 'Estrella', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> },
                                        { id: 'heart', label: 'Corazón', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> },
                                        { id: 'bubble', label: 'Burbuja', icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
                                        { id: 'line', label: 'Línea', icon: <div className="w-10 h-1 bg-current rounded-full" /> },
                                        { id: 'bullet', label: 'Viñeta', icon: <div className="w-4 h-4 rounded-full bg-current" /> },
                                        { id: 'bullet-check', label: 'Viñeta Check', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> },
                                        { id: 'stetho', label: 'Estetoscopio', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm8-10h-2c0-4.4-3.6-8-8-8s-8 3.6-8 8H2c0 5.5 4.5 10 10 10s10-4.5 10-10z"/></svg> },
                                        { id: 'dna', label: 'ADN', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M18.8 15.6c-.6-.6-1.5-.6-2.1 0l-1.1 1.1-1.1-1.1c-.6-.6-1.5-.6-2.1 0s-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1.3.3.7.4 1.1.4s.8-.1 1.1-.4l1.1-1.1 1.1 1.1c.3.3.7.4 1.1.4s.8-.1 1.1-.4c.6-.6.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.5-.6.5-1.5-.1-2.1zM5.2 8.4c.6.6 1.5.6 2.1 0l1.1-1.1 1.1 1.1c.6.6 1.5.6 2.1 0s.6-1.5 0-2.1l-1.1-1.1 1.1-1.1c.6-.6.6-1.5 0-2.1-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4l-1.1 1.1-1.1-1.1c-.3-.3-.7-.4-1.1-.4s-.8.1-1.1.4c-.6.6-.6 1.5 0 2.1l1.1 1.1-1.1 1.1c-.6.6-.6 1.5 0 2.1z"/></svg> },
                                        { id: 'utero', label: 'Útero', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8 0-1.5.4-2.8 1.1-4 .6 1.1 1.6 2 2.9 2.6-.1.5-.2 1.1-.2 1.6 0 2.2 1.8 4 4 4s4-1.8 4-4c0-.5-.1-1.1-.2-1.6 1.3-.6 2.3-1.5 2.9-2.6.7 1.2 1.1 2.5 1.1 4 0 4.4-3.6 8-8 8z"/></svg> },
                                        { id: 'blob1', label: 'Mancha Orgánica', icon: <div className="w-8 h-8 bg-current rounded-full opacity-50" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} /> },
                                        { id: 'sparkle', label: 'Destello', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 11.6l-7.6 2.4L12 22l-2.4-7.6L2 11.6l7.6-2.4L12 2z"/></svg> }
                                      ].map(shape => (
                                        <button 
                                          key={shape.id}
                                          onClick={() => addExtraElement(currentSlidePage, 'shape', shape.id)} 
                                          className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all group p-2" 
                                          title={shape.label}
                                        >
                                           <div className="group-hover:scale-110 transition-transform">
                                              {shape.icon}
                                           </div>
                                        </button>
                                      ))}
                                   </div>
                                </div>
                              )}
                              {activeSidebarTab === 'tools' && null}
                           </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-8">
                           {/* Paginator */}
                           <div className="flex items-center gap-6 bg-white dark:bg-gray-800 px-8 py-0 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                              <button 
                                onClick={() => setCurrentSlidePage(prev => Math.max(0, prev - 1))}
                                disabled={currentSlidePage === 0}
                                className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                              >
                                <FiChevronLeft size={24}/>
                              </button>
                              <div className="flex flex-col items-center">
                                 <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Diapositiva</span>
                                 <span className="text-xl font-black text-indigo-600">{currentSlidePage + 1} <span className="text-gray-300 mx-1">/</span> {generatedContent?.slides?.length || 0}</span>
                              </div>
                              <button 
                                onClick={() => setCurrentSlidePage(prev => Math.min((generatedContent?.slides?.length || 1) - 1, prev + 1))}
                                disabled={currentSlidePage === (generatedContent?.slides?.length || 1) - 1}
                                className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                              >
                                <FiChevronRight size={24}/>
                              </button>
                           </div>

                            {/* Canva-style Top Toolbar for Element Editing */}
                            {selectedExtraId && previewIndex === null && (
                              <div 
                                className="w-fit mx-auto flex items-center justify-center gap-6 bg-white dark:bg-gray-800 p-3 rounded-2xl animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                              >
                               {(() => {
                                 const [slideIdx, elId] = selectedExtraId.split('-');
                                 const sIdx = parseInt(slideIdx);
                                 const el = extraElements[sIdx]?.find(e => e.id === elId);
                                 if (!el) return null;

                                 return (
                                   <>
                                     <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-gray-700">
                                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Edición</span>
                                       <div className="flex items-center gap-2">
                                          <input 
                                            type="color" 
                                            value={el.color} 
                                            onChange={(e) => updateExtraElement(sIdx, el.id, { color: e.target.value })} 
                                            className="w-8 h-8 border-2 border-gray-100 dark:border-gray-600 p-0 bg-transparent cursor-pointer rounded-lg overflow-hidden shadow-sm hover:scale-110 transition-transform"
                                            title="Color 1"
                                          />
                                          {el.useGradient && (
                                            <input 
                                              type="color" 
                                              value={el.color2} 
                                              onChange={(e) => updateExtraElement(sIdx, el.id, { color2: e.target.value })} 
                                              className="w-8 h-8 border-2 border-gray-100 dark:border-gray-600 p-0 bg-transparent cursor-pointer rounded-lg overflow-hidden shadow-sm hover:scale-110 transition-transform"
                                              title="Color 2"
                                            />
                                          )}
                                       </div>
                                     </div>

                                     <div className="flex items-center gap-4 px-6 border-r border-gray-100 dark:border-gray-700">
                                       <label className="flex items-center gap-3 cursor-pointer group select-none" onClick={(e) => e.stopPropagation()}>
                                         <div className="relative flex items-center">
                                           <input 
                                             type="checkbox" 
                                             checked={el.useGradient} 
                                             onChange={(e) => {
                                               e.stopPropagation();
                                               updateExtraElement(sIdx, el.id, { useGradient: e.target.checked });
                                             }}
                                             className="sr-only peer"
                                           />
                                           <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                         </div>
                                         <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-indigo-600 transition-colors">Degradado</span>
                                       </label>
                                     </div>

                                     <div className="flex items-center gap-2 px-6 border-r border-gray-100 dark:border-gray-700">
                                        <button type="button" 
                                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${el.zIndex === 1 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                          onClick={(e) => { e.stopPropagation(); updateExtraElement(sIdx, el.id, { zIndex: el.zIndex === 1 ? 40 : 1 }); }}
                                        >
                                          <FiLayers size={16} />
                                          <span className="text-[8px] font-black uppercase mt-0.5">{el.zIndex === 1 ? 'Fondo' : 'Frente'}</span>
                                        </button>
                                     </div>

                                     <button 
                                       onClick={(e) => { e.stopPropagation(); removeExtraElement(sIdx, el.id); }} 
                                       className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                       title="Eliminar elemento"
                                     >
                                       <FiTrash2 size={16} />
                                     </button>
                                   </>
                                 )
                               })()}
                             </div>
                           )}

                           {/* Main Single Slide Canvas */}
                           <div className="w-full flex justify-center animate-fadeIn" key={currentSlidePage}>
                              {generatedContent?.slides?.[currentSlidePage] && renderSlideContent(generatedContent.slides[currentSlidePage], currentSlidePage)}
                           </div>

                           {/* Hidden Export Slides */}
                           <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
                              {generatedContent?.slides?.map?.((slide, i) => renderSlideContent(slide, i, false, true))}
                           </div>
                        </div>
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
