
import React from 'react';
import { FiUpload, FiTrash2, FiLayers } from 'react-icons/fi';

export const TopToolbar = ({ design, canvas, onDownload, onWatermark, watermark }) => {
  const {
    bgColor, setBgColor, bgColor2, setBgColor2, bgColor3, setBgColor3,
    useBgGradient, setUseBgGradient, fontSize, setFontSize,
    headerFontSize, setHeaderFontSize, titleColor, setTitleColor,
    contentColor, setContentColor, headerColor, setHeaderColor,
    imageSize, setImageSize
  } = design;

  const { selectedExtraId, extraElements, updateExtraElement, removeExtraElement } = canvas;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 p-6 space-y-8">
      {/* Global Design Row */}
      <div className="flex flex-wrap items-center gap-8 pb-8 border-b border-gray-100 dark:border-gray-700/50">
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

        <div className="ml-auto">
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
      </div>

      {/* Contextual Element Toolbar */}
      {selectedExtraId && (
        <div className="w-full flex items-center gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl animate-slideUp">
          {(() => {
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
                <button onClick={() => updateExtraElement(sIdx, el.id, { zIndex: el.zIndex === 1 ? 40 : 1 })} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${el.zIndex === 1 ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <FiLayers size={14} /> <span className="text-[8px] font-black uppercase">Capa {el.zIndex === 1 ? 'Inf' : 'Sup'}</span>
                </button>
                <button onClick={() => removeExtraElement(sIdx, el.id)} className="ml-auto w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                  <FiTrash2 size={16} />
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
