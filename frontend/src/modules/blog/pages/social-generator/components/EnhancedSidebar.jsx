import React, { useState } from 'react';
import { FiType, FiBox, FiPlusCircle, FiSettings, FiLayers, FiMove, FiRotateCw, FiMaximize2, FiDownload, FiSave, FiCopy, FiEye, FiEdit3, FiChevronLeft, FiChevronRight, FiSquare, FiCircle, FiCornerUpRight, FiBold, FiItalic } from 'react-icons/fi';
import { SHAPES_CONFIG } from '../lib/svgIcons';

export const EnhancedSidebar = ({ 
  design, 
  canvas, 
  transform, 
  currentSlide, 
  onAddElement, 
  onDownload, 
  onSave, 
  onPreview,
  selectedElement,
  totalSlides 
}) => {
  const [activeTab, setActiveTab] = useState('elements');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Herramientas</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiChevronLeft className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!isCollapsed && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('elements')}
            className={`flex-1 px-4 py-3 text-xs font-black transition-all ${
              activeTab === 'elements' 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Elementos
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 px-4 py-3 text-xs font-black transition-all ${
              activeTab === 'design' 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Diseño
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 px-4 py-3 text-xs font-black transition-all ${
              activeTab === 'actions' 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Acciones
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          /* Collapsed State - Icon Only */
          <div className="p-2 space-y-2">
            <button
              onClick={() => onAddElement(currentSlide, 'text', 'Texto')}
              className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400"
              title="Agregar texto"
            >
              <FiType size={20} />
            </button>
            <button
              onClick={() => onAddElement(currentSlide, 'shape', 'circle')}
              className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400"
              title="Agregar círculo"
            >
              <div className="w-5 h-5 bg-indigo-600 rounded-full"></div>
            </button>
            <button
              onClick={() => onAddElement(currentSlide, 'shape', 'square')}
              className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400"
              title="Agregar cuadro"
            >
              <div className="w-5 h-5 bg-indigo-600"></div>
            </button>
            <button
              onClick={() => onAddElement(currentSlide, 'shape', 'arrow')}
              className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400"
              title="Agregar flecha"
            >
              <FiMove size={20} />
            </button>
          </div>
        ) : (
          <>
            {/* Elements Tab */}
            {activeTab === 'elements' && (
              <div className="p-4 space-y-6">
                {/* Text Elements */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Texto</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => onAddElement(currentSlide, 'text', 'Título')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-left font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      Título
                    </button>
                    <button
                      onClick={() => onAddElement(currentSlide, 'text', 'Subtítulo')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      Subtítulo
                    </button>
                    <button
                      onClick={() => onAddElement(currentSlide, 'text', 'Cuerpo')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cuerpo de texto
                    </button>
                  </div>
                </div>

                {/* Shape Elements */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Formas</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {SHAPES_CONFIG.slice(0, 12).map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => onAddElement(currentSlide, 'shape', shape.id)}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center gap-1"
                        title={shape.label}
                      >
                        <div className="w-6 h-6 text-indigo-600">
                          {shape.icon}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && (
              <div className="p-4 space-y-6">
                {/* Background Colors & Gradients */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Fondo</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.bgColor}
                        onChange={(e) => design.setBgColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      {design.useBgGradient && (
                        <>
                          <input
                            type="color"
                            value={design.bgColor2}
                            onChange={(e) => design.setBgColor2(e.target.value)}
                            className="w-12 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="color"
                            value={design.bgColor3}
                            onChange={(e) => design.setBgColor3(e.target.value)}
                            className="w-12 h-8 rounded cursor-pointer"
                          />
                        </>
                      )}
                      <button
                        onClick={() => design.setUseBgGradient(!design.useBgGradient)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                          design.useBgGradient ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Gradiente
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Colors */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Colores de Texto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Título</label>
                      <input
                        type="color"
                        value={design.titleColor}
                        onChange={(e) => design.setTitleColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Contenido</label>
                      <input
                        type="color"
                        value={design.contentColor}
                        onChange={(e) => design.setContentColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Marca</label>
                      <input
                        type="color"
                        value={design.headerColor}
                        onChange={(e) => design.setHeaderColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Tipografía</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Título</label>
                        <span className="text-[9px] font-mono text-gray-500">{design.titleFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={design.titleFontSize}
                        onChange={(e) => design.setTitleFontSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Contenido</label>
                        <span className="text-[9px] font-mono text-gray-500">{design.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={design.fontSize}
                        onChange={(e) => design.setFontSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Marca</label>
                        <span className="text-[9px] font-mono text-gray-500">{design.headerFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        value={design.headerFontSize}
                        onChange={(e) => design.setHeaderFontSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Border Radius */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Bordes de Imágenes</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => design.setImageBorderRadius('0px')}
                      className={`p-2 rounded-lg transition-all ${
                        design.imageBorderRadius === '0px'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title="Cuadrado"
                    >
                      <FiSquare size={14} />
                    </button>
                    <button
                      onClick={() => design.setImageBorderRadius('24px')}
                      className={`p-2 rounded-lg transition-all ${
                        design.imageBorderRadius === '24px'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title="Redondeado"
                    >
                      <FiCornerUpRight size={14} />
                    </button>
                    <button
                      onClick={() => design.setImageBorderRadius('999px')}
                      className={`p-2 rounded-lg transition-all ${
                        design.imageBorderRadius === '999px'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title="Círculo"
                    >
                      <FiCircle size={14} />
                    </button>
                  </div>
                </div>

                {/* Selected Element Controls */}
                {selectedElement && (() => {
                  const [slideIdx, elId] = selectedElement.split('-');
                  const el = canvas.extraElements[slideIdx]?.find(e => e.id === elId);
                  if (!el) return null;

                  return (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-3">Elemento Seleccionado</h3>
                      <div className="space-y-3">
                        {/* Element Color Controls */}
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">Color del Elemento</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={el.color}
                              onChange={(e) => canvas.updateExtraElement(parseInt(slideIdx), elId, { color: e.target.value })}
                              className="w-12 h-8 rounded cursor-pointer"
                            />
                            {el.useGradient && (
                              <>
                                <input
                                  type="color"
                                  value={el.color2}
                                  onChange={(e) => canvas.updateExtraElement(parseInt(slideIdx), elId, { color2: e.target.value })}
                                  className="w-12 h-8 rounded cursor-pointer"
                                />
                                <input
                                  type="color"
                                  value={el.color3}
                                  onChange={(e) => canvas.updateExtraElement(parseInt(slideIdx), elId, { color3: e.target.value })}
                                  className="w-12 h-8 rounded cursor-pointer"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Gradient Toggle */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={el.useGradient}
                            onChange={(e) => canvas.updateExtraElement(parseInt(slideIdx), elId, { useGradient: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                          />
                          <label className="text-xs text-gray-600 dark:text-gray-400">Usar Gradiente</label>
                        </div>

                        {/* Text Formatting (for text elements) */}
                        {el.type === 'text' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => canvas.updateExtraElement(parseInt(slideIdx), elId, { bold: !el.bold })}
                              className={`p-2 rounded-lg transition-all ${
                                el.bold ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title="Negrita"
                            >
                              <FiBold size={14} />
                            </button>
                            <button
                              onClick={() => canvas.updateExtraElement(parseInt(slideIdx), elId, { italic: !el.italic })}
                              className={`p-2 rounded-lg transition-all ${
                                el.italic ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title="Cursiva"
                            >
                              <FiItalic size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="p-4 space-y-4">
                {/* Layer Controls */}
                {selectedElement && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider mb-3">Control de Elemento</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          // Layer logic here
                        }}
                        className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiLayers size={14} />
                        Mover capa
                      </button>
                      <button
                        onClick={() => {
                          // Delete logic here
                        }}
                        className="w-full p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiTrash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={onPreview}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEye size={16} />
                    Vista Previa
                  </button>
                  <button
                    onClick={onSave}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiSave size={16} />
                    Guardar Proyecto
                  </button>
                  <button
                    onClick={onDownload}
                    className="w-full p-3 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiDownload size={16} />
                    Descargar ZIP
                  </button>
                </div>

                {/* Slide Navigation */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <h3 className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Navegación</h3>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => canvas.setCurrentSlidePage(Math.max(0, canvas.currentSlidePage - 1))}
                      disabled={canvas.currentSlidePage === 0}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-medium">
                      {canvas.currentSlidePage + 1} / {totalSlides}
                    </span>
                    <button
                      onClick={() => canvas.setCurrentSlidePage(Math.min(totalSlides - 1, canvas.currentSlidePage + 1))}
                      disabled={canvas.currentSlidePage === totalSlides - 1}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
