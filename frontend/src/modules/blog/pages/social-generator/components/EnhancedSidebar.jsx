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
  totalSlides,
  generatedContent
}) => {
  const [activeTab, setActiveTab] = useState('elements');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

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
                    {SHAPES_CONFIG.map(shape => (
                      <button 
                        key={shape.id}
                        onClick={() => onAddElement(currentSlide, 'shape', shape.id)} 
                        className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all group p-2" 
                        title={shape.label}
                      >
                        <div className="group-hover:scale-110 transition-transform">
                          {shape.icon}
                        </div>
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
                {/* Templates Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="w-full flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <FiFolder className="text-indigo-600" />
                      <span className="text-sm font-black text-indigo-600">Mis Plantillas</span>
                    </div>
                    <FiChevronDown className={`transition-transform duration-300 text-indigo-600 ${showTemplates ? 'rotate-180' : ''}`} />
                  </button>

                  {showTemplates && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-fadeIn">
                      <div className="p-3 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                        <span className="text-[10px] font-black uppercase text-gray-400">Seleccionar Estilo</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {canvas.customTemplates?.length > 0 ? (
                          canvas.customTemplates.map(t => (
                            <div key={t.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-50 dark:border-gray-700/50 last:border-b-0">
                              <button 
                                onClick={() => { 
                                  canvas.applyCustomTemplate(t, totalSlides); 
                                  setShowTemplates(false); 
                                }}
                                className="text-left w-full"
                              >
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t.slides.length} diapositivas</p>
                              </button>
                              <button
                                onClick={() => {
                                  canvas.deleteTemplate(t.id);
                                  setShowTemplates(false);
                                }}
                                className="text-xs text-red-500 hover:text-red-700 mt-1"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-400 text-xs">
                            No hay plantillas guardadas
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Template */}
                <button
                  onClick={() => {
                    const name = prompt('Nombre de la plantilla:');
                    if (name) {
                      canvas.saveCustomTemplate(name, generatedContent);
                      setShowTemplates(false);
                    }
                  }}
                  className="w-full flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl transition-all"
                >
                  <FiSave className="text-green-600" />
                  <span className="text-sm font-black text-green-600">Guardar Plantilla</span>
                </button>

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

                              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
