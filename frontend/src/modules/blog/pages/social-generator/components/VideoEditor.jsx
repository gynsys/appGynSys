
import React from 'react';
import { 
  FiZap, FiPlay, FiVolume2, FiVolumeX, FiImage, FiTrash2, 
  FiType, FiPause, FiUpload, FiClock, FiInstagram, FiVideo, FiDownload, FiLoader, FiDroplet, FiScissors
} from 'react-icons/fi';

export const VideoEditor = ({ 
  generatedContent, 
  setGeneratedContent,
  videoStyles, 
  setVideoStyles,
  slideDuration, 
  setSlideDuration,
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
    // Conservar el campo original (text o content)
    if (newScenes[index].content) {
      newScenes[index].content = text1;
    } else {
      newScenes[index].text = text1;
    }

    const nextScene = { ...newScenes[index], image: null };
    if (nextScene.content) nextScene.content = text2;
    else nextScene.text = text2;

    newScenes.splice(index + 1, 0, nextScene);
    setGeneratedContent({ ...generatedContent, video_slides: newScenes });
    showToast('Escena dividida con éxito', 'success');
  };
  // Flexibilidad: Buscar video_slides o slides si no existen las primeras
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
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Preview 9:16 */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="sticky top-24">
            <div className="relative aspect-[9/16] bg-black rounded-[32px] overflow-hidden shadow-2xl border-8 border-gray-900 group">
              {/* Actual Video Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {scenes[currentVideoSlide]?.image && (
                  <img 
                    src={scenes[currentVideoSlide].image} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    alt="Scene background"
                  />
                )}
                <div 
                  className="relative z-10 p-10 text-center w-full"
                  style={{ 
                    backgroundColor: !scenes[currentVideoSlide]?.image ? videoStyles.bgColor || videoStyles.backgroundColor : 'transparent' 
                  }}
                >
                  <p 
                    className="font-black leading-tight animate-slideUp"
                    style={{ 
                      fontFamily: videoStyles.fontFamily,
                      fontSize: `${videoStyles.fontSize}px`,
                      color: videoStyles.textColor
                    }}
                  >
                    {scenes[currentVideoSlide]?.text || scenes[currentVideoSlide]?.content || scenes[currentVideoSlide]?.title || ''}
                  </p>
                </div>
              </div>

              {/* Overlay Branding */}
              <div className="absolute top-10 left-10 right-10 flex items-center justify-between z-20">
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
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${((currentVideoSlide + 1) / scenes.length) * 100}%` }}
                ></div>
              </div>

              {/* Hidden Audio Elements */}
              <audio 
                ref={audioRef} 
                loop 
                crossOrigin="anonymous" 
              />
              <audio 
                ref={previewAudioRef} 
                crossOrigin="anonymous" 
              />
            </div>

            {/* Export Button */}
            <button 
              onClick={handleExportVideo}
              disabled={isExporting}
              className={`w-full mt-6 py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-all ${isExporting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'}`}
            >
              {isExporting ? (
                <>
                  <FiLoader className="animate-spin" /> Renderizando {exportProgress}%
                </>
              ) : (
                <>
                  <FiVideo size={18} /> Generar Video MP4
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Scene Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Secuencia de Escenas</h4>
                <div className="space-y-4">
                  {scenes?.map((slide, i) => {
                    const slideText = slide.text || slide.content || slide.title || '';
                    return (
                      <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] font-black bg-white dark:bg-gray-800 w-6 h-6 flex items-center justify-center rounded-lg shadow-sm dark:text-white">{i+1}</span>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={slideText} 
                            onChange={(e) => {
                              const newSlides = [...scenes];
                              // Actualizar el campo que ya existe o por defecto 'text'
                              if (slide.content) newSlides[i].content = e.target.value;
                              else if (slide.title) newSlides[i].title = e.target.value;
                              else newSlides[i].text = e.target.value;
                              
                              setGeneratedContent({...generatedContent, video_slides: newSlides});
                            }}
                            className="w-full bg-transparent font-bold text-gray-800 dark:text-white outline-none"
                          />
                          <p className={`text-[9px] mt-1 font-bold uppercase ${slideText.split(' ').filter(Boolean).length > 12 ? 'text-red-500' : 'text-green-500'}`}>
                            {slideText.split(' ').filter(Boolean).length} palabras {slideText.split(' ').filter(Boolean).length > 12 && '(Demasiado largo para Reel)'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleSplitScene(i)}
                            className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100"
                            title="Dividir escena en dos"
                          >
                            <FiScissors size={14} />
                          </button>
                          <label className="cursor-pointer bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-indigo-50 transition-all">
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
                                const newSlides = [...scenes];
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
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Visual Styles */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <FiType className="text-indigo-600" />
                  <h4 className="font-black uppercase text-xs tracking-widest text-gray-900 dark:text-white">Estilos de Video</h4>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fuente</label>
                    <select 
                      value={videoStyles.fontFamily}
                      onChange={(e) => setVideoStyles({...videoStyles, fontFamily: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs font-bold p-3 outline-none dark:text-white"
                    >
                      <option value="sans-serif">Sans Serif (Moderno)</option>
                      <option value="serif">Serif (Clásico)</option>
                      <option value="monospace">Monospace (Tech)</option>
                      <option value="Manrope">Manrope (GynSys)</option>
                      <option value="Impact">Impact (Bold)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Texto</label>
                      <input 
                        type="color" 
                        value={videoStyles.textColor}
                        onChange={(e) => setVideoStyles({...videoStyles, textColor: e.target.value})}
                        className="w-full h-10 rounded-xl cursor-pointer border-none bg-gray-50 dark:bg-gray-900 p-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fondo</label>
                      <input 
                        type="color" 
                        value={videoStyles.bgColor || videoStyles.backgroundColor}
                        onChange={(e) => setVideoStyles({...videoStyles, bgColor: e.target.value, backgroundColor: e.target.value})}
                        className="w-full h-10 rounded-xl cursor-pointer border-none bg-gray-50 dark:bg-gray-900 p-1"
                      />
                    </div>
                  </div>

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

              {/* Background Music */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <FiDroplet className="text-indigo-600" />
                  <h4 className="font-black uppercase text-xs tracking-widest text-gray-900 dark:text-white">Música de Fondo</h4>
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
                        className={`flex-1 text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedAudio === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-50 dark:border-gray-700 hover:border-indigo-200 text-gray-700 dark:text-gray-300'}`}
                      >
                        <span className="text-xs font-bold">{m.label}</span>
                        <div className={`w-2 h-2 rounded-full ${selectedAudio === m.id ? 'bg-white' : 'bg-gray-300 group-hover:bg-indigo-400'}`}></div>
                      </button>
                      <button 
                        onClick={() => setPrelisteningTrack(prelisteningTrack === m.id ? null : m.id)}
                        className={`p-4 rounded-2xl border flex items-center justify-center transition-all ${prelisteningTrack === m.id ? 'bg-amber-500 border-amber-600 text-white shadow-lg animate-pulse' : 'bg-gray-50 dark:bg-gray-900 border-gray-50 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        {prelisteningTrack === m.id ? <FiPause size={14} /> : <FiPlay size={14} />}
                      </button>
                    </div>
                  ))}

                  {/* Custom Audio Upload */}
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
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
                  </div>
                </div>
              </div>

              {/* Slide Duration */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <FiClock className="text-indigo-600" />
                  <h4 className="font-black uppercase text-xs tracking-widest text-gray-900 dark:text-white">Tiempo por Escena</h4>
                </div>
                <div className="space-y-4">
                  <input 
                    type="range" min="1" max="10" step="0.5"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
