import React, { useState } from 'react';
import { FiUpload, FiTrash2, FiLayers, FiSave, FiChevronDown, FiFolder, FiDownload } from 'react-icons/fi';

export const TopToolbar = ({ 
  design, 
  canvas, 
  onDownload, 
  onWatermark, 
  watermark, 
  onApplyTemplate, 
  totalSlides,
  onLoadProject,
  generatedContent
}) => {
  const {
    bgColor, setBgColor, bgColor2, setBgColor2, bgColor3, setBgColor3,
    useBgGradient, setUseBgGradient, fontSize, setFontSize,
    titleFontSize, setTitleFontSize,
    headerFontSize, setHeaderFontSize, titleColor, setTitleColor,
    contentColor, setContentColor, headerColor, setHeaderColor,
    imageSize, setImageSize,
    dividerColor, setDividerColor,
    dividerHeight, setDividerHeight, dividerWidth, setDividerWidth
  } = design;

  const { 
    selectedExtraId, extraElements, updateExtraElement, removeExtraElement, 
    selectedBranding, selectedDivider, 
    customTemplates, saveCustomTemplate, applyCustomTemplate, deleteTemplate,
    projects, saveProject, deleteProject
  } = canvas;

  const [showTemplates, setShowTemplates] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  const handleSaveTemplate = () => {
    const name = prompt('Nombre de la plantilla (solo diseño):');
    if (name) saveCustomTemplate(name);
  };

  const handleSaveProject = () => {
    const name = prompt('Nombre del proyecto (contenido + diseño):');
    if (name) saveProject(name, generatedContent);
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
      
      {/* Absolute Download Button */}
      <div className="absolute top-6 right-6 z-10">
        <button onClick={onDownload} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 whitespace-nowrap">
          Descargar ZIP <FiDownload size={18} />
        </button>
      </div>

      {/* Row 1: Data & Background */}
      <div className="flex flex-wrap items-center gap-6 pr-48">
        
        {/* Projects Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setShowProjects(!showProjects); setShowTemplates(false); }}
            className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 rounded-2xl border border-indigo-100 dark:border-indigo-700 transition-all group"
          >
            <div className="text-left">
              <p className="text-[9px] font-black uppercase text-indigo-400 leading-none mb-1">Proyecto</p>
              <p className="text-sm font-black text-indigo-600">Mis Carruseles</p>
            </div>
            <FiChevronDown className={`transition-transform duration-300 ${showProjects ? 'rotate-180' : ''}`} />
          </button>

          {showProjects && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400">Seleccionar Proyecto</span>
                <button onClick={handleSaveProject} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <FiSave size={12} /> Guardar
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 italic text-sm">No tienes proyectos guardados</div>
                ) : (
                  projects.map(p => (
                    <div key={p.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between group">
                      <button 
                        onClick={() => { onLoadProject(p); setShowProjects(false); }}
                        className="text-left flex-1"
                      >
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate w-48">{p.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{new Date(p.id).toLocaleDateString()}</p>
                      </button>
                      <button onClick={() => deleteProject(p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Templates Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setShowTemplates(!showTemplates); setShowProjects(false); }}
            className="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all group"
          >
            <div className="text-left">
              <p className="text-[9px] font-black uppercase text-gray-400 leading-none mb-1">Plantilla</p>
              <p className="text-sm font-black text-gray-600">Diseños</p>
            </div>
            <FiChevronDown className={`transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {showTemplates && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400">Seleccionar Estilo</span>
                <button onClick={handleSaveTemplate} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <FiSave size={12} /> Guardar
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {customTemplates.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 italic text-sm">No hay plantillas</div>
                ) : (
                  customTemplates.map(t => (
                    <div key={t.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between group">
                      <button 
                        onClick={() => { applyCustomTemplate(t, totalSlides); setShowTemplates(false); }}
                        className="text-left flex-1"
                      >
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                      </button>
                      <button onClick={() => deleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* BG Colors */}
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-[9px] font-black uppercase text-gray-400">Fondo</p>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-12 p-0.5 bg-white border border-gray-200 cursor-pointer rounded-lg shadow-sm" />
            {useBgGradient && (
              <>
                <input type="color" value={bgColor2} onChange={(e) => setBgColor2(e.target.value)} className="h-8 w-12 p-0.5 bg-white border border-gray-200 cursor-pointer rounded-lg shadow-sm" />
                <input type="color" value={bgColor3} onChange={(e) => setBgColor3(e.target.value)} className="h-8 w-12 p-0.5 bg-white border border-gray-200 cursor-pointer rounded-lg shadow-sm" />
              </>
            )}
            <button onClick={() => setUseBgGradient(!useBgGradient)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${useBgGradient ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>Degradado</button>
          </div>
        </div>

        <button onClick={onApplyTemplate} className="ml-auto px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase border border-indigo-100 hover:bg-indigo-100 transition-all">
          Replicar Diseño Actual a Todas
        </button>
      </div>

      {/* Row 2: Typography & Element Styles */}
      <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-gray-50 dark:border-gray-700/50">
        
        {/* Colors Group */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">Título</p>
            <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="h-8 w-14 p-1 bg-white border border-gray-200 cursor-pointer rounded-lg" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">Texto</p>
            <input type="color" value={contentColor} onChange={(e) => setContentColor(e.target.value)} className="h-8 w-14 p-1 bg-white border border-gray-200 cursor-pointer rounded-lg" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">Nombre</p>
            <input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="h-8 w-14 p-1 bg-white border border-gray-200 cursor-pointer rounded-lg" />
          </div>
        </div>

        {/* Font Sliders Group */}
        <div className="flex items-center gap-6 px-6 border-l border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">T. Título</p>
            <div className="flex items-center gap-2">
              <input type="range" min={16} max={48} step={1} value={titleFontSize} onChange={(e) => setTitleFontSize(Number(e.target.value))} className="w-20 accent-indigo-600" />
              <span className="text-[9px] font-mono text-gray-400">{titleFontSize}px</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">T. Contenido</p>
            <div className="flex items-center gap-2">
              <input type="range" min={10} max={24} step={1} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-20 accent-purple-600" />
              <span className="text-[9px] font-mono text-gray-400">{fontSize}px</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">T. Nombre</p>
            <div className="flex items-center gap-2">
              <input type="range" min={8} max={24} step={1} value={headerFontSize} onChange={(e) => setHeaderFontSize(Number(e.target.value))} className="w-20 accent-blue-600" />
              <span className="text-[9px] font-mono text-gray-400">{headerFontSize}px</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black uppercase text-gray-400 leading-none">Tam. Imagen</p>
            <div className="flex items-center gap-2">
              <input type="range" min={60} max={200} step={10} value={imageSize} onChange={(e) => setImageSize(Number(e.target.value))} className="w-20 accent-amber-500" />
              <span className="text-[9px] font-mono text-gray-400">{imageSize}px</span>
            </div>
          </div>
        </div>

        {/* Watermark Group */}
        <div className="flex flex-col gap-1 px-6 border-l border-gray-100 dark:border-gray-700">
          <p className="text-[9px] font-black uppercase text-gray-400 leading-none">Marca de Agua</p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-[10px] font-bold text-gray-700 transition-all">
              <FiUpload size={10} /> {watermark ? 'Cambiar' : 'Subir'}
              <input type="file" className="hidden" accept="image/*" onChange={onWatermark} />
            </label>
          </div>
        </div>
      </div>

      {/* Contextual Element Toolbar */}
      {(selectedExtraId || selectedBranding || selectedDivider) && (
        <div className="w-full flex items-center gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl animate-slideUp">
          {selectedExtraId && (() => {
            const [slideIdx, elId] = selectedExtraId.split('-');
            const sIdx = parseInt(slideIdx);
            const el = extraElements[sIdx]?.find(e => e.id === elId);
            if (!el) return null;

            return (
              <>
                <div className="flex items-center gap-3 pr-6 border-r border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] font-black uppercase text-gray-400">Color Elemento</span>
                  <div className="flex items-center gap-2">
                    <input type="color" value={el.color} onChange={(e) => updateExtraElement(sIdx, el.id, { color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" />
                    {el.useGradient && (
                      <>
                        <input type="color" value={el.color2} onChange={(e) => updateExtraElement(sIdx, el.id, { color2: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" />
                        <input type="color" value={el.color3} onChange={(e) => updateExtraElement(sIdx, el.id, { color3: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 border-r border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={el.useGradient} onChange={(e) => updateExtraElement(sIdx, el.id, { useGradient: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Gradiente</span>
                  </label>
                </div>
                {el.type === 'text' && (
                  <div className="flex-1 flex items-center gap-4 px-6 border-r border-gray-200 dark:border-gray-700">
                    <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Editar Texto</span>
                    <input 
                      type="text" 
                      value={el.content} 
                      onChange={(e) => updateExtraElement(sIdx, el.id, { content: e.target.value })}
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
                <button onClick={() => updateExtraElement(sIdx, el.id, { zIndex: el.zIndex === 5 ? 30 : 5 })} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${el.zIndex === 5 ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <FiLayers size={14} /> <span className="text-[8px] font-black uppercase">Capa {el.zIndex === 5 ? 'Inf' : 'Sup'}</span>
                </button>
                <button onClick={() => removeExtraElement(sIdx, el.id)} className="ml-auto w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                  <FiTrash2 size={16} />
                </button>
              </>
            );
          })()}

          {selectedDivider && (
            <div className="flex-1 flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-gray-400">Color Línea</span>
                <input type="color" value={dividerColor} onChange={(e) => setDividerColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase text-gray-400">Grosor</p>
                <input type="range" min={1} max={10} step={1} value={dividerHeight} onChange={(e) => setDividerHeight(Number(e.target.value))} className="w-32" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase text-gray-400">Ancho %</p>
                <input type="range" min={10} max={100} step={5} value={dividerWidth} onChange={(e) => setDividerWidth(Number(e.target.value))} className="w-32" />
              </div>
              <div className="ml-auto text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                Línea de Cabecera Seleccionada
              </div>
            </div>
          )}

          {selectedBranding && (
            <div className="flex-1 flex items-center gap-8">
              <div className="text-[10px] font-black uppercase text-gray-400">Configuración de Marca</div>
              <p className="text-xs text-gray-500 font-bold">Puedes arrastrar el logo y nombre a cualquier lugar de la diapositiva.</p>
              <div className="ml-auto text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                Marca Médica Seleccionada
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
