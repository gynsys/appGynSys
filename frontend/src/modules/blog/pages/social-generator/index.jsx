import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiInstagram, FiImage, FiLoader, FiUpload, FiPlusCircle, FiChevronDown, FiChevronLeft, FiChevronRight, FiTrash2, FiFolder, FiSave, FiLayers, FiEye, FiDownload, FiBold, FiItalic, FiType, FiMaximize2, FiX, FiDroplet, FiZap, FiVideo, FiMessageCircle, FiCopy, FiActivity, FiPlay, FiClock, FiVolume2, FiVolumeX, FiPause } from 'react-icons/fi';
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
  const mobileEditorWrapperRef = React.useRef(null);
  const [activeTab, setActiveTab] = useState('reel');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [doctorLogoBase64, setDoctorLogoBase64] = useState(null);
  const [showProjects, setShowProjects] = useState(false);
  const [history, setHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [mobileActionPerformed, setMobileActionPerformed] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-enter full-screen mode on mobile when carousel content exists
  useEffect(() => {
    if (isMobile && generatedContent && generatedContent.slides && generatedContent.slides.length > 0) {
      enterMobileFullscreen();
    }
  }, [isMobile, generatedContent]);

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
    const handleResize = (width) => {
      // Reduced margin to 50px
      const s = Math.min(1, (width - 50) / 410);
      setScale(Math.max(0.4, s)); // Min scale 0.4 for very small screens
    };

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        handleResize(entry.contentRect.width);
      }
    });

    if (editorWrapperRef.current) ro.observe(editorWrapperRef.current);
    if (mobileEditorWrapperRef.current) ro.observe(mobileEditorWrapperRef.current);

    // Initial calculation for mobile if window is available
    if (typeof window !== 'undefined') {
      handleResize(window.innerWidth);
    }

    return () => ro.disconnect();
  }, [isMobileFullscreen]);

  const designer = useSlideDesigner();

  // Mobile full-screen mode handlers
  const enterMobileFullscreen = () => {
    setIsMobileFullscreen(true);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  };

  const exitMobileFullscreen = () => {
    setIsMobileFullscreen(false);
    // Restore body scroll
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
  };

  // Prevent touch events that could cause scrolling/swiping in full-screen mode
  useEffect(() => {
    if (isMobileFullscreen) {
      const preventTouchMove = (e) => {
        // Allow touch on all canvas elements and interactive elements
        if (e.target.closest('button, input, textarea, [role="button"], .slide-canvas, #main-slide-canvas, .absolute, .z-10, .z-20, .z-30, .z-40, .z-50, .pointer-events-auto, [data-element], [data-slide-element], [data-contextual-bar]')) {
          return;
        }
        e.preventDefault();
        return false;
      };

      const preventTouchStart = (e) => {
        // Allow touch on all canvas elements and interactive elements
        if (e.target.closest('button, input, textarea, [role="button"], .slide-canvas, #main-slide-canvas, .absolute, .z-10, .z-20, .z-30, .z-40, .z-50, .pointer-events-auto, [data-element], [data-slide-element], [data-contextual-bar]')) {
          return;
        }
        e.preventDefault();
        return false;
      };

      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      document.addEventListener('touchstart', preventTouchStart, { passive: false });

      return () => {
        document.removeEventListener('touchmove', preventTouchMove);
        document.removeEventListener('touchstart', preventTouchStart);
      };
    }
  }, [isMobileFullscreen]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedAudio, setSelectedAudio] = useState('Medical');
  const [slideDuration, setSlideDuration] = useState(3);
  const [customAudioUrl, setCustomAudioUrl] = useState(null);
  const [prelisteningTrack, setPrelisteningTrack] = useState(null);
  
  // Video Styles
  const [videoStyles, setVideoStyles] = useState({
    fontFamily: 'sans-serif',
    fontSize: 48,
    textColor: '#ffffff',
    bgColor: '#111827'
  });

  const audioRef = React.useRef(null);
  const previewAudioRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const AUDIO_TRACKS = {
    'Soft': 'https://api.gynsys.net/uploads/audio/soft.mp3',
    'Inspirational': 'https://api.gynsys.net/uploads/audio/inspirational.mp3',
    'Medical': 'https://api.gynsys.net/uploads/audio/medical.mp3',
    'Dynamic': 'https://api.gynsys.net/uploads/audio/dynamic.mp3'
  };

  const getActiveAudioSrc = () => {
    if (selectedAudio === 'Custom' && customAudioUrl) return customAudioUrl;
    return AUDIO_TRACKS[selectedAudio] || AUDIO_TRACKS['Medical'];
  };

  useEffect(() => {
    let interval;
    if (activeTab === 'video' && generatedContent?.video_slides && isPlaying && !isExporting) {
      interval = setInterval(() => {
        setCurrentVideoSlide((prev) => (prev + 1) % generatedContent.video_slides.length);
      }, slideDuration * 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, generatedContent, isPlaying, isExporting, slideDuration]);

  useEffect(() => {
    if (audioRef.current) {
      if (activeTab === 'video' && isPlaying) {
        audioRef.current.src = getActiveAudioSrc();
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("[GynSys] Autoplay prevented");
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [activeTab, isPlaying, selectedAudio, customAudioUrl]);

  useEffect(() => {
    if (previewAudioRef.current) {
      if (prelisteningTrack) {
        // Al pre-escuchar, pausamos el video principal para no mezclar sonidos
        setIsPlaying(false);
        previewAudioRef.current.src = prelisteningTrack === 'Custom' ? customAudioUrl : AUDIO_TRACKS[prelisteningTrack];
        previewAudioRef.current.load();
        previewAudioRef.current.play().catch(e => console.log("Error in preview audio:", e));
      } else {
        previewAudioRef.current.pause();
      }
    }
  }, [prelisteningTrack]);

  const handleExportVideo = async () => {
    if (!generatedContent?.video_slides) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      
      // COMBINAR AUDIO Y VIDEO PARA EXPORTACIÓN
      const videoStream = canvas.captureStream(30);
      let combinedStream = videoStream;

      if (audioRef.current) {
        audioRef.current.src = getActiveAudioSrc();
        audioRef.current.load();
        
        // Timeout para el audio (máx 5s de espera)
        await Promise.race([
          new Promise(resolve => { audioRef.current.oncanplaythrough = resolve; }),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        audioRef.current.currentTime = 0;
        audioRef.current.play();
        const audioStream = audioRef.current.captureStream ? audioRef.current.captureStream() : audioRef.current.mozCaptureStream();
        combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
      }

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9,opus' 
      });
      const chunks = [];
      
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_gynsys_${selectedPost?.id}.mp4`;
        a.click();
        setIsExporting(false);
        showToast('¡Video con Audio generado con éxito!', 'success');
      };

      recorder.start();
      
      for (let i = 0; i < generatedContent.video_slides.length; i++) {
        const slide = generatedContent.video_slides[i];
        
        // Draw Background
        ctx.fillStyle = videoStyles.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Image if exists
        if (slide.image) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Timeout para imagen
            await Promise.race([
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
                img.src = slide.image;
              }),
              new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'rgba(0,0,0,0.4)'; // Overlay
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          } catch (e) { console.log("Error loading slide image"); }
        }

        // Draw Text
        ctx.fillStyle = videoStyles.textColor;
        ctx.font = `bold ${videoStyles.fontSize}px ${videoStyles.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const words = slide.text.split(' ');
        let line = '';
        let y = canvas.height / 2 - 100;
        
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 600 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 60;
          } else { line = testLine; }
        }
        ctx.fillText(line, canvas.width / 2, y);
        
        setExportProgress(Math.round(((i + 1) / generatedContent.video_slides.length) * 100));
        await new Promise(r => setTimeout(r, slideDuration * 1000));
      }
      
      recorder.stop();
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('Error al renderizar el video', 'error');
    }
  };

  const handleAddImageToVideoSlide = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newSlides = [...generatedContent.video_slides];
      newSlides[index].image = event.target.result;
      setGeneratedContent({ ...generatedContent, video_slides: newSlides });
    };
    reader.readAsDataURL(file);
  };
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

  const handleGenerate = async (genType) => {
    if (!selectedPost) {
      showToast('Selecciona un artículo primero', 'error');
      return;
    }

    setGenerating(true);
    try {
      const result = await blogService.generateSocialContent(selectedPost.id, genType);
      
      console.log(`[GynSys] AI Result (${genType}):`, result);

      // Clean previous content and set new one
      setGeneratedContent(result);
      setCurrentVideoSlide(0);
      setActiveTab(genType === 'video' ? 'video' : 'carousel');
      
      if (genType === 'video') {
         setCurrentVideoSlide(0); // Reset video player
      }

      showToast(`${genType === 'video' ? 'Video' : 'Carrusel'} generado con éxito`, 'success');
    } catch (error) {
      console.error('Error generating content:', error);
      showToast('Error al generar contenido con IA', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleConvertToVideo = async () => {
    if (!generatedContent?.slides || generatedContent.slides.length === 0) {
      showToast('No hay contenido en el carrusel para convertir', 'error');
      return;
    }

    setGenerating(true);
    try {
      // Tomar los textos actuales del carrusel (por si el médico los editó)
      const carouselText = generatedContent.slides
        .map(s => `${s.title}\n${s.content}`)
        .join('\n\n');
      
      const title = activeProjectName || selectedPost?.title || 'Mi Video';
      
      const result = await blogService.generateSocialFromContent(title, carouselText, 'video');
      
      setGeneratedContent(prev => ({
        ...prev,
        video_slides: result.video_slides,
        music_suggestion: result.music_suggestion,
        type: 'video'
      }));
      
      setActiveTab('video');
      setCurrentVideoSlide(0);
      showToast('¡Carrusel convertido a video con éxito!', 'success');
    } catch (error) {
      console.error('Error converting to video:', error);
      showToast('Error al convertir carrusel a video', 'error');
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
    setMobileActionPerformed(false);
    showToast('Lienzo de prueba cargado', 'success');
  };

  const handleSaveProject = async () => {
    if (activeProjectId && activeProjectName) {
      // Incluir ajustes de video en el guardado
      const videoSettings = {
        videoStyles,
        selectedAudio,
        slideDuration,
        customAudioUrl
      };
      
      const contentToSave = {
        ...generatedContent,
        videoSettings
      };

      const ok = await designer.canvas.saveProject(activeProjectName, contentToSave, activeProjectId);
      if (ok) showToast(`"${activeProjectName}" guardado`, 'success');
      else showToast('Error al guardar', 'error');
    } else {
      handleSaveProjectAs();
    }
  };

  const handleSaveProjectAs = async () => {
    const name = prompt('Nombre del proyecto:', activeProjectName || selectedPost?.title || 'Mi Carrusel');
    if (name) {
      const videoSettings = {
        videoStyles,
        selectedAudio,
        slideDuration,
        customAudioUrl
      };
      
      const contentToSave = {
        ...generatedContent,
        videoSettings
      };

      const ok = await designer.canvas.saveProject(name, contentToSave);
      if (ok) {
        setActiveProjectName(name);
        showToast(`"${name}" guardado`, 'success');
      } else {
        showToast('Error al guardar', 'error');
      }
    }
  };

  const handleSaveTemplate = () => {
    const name = prompt('Nombre de la plantilla:');
    if (name) {
      designer.canvas.saveCustomTemplate(name, generatedContent);
      showToast(`Plantilla "${name}" guardada`, 'success');
    }
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
      
      // Restaurar ajustes de video si existen
      if (content.videoSettings) {
        if (content.videoSettings.videoStyles) setVideoStyles(content.videoSettings.videoStyles);
        if (content.videoSettings.selectedAudio) setSelectedAudio(content.videoSettings.selectedAudio);
        if (content.videoSettings.slideDuration) setSlideDuration(content.videoSettings.slideDuration);
        if (content.videoSettings.customAudioUrl) setCustomAudioUrl(content.videoSettings.customAudioUrl);
        
        if (content.type === 'video' || content.video_slides) {
          setActiveTab('video');
        } else {
          setActiveTab('carousel');
        }
      } else {
        setActiveTab('carousel');
      }

      setActiveProjectName(project.name || null);
      setActiveProjectId(project.id || null);
      setMobileActionPerformed(false);
      showToast(`Proyecto "${project.name || 'Sin nombre'}" cargado`, 'success');
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
        {!isMobile && (
          <>
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
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate pr-1">{p.name}</p>
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {p.is_backend ? 'Nube' : 'Local'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : (typeof p.id === 'number' && p.id > 1000000 ? new Date(p.id).toLocaleDateString() : 'Reciente')} - {p.content.slides.length} diapositivas
                                    </p>
                                  </button>
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (window.confirm('¿Eliminar proyecto?')) {
                                        const ok = await designer.canvas.deleteProject(p.id, p.is_backend);
                                        if (ok) showToast('Proyecto eliminado', 'success');
                                      }
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-1">IA Creator</h3>
                        <p className="text-indigo-100 text-sm">Transforma tu artículo en contenido social</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 max-w-2xl relative z-10">
                        <button onClick={() => handleGenerate('video')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl font-black transition-all border border-white/10 backdrop-blur-sm"><FiVideo /> Generar Video</button>
                        <button onClick={() => handleGenerate('carousel')} disabled={generating} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl font-black transition-all border border-white/10 backdrop-blur-sm"><FiImage /> Carousel</button>
                        <button onClick={handleTestDesign} className="flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 p-4 rounded-2xl font-black transition-all text-white shadow-lg">🧪 Draft Mode</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Proyectos Guardados Section */}
              <div className="w-full mb-12">
                <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div 
                    className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                    onClick={() => setShowProjects(!showProjects)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-500">
                        <FiFolder size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Continuar Proyecto</p>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Mis Proyectos Guardados</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full text-xs font-black">{designer.canvas.projects.length}</span>
                      <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${showProjects ? 'rotate-180' : ''}`} size={20} />
                    </div>
                  </div>

                  {showProjects && (
                    <div className="border-t border-gray-50 dark:border-gray-700 animate-slideDown">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {designer.canvas.projects.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 italic text-sm col-span-full">No tienes proyectos guardados todavía.</div>
                        ) : (
                          designer.canvas.projects.map(p => (
                            <div key={p.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-r border-gray-50 dark:border-gray-700/50 flex flex-col justify-between group transition-all">
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {p.is_backend ? 'Nube' : 'Local'}
                                    </span>
                                    {p.content?.videoSettings && (
                                      <span className="bg-red-100 text-red-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black flex items-center gap-1">
                                        <FiVideo size={8} /> Video
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-bold">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Reciente'}</p>
                                </div>
                                <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{p.name}</h5>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{p.content?.slides?.length || 0} Diapositivas</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleLoadProject(p)}
                                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                >
                                  Abrir
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('¿Eliminar proyecto?')) {
                                      const ok = await designer.canvas.deleteProject(p.id, p.is_backend);
                                      if (ok) showToast('Proyecto eliminado', 'success');
                                    }
                                  }}
                                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Editor Content */}
              <div className="w-full">
                {generating ? (
                  <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100"><FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-bold">IA procesando...</p></div>
                ) : generatedContent ? (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mx-auto">
                      <button 
                        onClick={() => {
                          if (!generatedContent.video_slides) {
                            handleConvertToVideo();
                          } else {
                            setActiveTab('video');
                          }
                        }} 
                        className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {generating && activeTab === 'carousel' ? 'Generando...' : 'Generador de Video'}
                      </button>
                      <button onClick={() => setActiveTab('carousel')} className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${activeTab === 'carousel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Editor de Carrusel</button>
                      <button onClick={handleSaveProject} className="px-8 py-2.5 rounded-lg text-sm font-black transition-all bg-indigo-600 text-white shadow-sm ml-2">Guardar Proyecto</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-sm border-2 border-dashed border-gray-100 animate-pulse">
                    <FiCpu className="w-12 h-12 text-indigo-200 mb-4" />
                    <h3 className="font-black text-gray-400 uppercase tracking-tighter">Esperando selección de artículo</h3>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {generatedContent && !isMobile && (
          <div className="space-y-8">
            {activeTab === 'carousel' && (
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
                      onSave={handleSaveProject}
                      onPreview={() => setPreviewIndex(0)}
                      selectedElement={designer.canvas.selectedExtraId || designer.canvas.selectedImageId}
                      totalSlides={generatedContent.slides.length}
                      generatedContent={generatedContent}
                      onRemoveImage={handleRemoveImage}
                      onConvertToVideo={handleConvertToVideo}
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
                          {/* Fixed height spacer for contextual bar */}
                          <div className="h-16 mb-4">
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
                                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                                >
                                  <FiLayers size={28} />
                                </button>

                                {/* Text-specific controls */}
                                {elementType === 'text' && elementData && (
                                  <>
                                    <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[9px] font-black uppercase text-gray-400">Texto:</label>
                                      <input
                                        type="text"
                                        value={elementData.content}
                                        onChange={(e) => {
                                          const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                          designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { content: e.target.value });
                                        }}
                                        className="w-32 px-2 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                                        placeholder="Editar texto..."
                                      />
                                    </div>
                                    <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                    <div className="flex items-center gap-2">
                                      <FiType size={12} className="text-gray-400" />
                                      <select
                                        value={elementData.fontFamily || 'Arial'}
                                        onChange={(e) => {
                                          const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                                          designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { fontFamily: e.target.value });
                                        }}
                                        className="px-2 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                                      >
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Courier New">Courier New</option>
                                        <option value="Impact">Impact</option>
                                        <option value="Comic Sans MS">Comic Sans MS</option>
                                      </select>
                                    </div>
                                    <div className="h-6 w-[1px] bg-indigo-100 dark:bg-indigo-900"></div>
                                    <div className="flex items-center gap-2">
                                      <FiMaximize2 size={12} className="text-gray-400" />
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
                                  className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                >
                                  <FiTrash2 size={18} />
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
                          </div>

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
                                 slide={generatedContent?.slides?.[designer.canvas.currentSlidePage]}
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
                                   if (!generatedContent?.slides) return;
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

            {activeTab === 'video' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                {/* Header de Video */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <FiVideo size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Video Reel Automático</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Contenido optimizado (Max 15 palabras por slide)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveProject}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <FiSave /> Guardar Reel
                    </button>
                    <button 
                      onClick={handleExportVideo}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <FiLoader className="animate-spin" /> {exportProgress}%
                        </>
                      ) : (
                        <>
                          <FiDownload /> Exportar Video MP4
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Vista Previa de Video */}
                  <div className="lg:col-span-2 space-y-6">
                    <div 
                      key={generatedContent.video_slides?.length + (generatedContent.music_suggestion || '')}
                      className="bg-gray-900 rounded-[32px] aspect-[9/16] max-h-[600px] mx-auto overflow-hidden relative shadow-2xl border-8 border-gray-800 group"
                    >
                      {/* Simulación de Video pasando solo */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center p-10 text-center transition-all duration-500"
                        style={{ backgroundColor: videoStyles.bgColor }}
                      >
                        {generatedContent.video_slides?.[currentVideoSlide]?.image && (
                          <img 
                            src={generatedContent.video_slides[currentVideoSlide].image} 
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            alt="Background"
                          />
                        )}
                        <div key={currentVideoSlide} className="animate-fadeIn space-y-6 relative z-10">
                          <p 
                            className="text-3xl font-black leading-tight drop-shadow-lg transition-all"
                            style={{ 
                              color: videoStyles.textColor,
                              fontFamily: videoStyles.fontFamily,
                              fontSize: `${videoStyles.fontSize / 1.5}px` // Scale down for preview
                            }}
                          >
                            {generatedContent.video_slides?.[currentVideoSlide]?.text || "Tu contenido aquí..."}
                          </p>
                          <div 
                            className="w-16 h-1.5 mx-auto rounded-full shadow-lg"
                            style={{ backgroundColor: videoStyles.textColor }}
                          ></div>
                        </div>
                      </div>

                      {/* Indicador de Progreso (Barra arriba) */}
                      <div className="absolute top-4 left-4 right-4 flex gap-1.5">
                        {generatedContent.video_slides?.map((_, i) => (
                           <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-white transition-all duration-[3000ms] linear ${i === currentVideoSlide ? 'w-full' : i < currentVideoSlide ? 'w-full' : 'w-0'}`}
                              ></div>
                           </div>
                        ))}
                      </div>
                      
                      {/* Branding Superpuesto */}
                      <div className="absolute bottom-10 left-0 right-0 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border border-white/20"></div>
                          <p className="text-white text-[10px] font-black uppercase">Dr. {doctor?.last_name || 'GynSys'}</p>
                        </div>
                        <FiInstagram className="text-white/50" />
                      </div>
                      
                      <div 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                          {isPlaying ? (
                            <FiZap className="text-white fill-white" size={32} />
                          ) : (
                            <FiPlay className="text-white fill-white ml-1" size={32} />
                          )}
                        </div>
                        <div className="absolute top-10 right-10">
                           {isPlaying ? <FiVolume2 className="text-white/50" /> : <FiVolumeX className="text-white/50" />}
                        </div>
                      </div>
                      
                      {/* Hidden Audio Elements */}
                      <audio 
                        ref={audioRef} 
                        loop 
                        crossOrigin="anonymous" 
                        onError={() => showToast('Error al cargar audio principal. Prueba con uno externo.', 'error')}
                      />
                      <audio 
                        ref={previewAudioRef} 
                        crossOrigin="anonymous" 
                        onError={() => showToast('Error en previsualización de audio.', 'error')}
                      />
                    </div>

                    {/* Editor de Textos de Video */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Secuencia de Escenas</h4>
                      <div className="space-y-4">
                        {generatedContent.video_slides?.map((slide, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100">
                            <span className="text-[10px] font-black bg-white w-6 h-6 flex items-center justify-center rounded-lg shadow-sm">{i+1}</span>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                value={slide.text} 
                                onChange={(e) => {
                                  const newSlides = [...generatedContent.video_slides];
                                  newSlides[i].text = e.target.value;
                                  setGeneratedContent({...generatedContent, video_slides: newSlides});
                                }}
                                className="w-full bg-transparent font-bold text-gray-800 dark:text-white outline-none"
                              />
                              <p className={`text-[9px] mt-1 font-bold uppercase ${slide.text.split(' ').length > 12 ? 'text-red-500' : 'text-green-500'}`}>
                                {slide.text.split(' ').length} palabras {slide.text.split(' ').length > 12 && '(Demasiado largo para Reel)'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="cursor-pointer bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-indigo-50 transition-all">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleAddImageToVideoSlide(i, e)} 
                                />
                                <FiImage size={14} className={slide.image ? 'text-indigo-600' : 'text-gray-400'} />
                              </label>
                              {slide.image && (
                                <button 
                                  onClick={() => {
                                    const newSlides = [...generatedContent.video_slides];
                                    delete newSlides[i].image;
                                    setGeneratedContent({...generatedContent, video_slides: newSlides});
                                  }}
                                  className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Audio y Estilo */}
                  <div className="space-y-8">
                    {/* Estilos Visuales */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-6">
                        <FiType className="text-indigo-600" />
                        <h4 className="font-black uppercase text-xs tracking-widest">Estilos de Video</h4>
                      </div>
                      <div className="space-y-6">
                        {/* Font Family */}
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fuente</label>
                          <select 
                            value={videoStyles.fontFamily}
                            onChange={(e) => setVideoStyles({...videoStyles, fontFamily: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 outline-none"
                          >
                            <option value="sans-serif">Sans Serif (Moderno)</option>
                            <option value="serif">Serif (Clásico)</option>
                            <option value="monospace">Monospace (Tech)</option>
                            <option value="Manrope">Manrope (GynSys)</option>
                            <option value="Impact">Impact (Bold)</option>
                          </select>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Texto</label>
                            <input 
                              type="color" 
                              value={videoStyles.textColor}
                              onChange={(e) => setVideoStyles({...videoStyles, textColor: e.target.value})}
                              className="w-full h-10 rounded-xl cursor-pointer border-none bg-gray-50 p-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fondo</label>
                            <input 
                              type="color" 
                              value={videoStyles.bgColor}
                              onChange={(e) => setVideoStyles({...videoStyles, bgColor: e.target.value})}
                              className="w-full h-10 rounded-xl cursor-pointer border-none bg-gray-50 p-1"
                            />
                          </div>
                        </div>

                        {/* Font Size */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tamaño Texto</label>
                            <span className="text-[10px] font-black text-indigo-600">{videoStyles.fontSize}px</span>
                          </div>
                          <input 
                            type="range" min="20" max="80" 
                            value={videoStyles.fontSize}
                            onChange={(e) => setVideoStyles({...videoStyles, fontSize: parseInt(e.target.value)})}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Música de Fondo */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-6">
                        <FiDroplet className="text-indigo-600" />
                        <h4 className="font-black uppercase text-xs tracking-widest">Música de Fondo</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { id: 'Soft', label: 'Corporativa Soft' },
                          { id: 'Inspirational', label: 'Inspiracional' },
                          { id: 'Medical', label: 'Médica Moderna' },
                          { id: 'Dynamic', label: 'Rítmica Dinámica' }
                        ].map((m) => (
                          <div key={m.id} className="flex gap-2">
                            <button 
                              onClick={() => setSelectedAudio(m.id)}
                              className={`flex-1 text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedAudio === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 border-gray-50 hover:border-indigo-200 text-gray-700'}`}
                            >
                              <span className="text-xs font-bold">{m.label}</span>
                              <div className={`w-2 h-2 rounded-full ${selectedAudio === m.id ? 'bg-white' : 'bg-gray-300 group-hover:bg-indigo-400'}`}></div>
                            </button>
                            <button 
                              onClick={() => {
                                if (prelisteningTrack === m.id) {
                                  setPrelisteningTrack(null);
                                } else {
                                  setPrelisteningTrack(m.id);
                                }
                              }}
                              className={`p-4 rounded-2xl border flex items-center justify-center transition-all ${prelisteningTrack === m.id ? 'bg-amber-500 border-amber-600 text-white shadow-lg animate-pulse' : 'bg-gray-50 border-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                              {prelisteningTrack === m.id ? <FiPause size={14} /> : <FiPlay size={14} />}
                            </button>
                          </div>
                        ))}

                        {/* Custom Audio Upload */}
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-xs hover:bg-indigo-100 transition-all">
                            <FiUpload size={14} />
                            {customAudioUrl ? 'Cambiar Audio Propio' : 'Subir Audio Externo (MP3)'}
                            <input 
                              type="file" 
                              accept="audio/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setCustomAudioUrl(url);
                                  setSelectedAudio('Custom');
                                  showToast('Audio externo cargado', 'success');
                                }
                              }}
                            />
                          </label>
                          {customAudioUrl && (
                            <button 
                              onClick={() => setSelectedAudio('Custom')}
                              className={`w-full mt-2 p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedAudio === 'Custom' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-green-50 text-green-700 border-green-100'}`}
                            >
                              <span className="text-xs font-bold">Usar Audio Subido</span>
                              <div className={`w-2 h-2 rounded-full ${selectedAudio === 'Custom' ? 'bg-white' : 'bg-green-500'}`}></div>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4 italic text-center">
                        Sugerencia IA: "{generatedContent.music_suggestion || 'Médica Moderna'}"
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-6">
                        <FiClock className="text-indigo-600" />
                        <h4 className="font-black uppercase text-xs tracking-widest">Tiempo por Escena</h4>
                      </div>
                      <div className="space-y-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          step="0.5"
                          value={slideDuration}
                          onChange={(e) => setSlideDuration(parseFloat(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                          <span>Rápido (1s)</span>
                          <span className="text-indigo-600">{slideDuration} Segundos</span>
                          <span>Lento (10s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-3xl p-8 border border-amber-100 dark:border-amber-900/50">
                      <h4 className="text-xs font-black uppercase tracking-tighter text-amber-600 mb-4 flex items-center gap-2">
                         <FiZap /> Tips de Oro (Video)
                      </h4>
                      <ul className="space-y-3">
                        <li className="text-[11px] font-bold text-amber-700 flex gap-2">
                           <span className="opacity-50">•</span> Las frases cortas aumentan la retención.
                        </li>
                        <li className="text-[11px] font-bold text-amber-700 flex gap-2">
                           <span className="opacity-50">•</span> El 80% ve Reels sin sonido; el texto es clave.
                        </li>
                        <li className="text-[11px] font-bold text-amber-700 flex gap-2">
                           <span className="opacity-50">•</span> La primera frase debe ser irresistible.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Layout - always renders on mobile, regardless of generatedContent */}
      {isMobile && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Compact Mobile Header */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <FiCpu className="text-indigo-600" /> GynSys
              </h1>
              <button 
                onClick={() => setShowProjects(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-800"
              >
                <FiFolder /> Proyectos
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={selectedPost?.id || ''}
                onChange={(e) => {
                  setSelectedPost(posts.find(p => p.id === parseInt(e.target.value)));
                  setGeneratedContent(null);
                }}
                className="block w-full rounded-xl border-gray-200 dark:bg-gray-900 dark:text-white py-2 px-3 border text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Elegir artículo...</option>
                {posts.map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
              </select>

              {generating && (
                <div className="flex items-center justify-center gap-2 py-3 text-indigo-600">
                  <FiLoader className="animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest">IA procesando...</span>
                </div>
              )}

              {selectedPost && !generatedContent && !generating && (
                <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                  <button 
                    onClick={() => handleGenerate('reel')} 
                    className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter"
                  >
                    <FiInstagram size={10} /> Reel
                  </button>
                  <button 
                    onClick={() => handleGenerate('carousel')} 
                    className="flex items-center justify-center gap-1.5 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter"
                  >
                    <FiImage size={10} /> Carrusel
                  </button>
                  <button 
                    onClick={handleTestDesign}
                    className="flex items-center justify-center gap-1.5 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter"
                  >
                    <FiZap size={10} /> Draft
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Projects Modal */}
          {showProjects && (
            <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm animate-fadeIn flex flex-col">
              <div className="mt-auto bg-white dark:bg-gray-800 rounded-t-[40px] shadow-2xl p-6 h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mis Proyectos</h3>
                  <button onClick={() => setShowProjects(false)} className="p-2 text-gray-400 hover:text-gray-600">
                    <FiX size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-8 no-scrollbar">
                  {designer.canvas.projects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic">No tienes carruseles guardados todavía.</div>
                  ) : (
                    designer.canvas.projects.map(p => (
                      <div key={p.id} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                        <button onClick={() => { handleLoadProject(p); setShowProjects(false); }} className="text-left flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                              {p.is_backend ? 'Nube' : 'Local'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Reciente'} - {p.content?.slides?.length || 0} slides
                          </p>
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Eliminar proyecto?')) {
                              const ok = await designer.canvas.deleteProject(p.id, p.is_backend);
                              if (ok) showToast('Proyecto eliminado', 'success');
                            }
                          }}
                          className="p-3 text-red-400 hover:bg-red-50 rounded-2xl"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Main Area */}
          <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-hidden">
            {!generatedContent ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border-2 border-dashed border-gray-100 dark:border-gray-700 text-center p-10">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center text-gray-200 dark:text-gray-700 mb-6">
                  <FiZap size={40} />
                </div>
                <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4 leading-relaxed">
                  Selecciona un artículo y genera contenido
                </h3>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                {/* Active Project Info */}
                {activeProjectName && (
                  <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiFolder className="text-indigo-500 flex-shrink-0" size={16} />
                      <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wide truncate">{activeProjectName}</span>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-400 flex-shrink-0 ml-2">{generatedContent?.slides?.length || 0} slides</span>
                  </div>
                )}

                <div className="w-full bg-white dark:bg-gray-800 p-5 rounded-[32px] shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => { enterMobileFullscreen(); setMobileActionPerformed(true); }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1"
                    >
                      <FiMaximize2 size={16} /> Editar
                    </button>
                    <button
                      onClick={() => { setPreviewIndex(0); setMobileActionPerformed(true); }}
                      className="w-full py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1"
                    >
                      <FiEye size={16} /> Preview
                    </button>
                  </div>
                </div>

                {!activeProjectName && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    <div className="w-8 h-[1px] bg-gray-200"></div>
                    {generatedContent?.slides?.length || 0} Slides
                    <div className="w-8 h-[1px] bg-gray-200"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Full-Screen Editor */}
          {isMobileFullscreen && (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[100] overflow-hidden flex flex-col">
              <button
                onClick={exitMobileFullscreen}
                className="absolute top-4 right-4 z-[110] p-3 bg-red-500 text-white rounded-full shadow-lg"
              >
                <FiX size={24} />
              </button>

              <div className="flex-1 flex items-center justify-center w-full">
                <div
                  className="flex items-center justify-center"
                  style={{ width: 410 * scale, height: 410 * scale, perspective: '1000px' }}
                >
                  <div id="main-slide-canvas" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                    <SlideCanvas
                      slide={generatedContent?.slides?.[designer.canvas.currentSlidePage]}
                      index={designer.canvas.currentSlidePage}
                      doctor={doctor}
                      doctorLogo={doctorLogoBase64}
                      design={designer.design}
                      canvas={designer.canvas}
                      transform={transformer?.state}
                      handlers={transformer?.handlers}
                      watermark={watermarkImage}
                      onEdit={setEditingIndex}
                      onPreview={setPreviewIndex}
                      onCopy={(i) => {
                        if (!generatedContent?.slides) return;
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

              {/* Navigation */}
              <div className="fixed bottom-24 left-0 right-0 z-[110] flex justify-center px-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex items-center gap-4">
                  <button
                    onClick={() => designer.canvas.setCurrentSlidePage(Math.max(0, designer.canvas.currentSlidePage - 1))}
                    disabled={designer.canvas.currentSlidePage === 0}
                    className={`p-3 rounded-full transition-all ${designer.canvas.currentSlidePage === 0 ? 'text-gray-300' : 'text-indigo-600 active:scale-90'}`}
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Diapositiva</span>
                    <span className="text-sm font-black text-indigo-600 leading-none">
                      {designer.canvas.currentSlidePage + 1} <span className="text-gray-300 mx-0.5">/</span> {generatedContent?.slides?.length || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => designer.canvas.setCurrentSlidePage(Math.min((generatedContent?.slides?.length || 1) - 1, designer.canvas.currentSlidePage + 1))}
                    disabled={designer.canvas.currentSlidePage === (generatedContent?.slides?.length || 1) - 1}
                    className={`p-3 rounded-full transition-all ${designer.canvas.currentSlidePage === (generatedContent?.slides?.length || 1) - 1 ? 'text-gray-300' : 'text-indigo-600 active:scale-90'}`}
                  >
                    <FiChevronRight size={24} />
                  </button>
                </div>
              </div>

              {/* Mobile Toolbar */}
              {!(designer.canvas.selectedExtraId || designer.canvas.selectedImageId) && (
                <MobileToolbar
                  canvas={designer.canvas}
                  design={designer.design}
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
                  onSave={handleSaveProject}
                  onSaveAs={handleSaveProjectAs}
                  onSaveTemplate={handleSaveTemplate}
                  onPreview={() => setPreviewIndex(0)}
                  currentSlide={designer.canvas.currentSlidePage}
                  activeProjectName={activeProjectName}
                  onConvertToVideo={handleConvertToVideo}
                />
              )}

              {/* Contextual element controls */}
              {designer.canvas.selectedExtraId && (() => {
                const [slideIdx, elId] = designer.canvas.selectedExtraId.split('-');
                const el = designer.canvas.extraElements[slideIdx]?.find(e => e.id === elId);
                if (!el || el.type === 'image') return null;
                return (
                  <div
                    data-contextual-bar="true"
                    className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-[150] p-3 pb-safe shadow-xl"
                  >
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <div className="relative flex items-center justify-center w-9 h-9 rounded-full border-2 border-gray-200 overflow-hidden shadow-sm bg-white">
                        <input
                          type="color"
                          value={el.color || '#000000'}
                          onChange={(e) => designer.canvas.updateExtraElement(parseInt(slideIdx), elId, { color: e.target.value })}
                          className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0 bg-transparent"
                        />
                      </div>
                      <button
                        onClick={() => designer.canvas.removeExtraElement(parseInt(slideIdx), elId)}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl"
                      >
                        <FiTrash2 size={20} />
                      </button>
                      <button
                        onClick={() => designer.canvas.selectElement(null, null)}
                        className="p-2 text-gray-400"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

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
                  value={generatedContent?.slides?.[editingIndex]?.title || ''}
                  onChange={(e) => {
                    if (!generatedContent?.slides) return;
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
                  value={generatedContent?.slides?.[editingIndex]?.content || ''}
                  onChange={(e) => {
                    if (!generatedContent?.slides) return;
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
    </div>
  );
}
