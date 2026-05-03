import React, { useState } from 'react';
import { FiUpload, FiTrash2, FiLayers, FiSave, FiChevronDown, FiCheck } from 'react-icons/fi';

export const TopToolbar = ({ 
  design, 
  canvas, 
  onDownload, 
  onWatermark, 
  watermark, 
  onApplyTemplate, 
  totalSlides 
}) => {
  const {
    bgColor, setBgColor, bgColor2, setBgColor2, bgColor3, setBgColor3,
    useBgGradient, setUseBgGradient, fontSize, setFontSize,
    headerFontSize, setHeaderFontSize, titleColor, setTitleColor,
    contentColor, setContentColor, headerColor, setHeaderColor,
    imageSize, setImageSize,
    brandingPos, dividerPos, dividerColor, setDividerColor,
    dividerHeight, setDividerHeight, dividerWidth, setDividerWidth
  } = design;

  const { 
    selectedExtraId, extraElements, updateExtraElement, removeExtraElement, 
    selectedBranding, selectedDivider, 
    customTemplates, saveCustomTemplate, applyCustomTemplate, deleteTemplate 
  } = canvas;

  const [showTemplates, setShowTemplates] = useState(false);

  const handleSaveTemplate = () => {
    const name = prompt('Nombre de la plantilla:');
    if (name) {
      saveCustomTemplate(name);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6 space-y-8">
      {/* Global Design & Template Row */}
      <div className="flex flex-wrap items-center gap-8 pb-8 border-b border-gray-100 dark:border-gray-700/50">
        {/* Templates Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all group"
          >
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Plantilla</p>
              <p className="text-sm font-black text-indigo-600">Mis Diseños</p>
            </div>
            <FiChevronDown className={`transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {showTemplates && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400">Seleccionar Diseño</span>
                <button onClick={handleSaveTemplate} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <FiSave size={12} /> Guardar Actual
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {customTemplates.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 italic text-sm">No tienes plantillas guardadas</div>
                ) : (
                  customTemplates.map(t => (
                    <div key={t.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between group">
                      <button 
                        onClick={() => {
                          applyCustomTemplate(t, totalSlides);
                          setShowTemplates(false);
                        }}
                        className="text-left flex-1"
                      >
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{new Date(t.id).toLocaleDateString()}</p>
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">Fondo</p>
            <span className="text-[10px] font-mono text-gray-600 uppercase">{bgColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-[40px] w-[50px] p-1 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
            {useBgGradient && (
              <>
                <input type="color" value={bgColor2} onChange={(e) => setBgColor2(e.target.value)} className="h-[40px] w-[50px] p-1 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
                <input type="color" value={bgColor3} onChange={(e) => setBgColor3(e.target.value)} className="h-[40px] w-[50px] p-1 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
              </>
            )}
            <button onClick={() => setUseBgGradient(!useBgGradient)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${useBgGradient ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>Degradado</button>
          </div>
        </div>

        {/* Text Colors */}
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-[10px] font-black uppercase text-gray-600 mb-1">Título</p></div>
          <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-[10px] font-black uppercase text-gray-600 mb-1">Texto</p></div>
          <input type="color" value={contentColor} onChange={(e) => setContentColor(e.target.value)} className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-[10px] font-black uppercase text-gray-600 mb-1">Nombre</p></div>
          <input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="h-[40px] w-[60px] p-1.5 bg-white border border-gray-200 cursor-pointer rounded-xl shadow-sm" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={onDownload} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95">
            Descargar ZIP 📦
          </button>
        </div>
      </div>

      {/* Font & Size Row */}
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Fuente Contenido</p>
          <div className="flex items-center gap-2">
            <input type="range" min={10} max={24} step={1} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-24 accent-indigo-600" />
            <span className="text-[10px] font-mono text-gray-600 w-8">{fontSize}px</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase text-gray-600 leading-none">Fuente Nombre</p>
          <div className="flex items-center gap-2">
            <input type="range" min={8} max={24} step={1} value={headerFontSize} onChange={(e) => setHeaderFontSize(Number(e.target.value))} className="w-24 accent-purple-600" />
            <span className="text-[10px] font-mono text-gray-600 w-8">{headerFontSize}px</span>
          </div>
        </div>
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
              <FiUpload size={12} /> {watermark ? 'Cambiar' : 'Subir'}
              <input type="file" className="hidden" accept="image/*" onChange={onWatermark} />
            </label>
            {watermark && (
              <button onClick={() => onWatermark({ target: { files: [] } })} className="p-1 bg-red-100 text-red-500 rounded-lg hover:bg-red-200">
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <button onClick={onApplyTemplate} className="ml-auto px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100 hover:bg-indigo-100 transition-all">
          Replicar Diseño Actual a Todas
        </button>
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
                      placeholder="Escribe algo..."
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
