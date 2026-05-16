
import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiInstagram, FiLoader, FiFolder, FiZap, FiVideo, FiImage, FiSave, FiX, FiPlay, FiPause } from 'react-icons/fi';

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
  const [activeTab, setActiveTab] = useState('video');
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
  const [transitionType, setTransitionType] = useState('fade');
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [savingType, setSavingType] = useState(null); // 'save' | 'saveAs' | null
  const [saveProgress, setSaveProgress] = useState(0);
  const saveProgressRef = useRef(null);

  // --- Refs ---
  const editorWrapperRef = useRef(null);
  const mobileEditorWrapperRef = useRef(null);

  // --- External Stores ---
  const { showToast } = useToastStore();
  const { user: doctor } = useAuthStore();

  // --- Custom Hooks ---
  const designer = useSlideDesigner();
  
  const { isPlaying, setIsPlaying, currentVideoSlide, setCurrentVideoSlide } = useVideoPlayback(
    activeTab, generatedContent, false, slideDuration
  );

  // Sync video playback slide with canvas
  useEffect(() => {
    if (activeTab === 'video') {
      designer.canvas.setCurrentSlidePage(currentVideoSlide);
    }
  }, [currentVideoSlide, activeTab]);

  const { 
    audioRef, previewAudioRef, selectedAudio, setSelectedAudio, 
    customAudioUrl, setCustomAudioUrl, prelisteningTrack, setPrelisteningTrack, 
    getActiveAudioSrc, userAudios, loadingAudios, handleUploadAudio, handleDeleteAudio
  } = useAudioPlayback(activeTab, isPlaying, setIsPlaying, showToast);

  const { isExporting, exportProgress, handleExportVideo, exportStatus } = useVideoExport(
    generatedContent, videoStyles, slideDuration, transitionType, transitionDuration, selectedPost, audioRef, getActiveAudioSrc, showToast
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
      console.log(`[GynSys] AI Result (${genType}):`, result);
      
      setGeneratedContent(result);
      setCurrentVideoSlide(0);
      // REPARACIÓN: Soporte robusto para 'reel', 'video' o 'carousel'
      if (genType === 'carousel') {
        setActiveTab('carousel');
      } else {
        setActiveTab('video');
      }
      showToast(`${genType === 'carousel' ? 'Carrusel' : 'Video'} generado con éxito`, 'success');
    } catch (error) {
      console.error('Error generating content:', error);
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
        setActiveTab(content.type === 'video' || content.video_slides ? 'video' : 'carousel');
      } else {
        setActiveTab('carousel');
      }
      setActiveProjectName(project.name || null);
      setActiveProjectId(project.id || null);
      showToast(`Proyecto "${project.name}" cargado`, 'success');
    }
  };

  const startSaveProgress = () => {
    setSaveProgress(0);
    let current = 0;
    saveProgressRef.current = setInterval(() => {
      current += Math.random() * 15 + 5; // avance aleatorio entre 5-20%
      if (current >= 90) { current = 90; clearInterval(saveProgressRef.current); }
      setSaveProgress(Math.round(current));
    }, 200);
  };

  const stopSaveProgress = (success = true) => {
    clearInterval(saveProgressRef.current);
    setSaveProgress(success ? 100 : 0);
    setTimeout(() => { setSavingType(null); setSaveProgress(0); }, 600);
  };

  const handleSaveProject = async () => {
    if (!activeProjectId || !activeProjectName) {
      return handleSaveProjectAs();
    }

    setSavingType('save');
    startSaveProgress();
    try {
      const videoSettings = { videoStyles, selectedAudio, slideDuration, customAudioUrl };
      const contentToSave = { ...generatedContent, videoSettings };
      const ok = await designer.canvas.saveProject(activeProjectName, contentToSave, activeProjectId);
      
      if (ok) {
        stopSaveProgress(true);
        showToast(`"${activeProjectName}" actualizado con éxito`, 'success');
      } else {
        stopSaveProgress(false);
        showToast('No se pudo actualizar el proyecto', 'error');
      }
    } catch (error) {
      console.error('[GynSys] Error updating project:', error);
      stopSaveProgress(false);
      showToast('Error crítico al actualizar el proyecto', 'error');
    }
  };

  const handleSaveProjectAs = async () => {
    const name = prompt('Nombre del nuevo proyecto:', activeProjectName || selectedPost?.title || 'Mi Carrusel');
    if (!name) return;

    setSavingType('saveAs');
    startSaveProgress();
    try {
      const videoSettings = { videoStyles, selectedAudio, slideDuration, customAudioUrl };
      const contentToSave = { ...generatedContent, videoSettings };
      const ok = await designer.canvas.saveProject(name, contentToSave, null);
      
      if (ok) {
        setActiveProjectName(name);
        stopSaveProgress(true);
        showToast(`Nuevo proyecto "${name}" creado con éxito`, 'success');
      } else {
        stopSaveProgress(false);
        showToast('No se pudo crear el nuevo proyecto', 'error');
      }
    } catch (error) {
      console.error('[GynSys] Error saving new project:', error);
      stopSaveProgress(false);
      showToast('Error crítico al crear el proyecto', 'error');
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
      reader.onloadend = () => {
        const newSlides = [...generatedContent.video_slides];
        if (!newSlides[index].customImages) newSlides[index].customImages = [];
        newSlides[index].customImages.push(reader.result);
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
        loadingProjects={designer.canvas.loadingProjects}
        exitMobileFullscreen={exitMobileFullscreen} scale={scale} doctor={doctor}
        doctorLogoBase64={doctorLogoBase64} transformer={transformer} watermarkImage={watermarkImage}
        handleRemoveSlide={handleRemoveSlide} handleAddImage={handleAddImage}
        handleRemoveImage={handleRemoveImage} setEditingIndex={setEditingIndex}
        setPreviewIndex={setPreviewIndex} showToast={showToast}
        handleConvertToVideo={handleConvertToVideo} handleSaveProject={handleSaveProject}
        handleSaveProjectAs={handleSaveProjectAs} handleSaveTemplate={() => {}}
        activeProjectId={activeProjectId} exporter={exporter}
        activeTab={activeTab} setActiveTab={setActiveTab}
        videoStyles={videoStyles} setVideoStyles={setVideoStyles}
        slideDuration={slideDuration} setSlideDuration={setSlideDuration}
        isPlaying={isPlaying} setIsPlaying={setIsPlaying}
        currentVideoSlide={currentVideoSlide} setCurrentVideoSlide={setCurrentVideoSlide}
        selectedAudio={selectedAudio} setSelectedAudio={setSelectedAudio}
        userAudios={userAudios} loadingAudios={loadingAudios}
        handleUploadAudio={handleUploadAudio} handleDeleteAudio={handleDeleteAudio}
        prelisteningTrack={prelisteningTrack} setPrelisteningTrack={setPrelisteningTrack}
        customAudioUrl={customAudioUrl} setCustomAudioUrl={setCustomAudioUrl}
        audioRef={audioRef} previewAudioRef={previewAudioRef}
        isExporting={isExporting} exportProgress={exportProgress}
        handleExportVideo={handleExportVideo} handleAddImageToVideoSlide={handleAddImageToVideoSlide}
        enterMobileFullscreen={enterMobileFullscreen}
        exportStatus={exportStatus}
        userAudios={userAudios} loadingAudios={loadingAudios}
        handleUploadAudio={handleUploadAudio} handleDeleteAudio={handleDeleteAudio}
        savingType={savingType} saveProgress={saveProgress}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 font-manrope">
      <div className="max-w-[1480px] mx-auto px-4 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FiCpu className="text-indigo-600" /> Editor GynSys
          </h1>
        </header>

        <div className="space-y-8">
          <ArticleSelector 
            posts={posts} selectedPost={selectedPost} setSelectedPost={setSelectedPost}
            setGeneratedContent={setGeneratedContent} showProjects={showProjects}
            setShowProjects={setShowProjects} handleGenerate={handleGenerate}
            handleTestDesign={() => { setActiveTab('carousel'); setGeneratedContent({ type: 'carousel', slides: [{ title: 'Prueba', content: 'Contenido' }] }); }}
            generating={generating}
            projects={designer.canvas.projects}
            loadingProjects={designer.canvas.loadingProjects}
            onLoadProject={(p) => { handleLoadProject(p); setShowProjects(false); }}
            onDeleteProject={designer.canvas.deleteProject}
            activeProjectId={activeProjectId}
          />

          {/* RESTAURACIÓN DEL LAYOUT ORIGINAL DE TABS */}
          {generatedContent && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 animate-fadeIn">
              {/* Left: Tab switcher */}
              <div className="flex bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => setActiveTab('video')} 
                  className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'video' || activeTab === 'reel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Editor de Video
                </button>
                <button 
                  onClick={() => setActiveTab('carousel')} 
                  className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'carousel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Editor de Carrusel
                </button>
              </div>

              {/* Center: Active project name */}
              {activeProjectName && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 max-w-xs">
                  <FiFolder className="text-indigo-500 flex-shrink-0" size={14} />
                  <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-tight truncate">{activeProjectName}</span>
                </div>
              )}

              {/* Right: Save buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handleSaveProject} 
                  disabled={savingType !== null}
                  style={{ backgroundColor: 'rgb(205, 8, 87)' }}
                  className="relative px-8 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-200 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-80 overflow-hidden"
                >
                  {/* Animated progress bar underlay */}
                  {savingType === 'save' && (
                    <span 
                      className="absolute inset-0 bg-white/20 transition-all duration-300 origin-left"
                      style={{ transform: `scaleX(${saveProgress / 100})` }}
                    />
                  )}
                  {/* Circular spinner */}
                  {savingType === 'save' ? (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.8" />
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none" stroke="white" strokeWidth="3.8"
                          strokeDasharray={`${saveProgress} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        />
                      </svg>
                      <span className="relative">{saveProgress}%</span>
                    </>
                  ) : (
                    <><FiSave /> Guardar</>
                  )}
                </button>
                <button 
                  onClick={handleSaveProjectAs} 
                  disabled={savingType !== null}
                  className="relative px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-80 overflow-hidden"
                >
                  {/* Animated progress bar underlay */}
                  {savingType === 'saveAs' && (
                    <span 
                      className="absolute inset-0 bg-gray-200 dark:bg-gray-600 transition-all duration-300 origin-left"
                      style={{ transform: `scaleX(${saveProgress / 100})` }}
                    />
                  )}
                  {/* Circular spinner */}
                  {savingType === 'saveAs' ? (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-400" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3.8" />
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none" stroke="currentColor" strokeWidth="3.8"
                          strokeDasharray={`${saveProgress} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        />
                      </svg>
                      <span className="relative z-10">{saveProgress}%</span>
                    </>
                  ) : (
                    <><FiSave className="relative z-10" /> <span className="relative z-10">Guardar como...</span></>
                  )}
                </button>
              </div>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mb-6">
                <FiCpu className="text-indigo-600 animate-spin" size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Generando con IA</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Analizando artículo y creando escenas...</p>
            </div>
          )}

          {generatedContent && !generating && (
            <div className="animate-fadeIn">

                <div className="flex gap-6">
                  <EnhancedSidebar 
                    design={designer.design} canvas={designer.canvas} 
                    transform={transformer.state} currentSlide={designer.canvas.currentSlidePage}
                    onAddElement={designer.canvas.addExtraElement} 
                    onDownload={activeTab === 'video' ? handleExportVideo : exporter.downloadCarousel}
                    onSave={handleSaveProject} onConvertToVideo={handleConvertToVideo}
                    isVideoMode={activeTab === 'video'}
                    selectedAudio={selectedAudio} setSelectedAudio={setSelectedAudio}
                    slideDuration={slideDuration} setSlideDuration={setSlideDuration}
                  />
                  <div className="flex-1 space-y-6 flex flex-col items-center justify-start pt-10">
                    <div ref={editorWrapperRef} className={`bg-white dark:bg-gray-800 rounded-[40px] ${activeTab === 'video' ? 'p-4 w-[320px] h-[570px] overflow-visible' : 'p-12 max-w-full min-h-[600px] w-full overflow-hidden'} shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center relative`}>
                      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                        <SlideCanvas 
                          slide={activeTab === 'video' ? generatedContent.video_slides?.[designer.canvas.currentSlidePage] : generatedContent.slides?.[designer.canvas.currentSlidePage]}
                          index={designer.canvas.currentSlidePage}
                          doctor={doctor} doctorLogo={doctorLogoBase64}
                          design={designer.design} canvas={designer.canvas}
                          transform={transformer.state} handlers={transformer.handlers}
                          watermark={watermarkImage} onEdit={setEditingIndex}
                          onPreview={setPreviewIndex} onRemove={handleRemoveSlide}
                          onAddImage={(e) => activeTab === 'video' ? handleAddImageToVideoSlide(designer.canvas.currentSlidePage, e) : handleAddImage(designer.canvas.currentSlidePage, e)}
                          isVideoMode={activeTab === 'video'}
                        />
                      </div>
                      {/* Pagination and Play Controls (Positioned absolutely below the canvas) */}
                      <div className="absolute top-[100%] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 mt-4">
                        <SlidePaginator 
                          current={designer.canvas.currentSlidePage}
                          total={activeTab === 'video' ? (generatedContent.video_slides?.length || 0) : (generatedContent.slides?.length || 0)}
                          onChange={designer.canvas.setCurrentSlidePage}
                        />
                        {activeTab === 'video' && (
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`p-4 rounded-full transition-all ${isPlaying ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'} shadow-xl transform hover:scale-105`}
                            title={isPlaying ? "Pausar" : "Reproducir"}
                          >
                            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      <ContextualBar 
        selectedId={designer.canvas.selectedExtraId}
        canvas={designer.canvas}
        updateElement={designer.canvas.updateExtraElement}
        removeElement={designer.canvas.removeExtraElement}
        deselectElement={designer.canvas.selectElement}
      />

      {/* Edit Content Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Editar Diapositiva {editingIndex + 1}</h3>
              <button onClick={() => setEditingIndex(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <FiX size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Título</label>
                <input 
                  type="text"
                  value={generatedContent.slides[editingIndex].title}
                  onChange={(e) => {
                    const newSlides = [...generatedContent.slides];
                    newSlides[editingIndex].title = e.target.value;
                    setGeneratedContent({ ...generatedContent, slides: newSlides });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenido</label>
                <textarea 
                  rows={5}
                  value={generatedContent.slides[editingIndex].content}
                  onChange={(e) => {
                    const newSlides = [...generatedContent.slides];
                    newSlides[editingIndex].content = e.target.value;
                    setGeneratedContent({ ...generatedContent, slides: newSlides });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm leading-relaxed"
                />
              </div>
              <button 
                onClick={() => setEditingIndex(null)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <PreviewModal 
        isOpen={previewIndex !== null} currentIndex={previewIndex}
        total={generatedContent?.slides?.length || 0} slides={generatedContent?.slides || []}
        onClose={() => setPreviewIndex(null)} onNavigate={setPreviewIndex}
        renderSlide={(slide, i, isPrev) => (
          <SlideCanvas slide={slide} index={i} isPreview={isPrev} doctor={doctor} doctorLogo={doctorLogoBase64} design={designer.design} canvas={designer.canvas} transform={transformer.state} watermark={watermarkImage} handlers={transformer.handlers} />
        )}
      />

      {/* Hidden audio elements for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      <audio ref={previewAudioRef} style={{ display: 'none' }} />
    </div>
  );
}
