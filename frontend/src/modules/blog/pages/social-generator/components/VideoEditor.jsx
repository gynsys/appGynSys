
import React from 'react';
import { 
  FiZap, FiPlay, FiVolume2, FiVolumeX, FiImage, FiTrash2, 
  FiType, FiPause, FiUpload, FiClock, FiInstagram, FiVideo, FiDownload, FiLoader, FiDroplet, FiScissors
} from 'react-icons/fi';
import { AUDIO_TRACKS } from '../constants';

export const VideoEditor = ({ 
  generatedContent, 
  setGeneratedContent,
  videoStyles, 
  setVideoStyles,
  slideDuration, 
  setSlideDuration,
  transitionType = 'fade',
  setTransitionType,
  transitionDuration = 0.5,
  setTransitionDuration,
  isPlaying, 
  setIsPlaying,
  currentVideoSlide,
  setCurrentVideoSlide,
  selectedAudio,
  setSelectedAudio,
  prelisteningTrack,
  setPrelisteningTrack,
  customAudioUrl,
  setCustomAudioUrl,
  audioRef,
  previewAudioRef,
  isExporting,
  exportProgress,
  handleExportVideo,
  doctor,
  showToast,
  handleAddImageToVideoSlide
}) => {

  const handleSplitScene = (index) => {
    const scenes = generatedContent?.video_slides || generatedContent?.slides || [];
    const text = scenes[index]?.text || scenes[index]?.content || '';
    const words = text.split(' ').filter(Boolean);
    
    if (words.length <= 4) {
      showToast('La escena es demasiado corta para dividirla', 'error');
      return;
    }

    const mid = Math.ceil(words.length / 2);
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');

    const newScenes = [...scenes];
    if (newScenes[index].content) newScenes[index].content = text1;
    else newScenes[index].text = text1;

    const nextScene = { ...newScenes[index], image: null };
    if (nextScene.content) nextScene.content = text2;
    else nextScene.text = text2;

    newScenes.splice(index + 1, 0, nextScene);
    setGeneratedContent({ ...generatedContent, video_slides: newScenes });
    showToast('Escena dividida con éxito', 'success');
  };

  const scenes = generatedContent?.video_slides || generatedContent?.slides;

  if (!scenes || !Array.isArray(scenes)) {
    return (
      <div className="p-20 text-center bg-white dark:bg-gray-800 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-700">
        <FiVideo className="mx-auto text-gray-200 mb-4" size={48} />
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Esperando secuencia de video...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-12">
      <div className="flex flex-col 2xl:flex-row gap-8 items-start">
        
        {/* COL 1: SMART PREVIEW (iPhone Frame) */}
        <div className="w-full lg:w-[380px] flex-shrink-0 sticky top-24">
          <div className="relative aspect-[9/19.5] bg-black rounded-[54px] overflow-hidden shadow-[0_0_0_12px_#0f172a,0_30px_60px_-12px_rgba(0,0,0,0.5)] border-[1.5px] border-white/10 group">
            
            {/* Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0f172a] rounded-b-3xl z-40 flex items-center justify-center">
              <div className="w-10 h-1 bg-white/10 rounded-full"></div>
            </div>

            {/* Video Canvas Rendering */}
            <div 
              className="absolute inset-0 flex items-center justify-center transition-all duration-700 overflow-hidden"
              style={{ 
                backgroundColor: !scenes[currentVideoSlide]?.image ? videoStyles.bgColor || videoStyles.backgroundColor : 'transparent' 
              }}
            >
              {scenes[currentVideoSlide]?.image && (
                <img 
                  src={scenes[currentVideoSlide].image} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                  alt="Background"
                />
              )}
              <div className="relative z-10 p-10 text-center w-full space-y-4">
                <p 
                  className="font-black leading-[1.1] animate-slideUp drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                  style={{ 
                    fontFamily: videoStyles.fontFamily,
                    fontSize: `${videoStyles.fontSize}px`,
                    color: videoStyles.textColor
                  }}
                >
                  {scenes[currentVideoSlide]?.text || scenes[currentVideoSlide]?.content || scenes[currentVideoSlide]?.title || ''}
                </p>
                {scenes[currentVideoSlide]?.overlayText && (
                  <p 
                    className="text-white/80 font-bold tracking-tight animate-fadeIn"
                    style={{ 
                      fontFamily: videoStyles.fontFamily,
                      fontSize: `${Math.max(14, videoStyles.fontSize * 0.4)}px`
                    }}
                  >
                    {scenes[currentVideoSlide].overlayText}
                  </p>
                )}
              </div>
            </div>

            {/* Top Branding Bar */}
            <div className="absolute top-14 left-8 right-8 flex items-center justify-between z-30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/15 backdrop-blur-xl rounded-full border border-white/25 shadow-sm"></div>
                <p className="text-white text-[10px] font-black uppercase tracking-[0.15em] drop-shadow-md">Dr. {doctor?.last_name || 'GynSys'}</p>
              </div>
              <FiInstagram className="text-white/60 drop-shadow-md" size={16} />
            </div>
            
            {/* Playback Interaction */}
            <div 
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-30"
            >
              <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-300">
                {isPlaying ? <FiZap className="text-white fill-white" size={32} /> : <FiPlay className="text-white fill-white ml-1.5" size={32} />}
              </div>
            </div>
            
            {/* Elegant Seeker Bar */}
            <div className="absolute bottom-10 left-8 right-8 h-1.5 bg-white/15 rounded-full cursor-pointer z-40 overflow-hidden backdrop-blur-md"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                setCurrentVideoSlide(Math.min(Math.floor(percent * scenes.length), scenes.length - 1));
                setIsPlaying(false);
              }}
            >
              <div 
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-300"
                style={{ width: `${((currentVideoSlide + (isPlaying ? 0.5 : 0)) / scenes.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Nav Controls & Export Button */}
          <div className="mt-8 px-4 space-y-6">
            <div className="flex justify-center gap-2.5">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentVideoSlide(i); setIsPlaying(false); }}
                  className={`h-2 rounded-full transition-all duration-500 ${currentVideoSlide === i ? 'bg-indigo-600 w-8' : 'bg-gray-200 dark:bg-gray-700 w-2 hover:bg-indigo-300'}`}
                />
              ))}
            </div>

            <button 
              onClick={handleExportVideo}
              disabled={isExporting}
              className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isExporting ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {isExporting ? <><FiLoader className="animate-spin" /> Procesando {exportProgress}%</> : <><FiVideo size={18} /> Exportar Reel MP4</>}
            </button>
          </div>

          <audio ref={audioRef} loop crossOrigin="anonymous" />
          <audio ref={previewAudioRef} crossOrigin="anonymous" />
        </div>

        {/* COL 2: STYLE & RHYTHM (Center Panel) */}
        <div className="flex-1 max-w-[460px] space-y-6">
          {/* Visual Identity */}
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-7 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <FiType className="text-indigo-600" size={16} />
              </div>
              <h4 className="font-black uppercase text-[11px] tracking-[0.15em] text-gray-900 dark:text-white">Identidad Visual</h4>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tipografía del Reel</label>
                <select 
                  value={videoStyles.fontFamily}
                  onChange={(e) => setVideoStyles({...videoStyles, fontFamily: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl text-xs font-bold p-3.5 outline-none dark:text-white ring-1 ring-gray-100 dark:ring-gray-700"
                >
                  <option value="Montserrat">Montserrat (Moderno)</option>
                  <option value="Playfair Display">Playfair (Premium)</option>
                  <option value="Bebas Neue">Bebas Neue (Impacto)</option>
                  <option value="Outfit">Outfit (Minimalista)</option>
                  <option value="Impact">Impact (Clásico)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Color Texto</label>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700">
                    <input type="color" value={videoStyles.textColor} onChange={(e) => setVideoStyles({...videoStyles, textColor: e.target.value})} className="w-full h-9 rounded-xl cursor-pointer border-none bg-transparent p-0" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Color Fondo</label>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700">
                    <input type="color" value={videoStyles.bgColor || videoStyles.backgroundColor} onChange={(e) => setVideoStyles({...videoStyles, bgColor: e.target.value, backgroundColor: e.target.value})} className="w-full h-9 rounded-xl cursor-pointer border-none bg-transparent p-0" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tamaño del Mensaje</label>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">{videoStyles.fontSize}px</span>
                </div>
                <input type="range" min="24" max="72" value={videoStyles.fontSize} onChange={(e) => setVideoStyles({...videoStyles, fontSize: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full appearance-none" />
              </div>
            </div>
          </div>

          {/* Audio & Motion */}
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-7 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <FiDroplet className="text-indigo-600" size={16} />
              </div>
              <h4 className="font-black uppercase text-[11px] tracking-[0.15em] text-gray-900 dark:text-white">Audio y Movimiento</h4>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Banda Sonora</label>
                <select 
                  value={selectedAudio}
                  onChange={(e) => setSelectedAudio(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl text-xs font-bold p-3.5 outline-none dark:text-white ring-1 ring-gray-100 dark:ring-gray-700"
                >
                  {AUDIO_TRACKS?.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  <option value="Custom">Mi Audio Subido</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Transición</label>
                  <select value={transitionType} onChange={(e) => setTransitionType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl text-[10px] font-bold p-3 outline-none dark:text-white ring-1 ring-gray-100 dark:ring-gray-700">
                    <option value="fade">Fade (Suave)</option>
                    <option value="slide">Slide (Lateral)</option>
                    <option value="zoom">Zoom (Foco)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Velocidad</label>
                  <input type="number" step="0.1" value={transitionDuration} onChange={(e) => setTransitionDuration(parseFloat(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl text-[10px] font-bold p-3 outline-none dark:text-white ring-1 ring-gray-100 dark:ring-gray-700" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duración por Escena</label>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">{slideDuration}s</span>
                </div>
                <input type="range" min="1.5" max="8" step="0.5" value={slideDuration} onChange={(e) => setSlideDuration(parseFloat(e.target.value))} className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full appearance-none" />
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: SCENE SEQUENCER (Right Panel) */}
        <div className="flex-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-7 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">Guión del Video</h4>
              <span className="px-3 py-1 bg-gray-50 dark:bg-gray-900 text-[10px] font-black text-gray-400 rounded-full">{scenes.length} Escenas</span>
            </div>
            
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar">
              {scenes.map((slide, i) => {
                const slideText = slide.text || slide.content || slide.title || '';
                return (
                  <div key={i} className="group/scene relative flex gap-5 p-6 bg-gray-50 dark:bg-gray-900/30 rounded-[28px] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center text-[11px] font-black text-indigo-600 border border-gray-100 dark:border-gray-700">{i + 1}</div>
                      <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 group-last/scene:hidden"></div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <textarea 
                          value={slideText} 
                          onChange={(e) => {
                            const newSlides = [...scenes];
                            if (slide.content) newSlides[i].content = e.target.value;
                            else if (slide.title) newSlides[i].title = e.target.value;
                            else newSlides[i].text = e.target.value;
                            setGeneratedContent({...generatedContent, video_slides: newSlides});
                          }}
                          rows={2}
                          className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 text-xs font-bold text-gray-800 dark:text-white border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow shadow-sm"
                          placeholder="Escribe el mensaje principal..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={slide.overlayText || ''}
                            onChange={(e) => {
                              const newSlides = [...scenes];
                              newSlides[i].overlayText = e.target.value;
                              setGeneratedContent({...generatedContent, video_slides: newSlides});
                            }}
                            className="w-full bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100/30 rounded-xl px-4 py-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-300"
                            placeholder="Subtítulo o texto secundario..."
                          />
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button onClick={() => handleSplitScene(i)} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 text-indigo-600 border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-indigo-50 transition-all" title="Dividir escena"><FiScissors size={14} /></button>
                          <label className="p-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:text-indigo-600 transition-all">
                            <FiImage size={14} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAddImageToVideoSlide(i, e)} />
                          </label>
                          {slide.image && (
                            <button onClick={() => { const ns = [...scenes]; delete ns[i].image; setGeneratedContent({...generatedContent, video_slides: ns}); }} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"><FiTrash2 size={14} /></button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${slideText.split(' ').filter(Boolean).length > 12 ? 'text-red-500' : 'text-gray-400'}`}>
                          {slideText.split(' ').filter(Boolean).length} {'/ 12 PALABRAS'}
                        </p>
                        {slide.image && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><FiImage size={10} /> Imagen Cargada</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
