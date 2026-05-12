
import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiInstagram, FiLoader, FiFolder, FiZap, FiVideo, FiImage } from 'react-icons/fi';

// Config & Services
import { blogService } from '../../services/blogService';
import Spinner from '../../../../components/common/Spinner';
import { useToastStore } from '../../../../store/toastStore';
import { getImageUrl } from '../../../../lib/imageUtils';
import { useAuthStore } from '../../../../store/authStore';
import { AUDIO_TRACKS, DEFAULT_VIDEO_STYLES } from './constants';

// Hooks
import { useSlideDesigner } from './hooks/useSlideDesigner';
import { useDragTransform } from './hooks/useDragTransform';
import { useExport } from './hooks/useExport';
import { useVideoExport } from './hooks/useVideoExport';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useVideoPlayback } from './hooks/useVideoPlayback';
import { useMobileFullscreen } from './hooks/useMobileFullscreen';

// Components
import { SlideCanvas } from './components/SlideCanvas';
import { SlidePaginator } from './components/SlidePaginator';
import { PreviewModal } from './components/PreviewModal';
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { VideoEditor } from './components/VideoEditor';
import { MobileLayout } from './components/MobileLayout';
import { ArticleSelector } from './components/ArticleSelector';
import { ProjectGrid } from './components/ProjectGrid';
import { ContextualBar } from './components/ContextualBar';

export default function SocialGenerator() {
  // --- States ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeTab, setActiveTab] = useState('reel');
  const [activeProjectName, setActiveProjectName] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [doctorLogoBase64, setDoctorLogoBase64] = useState(null);
  const [history, setHistory] = useState([]);
  const [scale, setScale] = useState(1);
  const [videoStyles, setVideoStyles] = useState(DEFAULT_VIDEO_STYLES);
  const [slideDuration, setSlideDuration] = useState(3);

  // --- Refs ---
  const editorWrapperRef = useRef(null);
  const mobileEditorWrapperRef = useRef(null);

  // --- External Stores ---
  const { showToast } = useToastStore();
  const { user: doctor } = useAuthStore();

  // --- Custom Hooks ---
  const designer = useSlideDesigner();
  
  const { 
    audioRef, previewAudioRef, selectedAudio, setSelectedAudio, 
    customAudioUrl, setCustomAudioUrl, prelisteningTrack, setPrelisteningTrack, 
    getActiveAudioSrc 
  } = useAudioPlayback(activeTab, true, (v) => {}, showToast); // We'll manage isPlaying in videoPlayback

  const { isPlaying, setIsPlaying, currentVideoSlide, setCurrentVideoSlide } = useVideoPlayback(
    activeTab, generatedContent, false, slideDuration
  );

  const { isExporting, exportProgress, handleExportVideo } = useVideoExport(
    generatedContent, videoStyles, slideDuration, selectedPost, audioRef, getActiveAudioSrc, showToast
  );

  const { isMobileFullscreen, enterMobileFullscreen, exitMobileFullscreen } = useMobileFullscreen(
    isMobile, generatedContent
  );

  const transformer = useDragTransform(designer.canvas.updateExtraElement, scale, {
    setLogoPos: designer.design.setLogoPos,
    setDoctorNamePos: designer.design.setDoctorNamePos,
    setDividerPos: designer.design.setDividerPos
  });

  const exporter = useExport(selectedPost, designer, generatedContent);

  // --- Initial Data Load ---
  useEffect(() => {
    loadPosts();
    if (doctor?.logo_url) {
      fetchLogoAsBase64();
    }
  }, [doctor]);

  // --- Responsive Logic ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handleResize = (width) => {
      const s = Math.min(1, (width - 50) / 410);
      setScale(Math.max(0.4, s));
    };

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) handleResize(entry.contentRect.width);
    });

    if (editorWrapperRef.current) ro.observe(editorWrapperRef.current);
    if (mobileEditorWrapperRef.current) ro.observe(mobileEditorWrapperRef.current);

    return () => {
      window.removeEventListener('resize', checkMobile);
      ro.disconnect();
    };
  }, []);

  // --- Handlers ---
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

  const fetchLogoAsBase64 = async () => {
    try {
      const url = getImageUrl(doctor.logo_url);
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setDoctorLogoBase64(reader.result);
      reader.readAsDataURL(blob);
    } catch (e) {
      setDoctorLogoBase64(getImageUrl(doctor.logo_url));
    }
  };

  const pushToHistory = (content) => {
    setHistory(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(content))]);
  };

  const handleGenerate = async (genType) => {
    if (!selectedPost) {
      showToast('Selecciona un artículo primero', 'error');
      return;
    }
    setGenerating(true);
    try {
      const result = await blogService.generateSocialContent(selectedPost.id, genType);
      setGeneratedContent(result);
      setCurrentVideoSlide(0);
      setActiveTab(genType === 'video' ? 'video' : 'carousel');
      showToast(`${genType === 'video' ? 'Video' : 'Carrusel'} generado con éxito`, 'success');
    } catch (error) {
      showToast('Error al generar contenido con IA', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleConvertToVideo = async () => {
    if (!generatedContent?.slides) return;
    setGenerating(true);
    try {
      const carouselText = generatedContent.slides.map(s => `${s.title}\n${s.content}`).join('\n\n');
      const title = activeProjectName || selectedPost?.title || 'Mi Video';
      const result = await blogService.generateSocialFromContent(title, carouselText, 'video');
      setGeneratedContent(prev => ({ ...prev, video_slides: result.video_slides, music_suggestion: result.music_suggestion, type: 'video' }));
      setActiveTab('video');
      setCurrentVideoSlide(0);
      showToast('¡Carrusel convertido a video!', 'success');
    } catch (error) {
      showToast('Error al convertir a video', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadProject = (project) => {
    const content = designer.canvas.loadProject(project);
    if (content) {
      setGeneratedContent(content);
      if (content.videoSettings) {
        if (content.videoSettings.videoStyles) setVideoStyles(content.videoSettings.videoStyles);
        if (content.videoSettings.selectedAudio) setSelectedAudio(content.videoSettings.selectedAudio);
        if (content.videoSettings.slideDuration) setSlideDuration(content.videoSettings.slideDuration);
        if (content.videoSettings.customAudioUrl) setCustomAudioUrl(content.videoSettings.customAudioUrl);
        setActiveTab(content.type === 'video' ? 'video' : 'carousel');
      } else {
        setActiveTab('carousel');
      }
      setActiveProjectName(project.name || null);
      setActiveProjectId(project.id || null);
      showToast(`Proyecto "${project.name}" cargado`, 'success');
    }
  };

  const handleSaveProject = async () => {
    if (activeProjectId && activeProjectName) {
      const videoSettings = { videoStyles, selectedAudio, slideDuration, customAudioUrl };
      const contentToSave = { ...generatedContent, videoSettings };
      const ok = await designer.canvas.saveProject(activeProjectName, contentToSave, activeProjectId);
      if (ok) showToast(`"${activeProjectName}" guardado`, 'success');
    } else {
      handleSaveProjectAs();
    }
  };

  const handleSaveProjectAs = async () => {
    const name = prompt('Nombre del proyecto:', activeProjectName || selectedPost?.title || 'Mi Carrusel');
    if (name) {
      const videoSettings = { videoStyles, selectedAudio, slideDuration, customAudioUrl };
      const contentToSave = { ...generatedContent, videoSettings };
      const ok = await designer.canvas.saveProject(name, contentToSave);
      if (ok) {
        setActiveProjectName(name);
        showToast(`"${name}" guardado`, 'success');
      }
    }
  };

  const handleRemoveSlide = (index) => {
    if (generatedContent.slides.length <= 1) return;
    const newSlides = generatedContent.slides.filter((_, i) => i !== index);
    setGeneratedContent({ ...generatedContent, slides: newSlides });
    designer.canvas.setCurrentSlidePage(Math.max(0, designer.canvas.currentSlidePage - 1));
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
    const newSlides = [...generatedContent.slides];
    if (newSlides[slideIndex]?.customImages) {
      newSlides[slideIndex].customImages = newSlides[slideIndex].customImages.filter((_, i) => i !== imgIndex);
      setGeneratedContent({ ...generatedContent, slides: newSlides });
    }
  };

  const handleAddImageToVideoSlide = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSlides = [...generatedContent.video_slides];
        newSlides[index].image = event.target.result;
        setGeneratedContent({ ...generatedContent, video_slides: newSlides });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <Spinner />;

  if (isMobile) {
    return (
      <MobileLayout 
        posts={posts} selectedPost={selectedPost} setSelectedPost={setSelectedPost}
        generating={generating} generatedContent={generatedContent} setGeneratedContent={setGeneratedContent}
        handleGenerate={handleGenerate} handleTestDesign={() => { setActiveTab('carousel'); setGeneratedContent({ type: 'carousel', slides: [{ title: 'Prueba', content: 'Contenido' }] }); }}
        showProjects={showProjects} setShowProjects={setShowProjects}
        designer={designer} handleLoadProject={handleLoadProject}
        activeProjectName={activeProjectName} isMobileFullscreen={isMobileFullscreen}
        exitMobileFullscreen={exitMobileFullscreen} scale={scale} doctor={doctor}
        doctorLogoBase64={doctorLogoBase64} transformer={transformer} watermarkImage={watermarkImage}
        handleRemoveSlide={handleRemoveSlide} handleAddImage={handleAddImage}
        handleRemoveImage={handleRemoveImage} setEditingIndex={setEditingIndex}
        setPreviewIndex={setPreviewIndex} showToast={showToast}
        handleConvertToVideo={handleConvertToVideo} handleSaveProject={handleSaveProject}
        handleSaveProjectAs={handleSaveProjectAs} handleSaveTemplate={() => {}}
        activeProjectId={activeProjectId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-[1480px] mx-auto px-4 pt-6">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" /> Editor GynSys
          </h1>
          {generatedContent && (
             <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button onClick={() => setActiveTab('reel')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'reel' || activeTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Video Reel</button>
                <button onClick={() => setActiveTab('carousel')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'carousel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Carrusel</button>
             </div>
          )}
        </header>

        <ArticleSelector 
          posts={posts} selectedPost={selectedPost} setSelectedPost={setSelectedPost}
          setGeneratedContent={setGeneratedContent} showProjects={showProjects}
          setShowProjects={setShowProjects} handleGenerate={handleGenerate}
          handleTestDesign={() => { setActiveTab('carousel'); setGeneratedContent({ type: 'carousel', slides: [{ title: 'Prueba', content: 'Contenido' }] }); }}
          generating={generating}
        />

        {showProjects && (
           <div className="mt-8">
              <ProjectGrid 
                projects={designer.canvas.projects} 
                onLoad={(p) => { handleLoadProject(p); setShowProjects(false); }}
                onDelete={designer.canvas.deleteProject}
                activeProjectId={activeProjectId}
              />
           </div>
        )}

        {generating && (
           <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl mt-8">
              <FiLoader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="font-black text-gray-400 uppercase tracking-widest">GynSys IA creando contenido...</p>
           </div>
        )}

        {generatedContent && !generating && (
           <div className="mt-8">
              {activeTab === 'video' || activeTab === 'reel' ? (
                 <VideoEditor 
                    generatedContent={generatedContent} setGeneratedContent={setGeneratedContent}
                    videoStyles={videoStyles} setVideoStyles={setVideoStyles}
                    slideDuration={slideDuration} setSlideDuration={setSlideDuration}
                    isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                    currentVideoSlide={currentVideoSlide} setCurrentVideoSlide={setCurrentVideoSlide}
                    selectedAudio={selectedAudio} setSelectedAudio={setSelectedAudio}
                    prelisteningTrack={prelisteningTrack} setPrelisteningTrack={setPrelisteningTrack}
                    customAudioUrl={customAudioUrl} setCustomAudioUrl={setCustomAudioUrl}
                    audioRef={audioRef} previewAudioRef={previewAudioRef}
                    isExporting={isExporting} exportProgress={exportProgress}
                    handleExportVideo={handleExportVideo} doctor={doctor}
                    showToast={showToast} handleAddImageToVideoSlide={handleAddImageToVideoSlide}
                 />
              ) : (
                 <div className="flex gap-6 animate-fadeIn">
                    <EnhancedSidebar 
                      design={designer.design} canvas={designer.canvas} 
                      transform={transformer.state} currentSlide={designer.canvas.currentSlidePage}
                      onAddElement={designer.canvas.addExtraElement} onDownload={exporter.downloadCarousel}
                      onSave={handleSaveProject} onConvertToVideo={handleConvertToVideo}
                    />
                    <div className="flex-1 space-y-6">
                       <div ref={editorWrapperRef} className="bg-white dark:bg-gray-800 rounded-[40px] p-12 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center min-h-[600px] overflow-hidden relative">
                          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                            <SlideCanvas 
                              slide={generatedContent.slides[designer.canvas.currentSlidePage]}
                              index={designer.canvas.currentSlidePage}
                              doctor={doctor} doctorLogo={doctorLogoBase64}
                              design={designer.design} canvas={designer.canvas}
                              transform={transformer.state} handlers={transformer.handlers}
                              watermark={watermarkImage} onEdit={setEditingIndex}
                              onPreview={setPreviewIndex} onRemove={handleRemoveSlide}
                              onAddImage={(e) => handleAddImage(designer.canvas.currentSlidePage, e)}
                            />
                          </div>
                       </div>
                       <SlidePaginator 
                        current={designer.canvas.currentSlidePage}
                        total={generatedContent.slides.length}
                        onChange={designer.canvas.setCurrentSlidePage}
                       />
                    </div>
                 </div>
              )}
           </div>
        )}
      </div>

      <ContextualBar 
        selectedId={designer.canvas.selectedExtraId}
        canvas={designer.canvas}
        updateElement={designer.canvas.updateExtraElement}
        removeElement={designer.canvas.removeExtraElement}
        deselectElement={designer.canvas.selectElement}
      />

      <PreviewModal 
        isOpen={previewIndex !== null} currentIndex={previewIndex}
        total={generatedContent?.slides?.length || 0} slides={generatedContent?.slides || []}
        onClose={() => setPreviewIndex(null)} onNavigate={setPreviewIndex}
        renderSlide={(slide, i, isPrev) => (
          <SlideCanvas slide={slide} index={i} isPreview={isPrev} doctor={doctor} doctorLogo={doctorLogoBase64} design={designer.design} canvas={designer.canvas} transform={transformer.state} watermark={watermarkImage} handlers={transformer.handlers} />
        )}
      />
    </div>
  );
}
