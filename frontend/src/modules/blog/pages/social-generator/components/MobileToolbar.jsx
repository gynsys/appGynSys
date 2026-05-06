import React, { useState } from 'react';
import { FiType, FiBox, FiPlus, FiTrash2, FiLayers, FiMove, FiRotateCw, FiMaximize2, FiDownload, FiSave, FiCopy, FiEye, FiEdit3, FiSettings, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { SHAPES_CONFIG } from '../lib/svgIcons';

export const MobileToolbar = ({ 
  canvas, 
  design,
  transform, 
  selectedElement, 
  onAddElement, 
  onDeleteElement, 
  onDownload,
  onSave,
  onPreview,
  currentSlide 
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [showLayerControls, setShowLayerControls] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-[70] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section - Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSection(activeSection === 'tools' ? null : 'tools')}
            className={`p-3 rounded-2xl transition-all ${activeSection === 'tools' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
          >
            <FiPlus size={20} />
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'design' ? null : 'design')}
            className={`p-3 rounded-2xl transition-all ${activeSection === 'design' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
          >
            <FiSettings size={20} />
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'elements' ? null : 'elements')}
            className={`p-3 rounded-2xl transition-all ${activeSection === 'elements' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
          >
            <FiBox size={20} />
          </button>
        </div>

        {/* Center Section - Selection Context */}
        <div className="flex items-center gap-1">
          {selectedElement && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-1 rounded-xl border border-amber-100 dark:border-amber-800 animate-fadeIn">
              <button
                onClick={() => setShowLayerControls(!showLayerControls)}
                className="p-2 rounded-lg text-amber-600"
              >
                <FiLayers size={18} />
              </button>
              <button
                onClick={onDeleteElement}
                className="p-2 rounded-lg text-red-500"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPreview}
            className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500"
          >
            <FiEye size={20} />
          </button>
          <button
            onClick={onSave}
            className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg"
          >
            <FiSave size={20} />
          </button>
          <button
            onClick={onDownload}
            className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg"
          >
            <FiDownload size={20} />
          </button>
        </div>
      </div>

      {/* Expandable Sections */}
      {(activeSection || showLayerControls) && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slideUp">
          {/* Design Section */}
          {activeSection === 'design' && design && (
            <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ajustes Globales</h3>
                <button onClick={() => setActiveSection(null)} className="p-1 text-gray-300"><FiChevronDown /></button>
              </div>
              
              <div className="space-y-6 pb-4">
                {/* Background Section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Fondo de Diapositiva</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <input
                        type="color"
                        value={design.bgColor}
                        onChange={(e) => design.setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border-none p-0 cursor-pointer"
                      />
                      {design.useBgGradient && (
                        <>
                          <input
                            type="color"
                            value={design.bgColor2}
                            onChange={(e) => design.setBgColor2(e.target.value)}
                            className="w-10 h-10 rounded-xl border-none p-0 cursor-pointer"
                          />
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => design.setUseBgGradient(!design.useBgGradient)}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                        design.useBgGradient ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      Gradiente
                    </button>
                  </div>
                </div>

                {/* Text Colors Section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Colores de Texto</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <input type="color" value={design.titleColor} onChange={(e) => design.setTitleColor(e.target.value)} className="w-8 h-8 rounded-lg" />
                      <span className="text-[8px] font-black uppercase text-gray-400">Título</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <input type="color" value={design.contentColor} onChange={(e) => design.setContentColor(e.target.value)} className="w-8 h-8 rounded-lg" />
                      <span className="text-[8px] font-black uppercase text-gray-400">Cuerpo</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <input type="color" value={design.headerColor} onChange={(e) => design.setHeaderColor(e.target.value)} className="w-8 h-8 rounded-lg" />
                      <span className="text-[8px] font-black uppercase text-gray-400">Marca</span>
                    </div>
                  </div>
                </div>

                {/* Font Sizes Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tamaños de Fuente</p>
                  <div className="space-y-4 px-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>Título</span>
                        <span>{design.titleFontSize}px</span>
                      </div>
                      <input type="range" min="16" max="48" value={design.titleFontSize} onChange={(e) => design.setTitleFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>Cuerpo</span>
                        <span>{design.fontSize}px</span>
                      </div>
                      <input type="range" min="10" max="24" value={design.fontSize} onChange={(e) => design.setFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>Marca</span>
                        <span>{design.headerFontSize}px</span>
                      </div>
                      <input type="range" min="8" max="24" value={design.headerFontSize} onChange={(e) => design.setHeaderFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tools Section */}
          {activeSection === 'tools' && (
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => { onAddElement(currentSlide, 'text', 'Texto'); setActiveSection(null); }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 transition-all"
                >
                  <FiType size={20} className="text-indigo-600" />
                  <span className="text-[10px] font-bold">Texto</span>
                </button>
                <button
                  onClick={() => { onAddElement(currentSlide, 'shape', 'circle'); setActiveSection(null); }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 transition-all"
                >
                  <div className="w-5 h-5 bg-indigo-600 rounded-full"></div>
                  <span className="text-[10px] font-bold">Círculo</span>
                </button>
                <button
                  onClick={() => { onAddElement(currentSlide, 'shape', 'square'); setActiveSection(null); }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 transition-all"
                >
                  <div className="w-5 h-5 bg-indigo-600"></div>
                  <span className="text-[10px] font-bold">Cuadro</span>
                </button>
                <button
                  onClick={() => { onAddElement(currentSlide, 'shape', 'triangle'); setActiveSection(null); }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 transition-all"
                >
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[17px] border-b-indigo-600"></div>
                  <span className="text-[10px] font-bold">Triángulo</span>
                </button>
              </div>
            </div>
          )}

          {/* Elements Section */}
          {activeSection === 'elements' && (
            <div className="p-5 max-h-[50vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-4 gap-3">
                {SHAPES_CONFIG.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => { onAddElement(currentSlide, 'shape', shape.id); setActiveSection(null); }}
                    className="flex flex-col items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm min-h-[80px]"
                  >
                    <div className="w-8 h-8 flex items-center justify-center text-indigo-600">
                      {React.cloneElement(shape.icon, { className: 'w-full h-full' })}
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 text-center leading-tight">
                      {shape.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer Controls */}
          {showLayerControls && (
            <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Posición de Capa</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { /* Layer move logic */ }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-amber-600 rounded-xl font-bold text-xs shadow-sm border border-amber-100 dark:border-amber-900"
                  >
                    <FiChevronUp size={16} /> Frente
                  </button>
                  <button
                    onClick={() => { /* Layer move logic */ }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-amber-600 rounded-xl font-bold text-xs shadow-sm border border-amber-100 dark:border-amber-900"
                  >
                    <FiChevronDown size={16} /> Fondo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
