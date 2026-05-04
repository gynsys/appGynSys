
import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiInstagram, FiImage, FiLoader, FiUpload, FiPlusCircle, FiChevronDown, FiTrash2, FiFolder, FiSave, FiLayers, FiEye, FiDownload } from 'react-icons/fi';
import { blogService } from '../../services/blogService';
import Spinner from '../../../../components/common/Spinner';
import { useToastStore } from '../../../../store/toastStore';
import { getImageUrl } from '../../../../lib/imageUtils';
import { useAuthStore } from '../../../../store/authStore';

// Hooks
import { useSlideDesigner } from './hooks/useSlideDesigner';
import { useDragTransform } from './hooks/useDragTransform';
import { useExport } from './hooks/useExport';

// Components
import { SlideCanvas } from './components/SlideCanvas';
import { SlidePaginator } from './components/SlidePaginator';
import { PreviewModal } from './components/PreviewModal';
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { MobileToolbar } from './components/MobileToolbar';

export default function SocialGenerator() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [scale, setScale] = useState(1);
  const editorWrapperRef = React.useRef(null);
  const [activeTab, setActiveTab] = useState('reel');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [doctorLogoBase64, setDoctorLogoBase64] = useState(null);
  const [showProjects, setShowProjects] = useState(false);
  const [history, setHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pushToHistory = (content) => {
    setHistory(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(content))]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGeneratedContent(lastState);
    setHistory(prev => prev.slice(0, -1));
    showToast('Acción deshecha', 'success');
  };
  
  const slideRefs = useRef({});
  const { showToast } = useToastStore();
  const { user: doctor } = useAuthStore();

  useEffect(() => {
    if (!editorWrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Padding/margins roughly 48px
        const s = Math.min(1, (width - 48) / 410);
        setScale(Math.max(0.4, s)); // Min scale 0.4 for very small screens
      }
    });
    ro.observe(editorWrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const designer = useSlideDesigner();
  const transformer = useDragTransform(designer.canvas.updateExtraElement, scale, {
    setLogoPos: designer.design.setLogoPos,
    setDoctorNamePos: designer.design.setDoctorNamePos,
    setDividerPos: designer.design.setDividerPos
  });
  const exporter = useExport(selectedPost, designer, generatedContent);

  useEffect(() => {
    loadPosts();
    if (doctor?.logo_url) {
      const fetchLogoAsBase64 = async () => {
        try {
          const url = getImageUrl(doctor.logo_url);
          const response = await fetch(url);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => setDoctorLogoBase64(reader.result);
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error("No se pudo precargar el logo en base64", e);
          setDoctorLogoBase64(getImageUrl(doctor.logo_url)); // Fallback a URL estandar
        }
      };
      fetchLogoAsBase64();
    } else {
      setDoctorLogoBase64(null);
    }
  }, [doctor]);



  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await blogService.getMyPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Error al cargar artículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    if (!selectedPost) return;
    try {
      setGenerating(true);
      setActiveTab(type);
      const response = await blogService.generateSocialContent(selectedPost.id, type);
      setGeneratedContent(response);
      showToast('¡Estrategia generada!', 'success');
    } catch (error) {
      showToast('Error en la IA', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleTestDesign = () => {
    setActiveTab('carousel');
    setGeneratedContent({
      type: 'carousel',
      slides: [
        { title: "DISEÑO DE PRUEBA 1", content: "• Este es un boceto para pruebas\n• Puedes editar este texto libremente\n• Prueba los degradados y capas" },
        { title: "DISEÑO DE PRUEBA 2", content: "• Añade iconos médicos desde el panel\n• Envía elementos al fondo\n• Cambia los colores de fondo" }
      ]
    });
    showToast('Lienzo de prueba cargado', 'success');
  };

  const handleAddImage = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        pushToHistory(generatedContent);
        const newSlides = [...generatedContent.slides];
        if (!newSlides[index].customImages) newSlides[index].customImages = [];
        newSlides[index].customImages.push(reader.result);
        setGeneratedContent({ ...generatedContent, slides: newSlides });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (slideIndex, imgIndex) => {
    pushToHistory(generatedContent);
    const newSlides = [...generatedContent.slides];
    if (newSlides[slideIndex]?.customImages) {
      newSlides[slideIndex].customImages = newSlides[slideIndex].customImages.filter((_, i) => i !== imgIndex);
      setGeneratedContent({ ...generatedContent, slides: newSlides });
      showToast('Imagen eliminada', 'success');
    }
  };

  const handleWatermark = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setWatermarkImage(reader.result);
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado al portapapeles', 'success');
  };

  const handleLoadProject = (project) => {
    const content = designer.canvas.loadProject(project);
    if (content) {
      setGeneratedContent(content);
      setActiveTab('carousel');
      showToast('Proyecto cargado', 'success');
    }
  };

  const handleRemoveSlide = (index) => {
    if (generatedContent.slides.length <= 1) {
      showToast('No puedes eliminar la única diapositiva', 'warning');
      return;
    }
    pushToHistory(generatedContent);
    const newSlides = generatedContent.slides.filter((_, i) => i !== index);
    setGeneratedContent({ ...generatedContent, slides: newSlides });
    
    // Adjust current page if needed
    if (designer.canvas.currentSlidePage >= newSlides.length) {
      designer.canvas.setCurrentSlidePage(newSlides.length - 1);
    }
    showToast('Diapositiva eliminada', 'success');
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-[1480px] mx-auto px-4 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" /> Editor GynSys
          </h1>
        </header>

        <div className="space-y-8">
          {/* Top Section: Article Selector and IA Creator */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">1. Crear Nuevo desde Artículo</h2>
                <select
                  value={selectedPost?.id || ''}
                  onChange={(e) => {
                    setSelectedPost(posts.find(p => p.id === parseInt(e.target.value)));
                    setGeneratedContent(null);
                  }}
                  className="block w-full rounded-xl border-gray-200 dark:bg-gray-900 dark:text-white p-3 border font-manrope focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="" disabled>Elegir artículo...</option>
                  {posts.map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">2. Continuar Proyecto Guardado</h2>
                <div className="relative">
                  <button 
                    onClick={() => setShowProjects(!showProjects)}
                    className="flex items-center justify-between w-full px-5 py-3 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 rounded-xl border border-indigo-100 dark:border-indigo-700 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FiFolder className="text-indigo-600" />
                      <span className="text-sm font-black text-indigo-600">Mis Carruseles Guardados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-black">{designer.canvas.projects.length}</span>
                      <FiChevronDown className={`transition-transform duration-300 text-indigo-600 ${showProjects ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {showProjects && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[110] overflow-hidden animate-fadeIn">
                      <div className="max-h-64 overflow-y-auto">
                        {designer.canvas.projects.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 italic text-sm">No tienes carruseles guardados todavía.</div>
                        ) : (
                          designer.canvas.projects.map(p => (
                            <div key={p.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between group">
                              <button 
                                onClick={() => {
                                  handleLoadProject(p);
                                  setShowProjects(false);
                                }}
                                className="text-left flex-1"
                              >
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate pr-4">{p.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(p.id).toLocaleDateString()} - {p.content.slides.length} diapositivas</p>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  designer.canvas.deleteProject(p.id);
                                }} 
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedPost && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black mb-1">IA Creator</h3>
                    <p className="text-indigo-100 text-sm">Transforma tu artículo en contenido social</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 max-w-2xl">
                    <button onClick={() => handleGenerate('reel')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl font-black transition-all border border-white/10 backdrop-blur-sm"><FiInstagram /> Reel Script</button>
                    <button onClick={() => handleGenerate('carousel')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl font-black transition-all border border-white/10 backdrop-blur-sm"><FiImage /> Carousel</button>
                    <button onClick={handleTestDesign} className="flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 p-4 rounded-2xl font-black transition-all text-white shadow-lg">🧪 Draft Mode</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Editor Content */}
          <div className="w-full">
            {generating ? (
              <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100"><FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-bold">IA procesando...</p></div>
            ) : generatedContent ? (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mx-auto">
                  <button onClick={() => setActiveTab('reel')} className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'reel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Script de Guion</button>
                  <button onClick={() => setActiveTab('carousel')} className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'carousel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Editor de Carrusel</button>
                </div>

                {activeTab === 'carousel' && (
                  <div className={`${isMobile ? 'pb-24' : ''}`}>
                    {/* Desktop Layout */}
                    {!isMobile && (
                      <div className="flex gap-6">
                        {/* Enhanced Sidebar */}
                        <EnhancedSidebar
                          design={designer.design}
                          canvas={designer.canvas}
                          transform={transformer.state}
                          currentSlide={designer.canvas.currentSlidePage}
                          onAddElement={(slideIndex, type, content) => {
                            designer.canvas.addExtraElement(slideIndex, type, content);
                            pushToHistory(generatedContent);
                          }}
                          onDownload={exporter.downloadCarousel}
                          onSave={() => designer.canvas.saveProject(generatedContent)}
                          onPreview={() => setPreviewIndex(0)}
                          selectedElement={designer.canvas.selectedExtraId || designer.canvas.selectedImageId}
                          totalSlides={generatedContent.slides.length}
                          generatedContent={generatedContent}
                          onRemoveImage={handleRemoveImage}
                        />
                        
                        {/* Main Editor Area */}
                        <div className="flex-1">
                          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <SlidePaginator current={designer.canvas.currentSlidePage} total={generatedContent.slides.length} onChange={designer.canvas.setCurrentSlidePage} />
                              
                              {/* Quick Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setPreviewIndex(0)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  title="Vista Previa"
                                >
                                  <FiEye size={16} />
                                </button>
                                <button
                                  onClick={exporter.downloadCarousel}
                                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                  title="Descargar"
                                >
                                  <FiDownload size={16} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Canvas Area */}
                            <div className="flex flex-col items-center" ref={editorWrapperRef}>
                              {/* Contextual Action Bar */}
                              {(designer.canvas.selectedExtraId || designer.canvas.selectedImageId) && (() => {
                                // Determine element type and get element data
                                let elementType = null;
                                let elementData = null;
                                
                                if (designer.canvas.selectedExtraId) {
                                  const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                  elementData = designer.canvas.extraElements[slideIdx]?.find(e => e.id === elId);
                                  elementType = elementData?.type || 'unknown';
                                } else if (designer.canvas.selectedImageId) {
                                  elementType = 'image';
                                }

                                if (!elementType) return null;

                                return (
                                  <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900 animate-slideDown z-50 mb-4">
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mr-2">
                                      Control {elementType === 'text' ? 'de Texto' : 
                                             elementType === 'image' ? 'de Imagen' : 
                                             elementType === 'shape' || elementType === 'icon' ? 'de Forma' : 
                                             'de Elemento'}
                                    </p>
                                    <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                    
                                    {/* Layer control - common to all elements */}
                                    <button 
                                      onClick={() => {
                                        if (designer.canvas.selectedExtraId) {
                                          const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                          const el = designer.canvas.extraElements[slideIdx].find(e => e.id === elId);
                                          designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { zIndex: el.zIndex === 30 ? 5 : 30 });
                                        } else if (designer.canvas.selectedImageId) {
                                          const [slideIdx, imgIdx] = designer.canvas.selectedImageId.split('-');
                                          const slide = designer.canvas.slides?.[slideIdx];
                                          if (slide && slide.images && slide.images[imgIdx]) {
                                            const img = slide.images[imgIdx];
                                            const newZIndex = img.zIndex === 20 ? 5 : 20;
                                            const updatedImages = [...slide.images];
                                            updatedImages[imgIdx] = { ...img, zIndex: newZIndex };
                                            const updatedSlides = [...designer.canvas.slides];
                                            updatedSlides[slideIdx] = { ...slide, images: updatedImages };
                                            designer.canvas.setSlides(updatedSlides);
                                          }
                                        }
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl hover:bg-amber-100 transition-all font-black text-[10px] uppercase"
                                    >
                                      <FiLayers size={14} /> Capa: {
                                        (designer.canvas.selectedExtraId ? 
                                          designer.canvas.extraElements[designer.canvas.selectedExtraId.split('-')[0]]?.find(e => e.id === designer.canvas.selectedExtraId.split('-')[1])?.zIndex === 5 :
                                          designer.canvas.slides?.[designer.canvas.selectedImageId.split('-')[0]]?.images?.[designer.canvas.selectedImageId.split('-')[1]]?.zIndex === 5
                                        ) ? 'Al Frente' : 'Al Fondo'
                                      }
                                    </button>

                                    {/* Text-specific controls */}
                                    {elementType === 'text' && elementData && (
                                      <>
                                        <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-[9px] font-black uppercase text-gray-400">Tamaño</label>
                                          <input
                                            type="number" min="8" max="72"
                                            value={Math.round(elementData.height * 0.8)}
                                            onChange={(e) => {
                                              const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                              designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { height: Number(e.target.value) / 0.8 });
                                            }}
                                            className="w-14 px-2 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-center outline-none focus:border-indigo-400"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                            designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { 
                                              bold: !elementData.bold 
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${elementData.bold ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                          <FiBold size={12} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                            designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { 
                                              italic: !elementData.italic 
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${elementData.italic ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                          <FiItalic size={12} />
                                        </button>
                                      </>
                                    )}

                                    {/* Shape/Icon-specific controls */}
                                    {(elementType === 'shape' || elementType === 'icon') && elementData && (
                                      <>
                                        <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-[9px] font-black uppercase text-gray-400">W</label>
                                          <input
                                            type="number" min="10" max="410"
                                            value={Math.round(elementData.width)}
                                            onChange={(e) => {
                                              const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                              designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { width: Number(e.target.value), fullWidth: false });
                                            }}
                                            className="w-14 px-2 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-center outline-none focus:border-indigo-400"
                                          />
                                          <label className="text-[9px] font-black uppercase text-gray-400">H</label>
                                          <input
                                            type="number" min="10" max="410"
                                            value={Math.round(elementData.height)}
                                            onChange={(e) => {
                                              const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                              designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { height: Number(e.target.value) });
                                            }}
                                            className="w-14 px-2 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-center outline-none focus:border-indigo-400"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                            designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { 
                                              fullWidth: true, 
                                              x: 50,
                                              width: 410
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all whitespace-nowrap ${elementData.fullWidth ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                          ↔ Ancho Total
                                        </button>
                                      </>
                                    )}

                                    {/* Image-specific controls */}
                                    {elementType === 'image' && (
                                      <>
                                        <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-[9px] font-black uppercase text-gray-400">Borde</label>
                                          <select
                                            onChange={(e) => {
                                              const [slideIdx, imgIdx] = designer.canvas.selectedImageId.split('-');
                                              const slide = designer.canvas.slides?.[slideIdx];
                                              if (slide && slide.images && slide.images[imgIdx]) {
                                                const img = slide.images[imgIdx];
                                                const updatedImages = [...slide.images];
                                                updatedImages[imgIdx] = { ...img, borderRadius: e.target.value };
                                                const updatedSlides = [...designer.canvas.slides];
                                                updatedSlides[slideIdx] = { ...slide, images: updatedImages };
                                                designer.canvas.setSlides(updatedSlides);
                                              }
                                            }}
                                            className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                                          >
                                            <option value="0">Cuadrado</option>
                                            <option value="8">Redondeado</option>
                                            <option value="9999">Círculo</option>
                                          </select>
                                        </div>
                                      </>
                                    )}

                                    {/* Delete button - common to all elements */}
                                    <button 
                                      onClick={() => {
                                        if (designer.canvas.selectedExtraId) {
                                          const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                          designer.canvas.removeExtraElement(parseInt(slideIdx), elId);
                                        } else if (designer.canvas.selectedImageId) {
                                          const [slideIdx, imgIdx] = designer.canvas.selectedImageId.split('-');
                                          handleRemoveImage(parseInt(slideIdx), parseInt(imgIdx));
                                          designer.canvas.setSelectedImageId(null);
                                        }
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 transition-all font-black text-[10px] uppercase"
                                    >
                                      <FiTrash2 size={14} /> Eliminar
                                    </button>

                                    <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900 mx-2"></div>
                                    <button 
                                      onClick={() => {
                                        designer.canvas.setSelectedExtraId(null);
                                        designer.canvas.setSelectedImageId(null);
                                      }}
                                      className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase"
                                    >
                                      Deseleccionar
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Main Canvas */}
                              <div 
                                className="flex items-center justify-center transition-all duration-300 overflow-visible"
                                style={{ 
                                  width: 410 * scale, 
                                  height: 410 * scale,
                                  perspective: '1000px'
                                }}
                              >
                                <div id="main-slide-canvas" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                                  <SlideCanvas 
                                     slide={generatedContent.slides[designer.canvas.currentSlidePage]}
                                     index={designer.canvas.currentSlidePage}
                                     doctor={doctor}
                                     doctorLogo={doctorLogoBase64}
                                     design={designer.design}
                                     canvas={designer.canvas}
                                     transform={transformer.state}
                                     handlers={transformer.handlers}
                                     watermark={watermarkImage}
                                     onEdit={setEditingIndex}
                                     onPreview={setPreviewIndex}
                                     onCopy={(i) => {
                                       const newSlides = [...generatedContent.slides];
                                       newSlides.splice(i + 1, 0, { ...newSlides[i] });
                                       setGeneratedContent({ ...generatedContent, slides: newSlides });
                                       showToast('Diapositiva duplicada', 'success');
                                     }}
                                     onRemove={handleRemoveSlide}
                                     onAddImage={(e) => handleAddImage(designer.canvas.currentSlidePage, e)}
                                     onRemoveImage={(imgIndex) => handleRemoveImage(designer.canvas.currentSlidePage, imgIndex)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Layout */}
                    {isMobile && (
                      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                        {/* Mobile Header */}
                        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-center justify-between">
                            <SlidePaginator current={designer.canvas.currentSlidePage} total={generatedContent.slides.length} onChange={designer.canvas.setCurrentSlidePage} />
                            <button
                              onClick={() => setPreviewIndex(0)}
                              className="p-2 rounded-lg bg-indigo-600 text-white"
                            >
                              <FiEye size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Canvas - Full Screen */}
                        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
                          <div 
                            className="flex items-center justify-center transition-all duration-300"
                            style={{ 
                              width: 410 * scale, 
                              height: 410 * scale,
                              perspective: '1000px'
                            }}
                          >
                            <div id="main-slide-canvas" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                              <SlideCanvas 
                                 slide={generatedContent.slides[designer.canvas.currentSlidePage]}
                                 index={designer.canvas.currentSlidePage}
                                 doctor={doctor}
                                 doctorLogo={doctorLogoBase64}
                                 design={designer.design}
                                 canvas={designer.canvas}
                                 transform={transformer.state}
                                 handlers={transformer.handlers}
                                 watermark={watermarkImage}
                                 onEdit={setEditingIndex}
                                 onPreview={setPreviewIndex}
                                 onCopy={(i) => {
                                   const newSlides = [...generatedContent.slides];
                                   newSlides.splice(i + 1, 0, { ...newSlides[i] });
                                   setGeneratedContent({ ...generatedContent, slides: newSlides });
                                   showToast('Diapositiva duplicada', 'success');
                                 }}
                                 onRemove={handleRemoveSlide}
                                 onAddImage={(e) => handleAddImage(designer.canvas.currentSlidePage, e)}
                                 onRemoveImage={(imgIndex) => handleRemoveImage(designer.canvas.currentSlidePage, imgIndex)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mobile Toolbar */}
                        <MobileToolbar
                          canvas={designer.canvas}
                          transform={transformer}
                          selectedElement={designer.canvas.selectedExtraId || designer.canvas.selectedImageId}
                          onAddElement={(slideIndex, type, content) => {
                            designer.canvas.addExtraElement(slideIndex, type, content);
                            pushToHistory(generatedContent);
                          }}
                          onDeleteElement={() => {
                            if (designer.canvas.selectedExtraId) {
                              const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                              designer.canvas.removeExtraElement(parseInt(slideIdx), elId);
                            } else if (designer.canvas.selectedImageId) {
                              const [slideIdx, imgIdx] = designer.canvas.selectedImageId.split('-');
                              handleRemoveImage(parseInt(slideIdx), parseInt(imgIdx));
                              designer.canvas.setSelectedImageId(null);
                            }
                          }}
                          onDownload={exporter.downloadCarousel}
                          onSave={() => designer.canvas.saveProject(generatedContent)}
                          onPreview={() => setPreviewIndex(0)}
                          currentSlide={designer.canvas.currentSlidePage}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'reel' && (
                   <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-sm border border-gray-100 max-w-4xl mx-auto">
                      <h3 className="text-2xl font-black mb-8 text-center">Guion de Reel Generado</h3>
                      <div className="space-y-8">
                         {generatedContent.hook && (
                           <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100">
                              <p className="text-xs font-black uppercase text-indigo-400 mb-3 tracking-widest">Hook (Gancho)</p>
                              <p className="text-lg font-bold leading-relaxed">{generatedContent.hook}</p>
                           </div>
                         )}
                         <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100">
                            <p className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest">Contenido Principal</p>
                            <p className="whitespace-pre-wrap text-lg leading-relaxed">{generatedContent.content}</p>
                         </div>
                      </div>
                   </div>
                )}
              </div>
            ) : (
              <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border-2 border-dashed border-gray-100 animate-pulse">
                <FiCpu className="w-12 h-12 text-indigo-200 mb-4" />
                <h3 className="font-black text-gray-400 uppercase tracking-tighter">Esperando selección de artículo</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviewModal 
        isOpen={previewIndex !== null} 
        currentIndex={previewIndex} 
        total={generatedContent?.slides?.length || 0} 
        slides={generatedContent?.slides || []}
        onClose={() => setPreviewIndex(null)}
        onNavigate={setPreviewIndex}
        renderSlide={(slide, i, isPrev) => (
          <SlideCanvas 
            slide={slide} index={i} isPreview={isPrev} doctor={doctor} doctorLogo={doctorLogoBase64} 
            design={designer.design} 
            canvas={designer.canvas} 
            transform={transformer.state} watermark={watermarkImage}
            handlers={transformer.handlers}
          />
        )}
      />

      {/* Hidden Export Engine */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
        {generatedContent?.slides?.map((slide, i) => (
          <SlideCanvas 
            key={`export-${i}`} slide={slide} index={i} isExport={true} doctor={doctor} doctorLogo={doctorLogoBase64} 
            design={designer.design} 
            canvas={designer.canvas} 
            transform={transformer.state} watermark={watermarkImage}
            handlers={transformer.handlers}
          />
        ))}
      </div>
      {/* Edit Slide Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Editar Diapositiva {editingIndex + 1}</h3>
              <button onClick={() => setEditingIndex(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 shadow-sm transition-all">
                <FiPlusCircle className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest ml-1">Título de la Diapositiva</label>
                <input 
                  type="text"
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-indigo-500 transition-all font-black uppercase tracking-tight outline-none"
                  value={generatedContent.slides[editingIndex].title}
                  onChange={(e) => {
                    const newSlides = [...generatedContent.slides];
                    newSlides[editingIndex].title = e.target.value;
                    setGeneratedContent({ ...generatedContent, slides: newSlides });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest ml-1">Contenido Principal</label>
                <textarea 
                  className="w-full h-48 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-indigo-500 transition-all font-bold leading-relaxed outline-none"
                  value={generatedContent.slides[editingIndex].content}
                  onChange={(e) => {
                    const newSlides = [...generatedContent.slides];
                    newSlides[editingIndex].content = e.target.value;
                    setGeneratedContent({ ...generatedContent, slides: newSlides });
                  }}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingIndex(null)} className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cerrar</button>
                <button onClick={() => setEditingIndex(null)} className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Listo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
