
import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiInstagram, FiImage, FiLoader, FiUpload } from 'react-icons/fi';
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
import { DesignSidebar } from './components/DesignSidebar';
import { TopToolbar } from './components/TopToolbar';
import { SlidePaginator } from './components/SlidePaginator';
import { PreviewModal } from './components/PreviewModal';

export default function SocialGenerator() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeTab, setActiveTab] = useState('reel');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [doctorLogoBase64, setDoctorLogoBase64] = useState(null);
  
  const slideRefs = useRef({});
  const { showToast } = useToastStore();
  const { user: doctor } = useAuthStore();

  const designer = useSlideDesigner();
  const transformer = useDragTransform(designer.canvas.updateExtraElement);
  const exporter = useExport(selectedPost, designer.design.bgColor);

  useEffect(() => {
    loadPosts();
    if (doctor?.logo_url) {
      setDoctorLogoBase64(getImageUrl(doctor.logo_url));
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
        const newSlides = [...generatedContent.slides];
        if (!newSlides[index].customImages) newSlides[index].customImages = [];
        newSlides[index].customImages.push(reader.result);
        setGeneratedContent({ ...generatedContent, slides: newSlides });
      };
      reader.readAsDataURL(file);
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

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-[1480px] mx-auto px-4 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" /> Editor GynSys
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">1. Artículo Base</h2>
              <select
                value={selectedPost?.id || ''}
                onChange={(e) => {
                  setSelectedPost(posts.find(p => p.id === parseInt(e.target.value)));
                  setGeneratedContent(null);
                }}
                className="block w-full rounded-xl border-gray-200 dark:bg-gray-900 dark:text-white p-3 border font-manrope"
              >
                <option value="" disabled>Elegir artículo...</option>
                {posts.map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
              </select>
            </div>
            
            {selectedPost && (
              <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl animate-fadeIn">
                <h3 className="text-xl font-black mb-1">IA Creator</h3>
                <div className="grid grid-cols-1 gap-4 mt-6">
                  <button onClick={() => handleGenerate('reel')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl font-black transition-all border border-white/10"><FiInstagram /> Reel Script</button>
                  <button onClick={() => handleGenerate('carousel')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-2xl font-black transition-all border border-white/10"><FiImage /> Carousel</button>
                  <button onClick={handleTestDesign} className="flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 p-4 rounded-2xl font-black transition-all text-white">🧪 Draft Mode</button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {generating ? (
              <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100"><FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-bold">IA procesando...</p></div>
            ) : generatedContent ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button onClick={() => setActiveTab('reel')} className={`px-6 py-2 rounded-lg text-xs font-bold ${activeTab === 'reel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Guion</button>
                  <button onClick={() => setActiveTab('carousel')} className={`px-6 py-2 rounded-lg text-xs font-bold ${activeTab === 'carousel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Carrusel</button>
                </div>

                {activeTab === 'carousel' && (
                  <div className="space-y-6">
                    <TopToolbar 
                      design={designer.design} 
                      canvas={designer.canvas} 
                      onDownload={exporter.downloadCarousel}
                      onWatermark={handleWatermark}
                      watermark={watermarkImage}
                    />
                    
                    <div className="flex gap-8 items-start">
                      <DesignSidebar currentSlide={designer.canvas.currentSlidePage} onAddElement={designer.canvas.addExtraElement} />
                      
                      <div className="flex-1 flex flex-col items-center gap-8">
                        <SlidePaginator current={designer.canvas.currentSlidePage} total={generatedContent.slides.length} onChange={designer.canvas.setCurrentSlidePage} />
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
                          slideRef={el => slideRefs.current[designer.canvas.currentSlidePage] = el}
                          onEdit={setEditingIndex}
                          onPreview={setPreviewIndex}
                          onCopy={copyToClipboard}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'reel' && (
                   <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black mb-6">Guion de Reel</h3>
                      <div className="space-y-6">
                         {generatedContent.hook && (
                           <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100">
                              <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Hook (Gancho)</p>
                              <p className="font-bold">{generatedContent.hook}</p>
                           </div>
                         )}
                         <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Contenido Principal</p>
                            <p className="whitespace-pre-wrap">{generatedContent.content}</p>
                         </div>
                      </div>
                   </div>
                )}
              </div>
            ) : (
              <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border-2 border-dashed border-gray-100"><FiCpu className="w-10 h-10 text-indigo-200 mb-4" /><h3 className="font-bold text-gray-400">Editor GynSys</h3></div>
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
            design={designer.design} canvas={designer.canvas} transform={transformer.state} watermark={watermarkImage}
          />
        )}
      />

      {/* Hidden Export Engine */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
        {generatedContent?.slides?.map((slide, i) => (
          <SlideCanvas 
            key={`export-${i}`} slide={slide} index={i} isExport={true} doctor={doctor} doctorLogo={doctorLogoBase64} 
            design={designer.design} canvas={designer.canvas} transform={transformer.state} watermark={watermarkImage}
          />
        ))}
      </div>
    </div>
  );
}
