import React, { useState } from 'react';
import { FiType, FiBox, FiPlus, FiTrash2, FiLayers, FiMove, FiRotateCw, FiMaximize2, FiDownload, FiSave, FiCopy, FiEye, FiEdit3, FiSettings, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { SHAPES_CONFIG } from '../lib/svgIcons';

export const MobileToolbar = ({ 
  canvas, 
  transform, 
  selectedElement, 
  onAddElement, 
  onDeleteElement, 
  onDownload,
  onSave,
  onPreview,
  onSettings,
  currentSlide 
}) => {
  const [activeSection, setActiveSection] = useState('tools');
  const [showLayerControls, setShowLayerControls] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-[70]">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left Section - Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('tools')}
            className={`p-3 rounded-xl transition-all ${activeSection === 'tools' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <FiPlus size={20} />
          </button>
          <button
            onClick={() => setActiveSection('elements')}
            className={`p-3 rounded-xl transition-all ${activeSection === 'elements' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <FiBox size={20} />
          </button>
          <button
            onClick={() => setActiveSection('text')}
            className={`p-3 rounded-xl transition-all ${activeSection === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <FiType size={20} />
          </button>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="flex items-center gap-1">
          {selectedElement && (
            <>
              <button
                onClick={() => setShowLayerControls(!showLayerControls)}
                className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              >
                <FiLayers size={16} />
              </button>
              <button
                onClick={onDeleteElement}
                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <FiEye size={20} />
          </button>
          <button
            onClick={onDownload}
            className="p-3 rounded-xl bg-indigo-600 text-white"
          >
            <FiDownload size={20} />
          </button>
        </div>
      </div>

      {/* Expandable Sections */}
      {(activeSection !== 'tools' || showLayerControls) && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Tools Section */}
          {activeSection === 'tools' && (
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => onAddElement(currentSlide, 'text', 'Texto')}
                  className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-700 rounded-xl"
                >
                  <FiType size={20} className="text-indigo-600" />
                  <span className="text-xs">Texto</span>
                </button>
                <button
                  onClick={() => onAddElement(currentSlide, 'shape', 'circle')}
                  className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-5 h-5 bg-indigo-600 rounded-full"></div>
                  <span className="text-xs">Círculo</span>
                </button>
                <button
                  onClick={() => onAddElement(currentSlide, 'shape', 'square')}
                  className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-5 h-5 bg-indigo-600"></div>
                  <span className="text-xs">Cuadro</span>
                </button>
                <button
                  onClick={() => onAddElement(currentSlide, 'shape', 'triangle')}
                  className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[17px] border-b-indigo-600"></div>
                  <span className="text-xs">Triángulo</span>
                </button>
              </div>
            </div>
          )}

          {/* Elements Section */}
          {activeSection === 'elements' && (
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {SHAPES_CONFIG.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => onAddElement(currentSlide, 'shape', shape.id)}
                    className="flex flex-col items-center justify-between gap-2 p-3 bg-white dark:bg-gray-700 rounded-2xl shadow-sm hover:bg-gray-50 transition-all active:scale-95 min-h-[80px]"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-indigo-600">
                      {React.cloneElement(shape.icon, { className: 'w-full h-full' })}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 text-center leading-tight">
                      {shape.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Section */}
          {activeSection === 'text' && (
            <div className="p-4">
              <div className="space-y-2">
                <button
                  onClick={() => onAddElement(currentSlide, 'text', 'Título')}
                  className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl text-left font-bold"
                >
                  Título
                </button>
                <button
                  onClick={() => onAddElement(currentSlide, 'text', 'Subtítulo')}
                  className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl text-left"
                >
                  Subtítulo
                </button>
                <button
                  onClick={() => onAddElement(currentSlide, 'text', 'Cuerpo')}
                  className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl text-left text-sm"
                >
                  Cuerpo
                </button>
              </div>
            </div>
          )}

          {/* Layer Controls */}
          {showLayerControls && (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capa</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Move to front logic
                    }}
                    className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"
                  >
                    <FiChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => {
                      // Move to back logic
                    }}
                    className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"
                  >
                    <FiChevronDown size={16} />
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
