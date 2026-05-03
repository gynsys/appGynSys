import React, { useRef } from 'react';
import { FiMaximize2, FiEdit3, FiPlusCircle, FiCopy, FiCheck, FiTrash2, FiRefreshCw, FiLayers } from 'react-icons/fi';
import { SVGIcons } from '../lib/svgIcons';

export const SlideCanvas = ({
  slide,
  index,
  isPreview,
  isExport = false,
  doctor,
  doctorLogo,
  design,
  canvas,
  transform,
  handlers,
  watermark,
  onEdit,
  onPreview,
  onCopy,
  onRemove,
  onAddImage,
  onRemoveImage
}) => {
  const containerRef = useRef(null);
  const isSelected = !isPreview && !isExport && canvas.currentSlidePage === index;
  
  const { 
    imagePositions, imageSizes, imageRotations, 
    contentPositions, contentRotations 
  } = transform;

  const { 
    fontSize, titleFontSize, titleColor, contentColor, headerColor, headerFontSize,
    logoPos, doctorNamePos, dividerPos, dividerColor, dividerHeight, dividerWidth,
    imageBorderRadius
  } = design;

  const {
    extraElements, selectElement, selectedExtraId, selectedImageId, selectedContentIndex,
    selectedLogo, selectedDoctorName
  } = canvas;

  const { handleDragStart, handleTransformStart } = handlers;

  return (
    <div 
      ref={containerRef}
      className={`relative w-[410px] h-[410px] overflow-hidden shadow-2xl transition-all duration-500 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-gray-50' : ''}`}
      style={{ 
        background: design.useBgGradient 
          ? `linear-gradient(to bottom right, ${design.bgColor}, ${design.bgColor2}, ${design.bgColor3})` 
          : design.bgColor,
        userSelect: isSelected ? 'none' : 'auto'
      }}
      onClick={() => isSelected && selectElement(null, null)}
    >
      {/* Logo Section */}
      {doctorLogo && (
        <div 
          className={`absolute z-30 transition-shadow ${isSelected && selectedLogo ? 'border-[1.5px] border-dashed border-indigo-500 rounded-xl p-2 bg-white/5' : ''}`}
          style={{
            left: logoPos.x + '%',
            top: logoPos.y + '%',
            transform: 'translate(-50%, -50%)',
            cursor: isSelected ? 'grab' : 'default',
          }}
          onMouseDown={(e) => isSelected && handleDragStart(e, index, 'logo', 'global-logo', containerRef.current, logoPos)}
          onClick={(e) => { e.stopPropagation(); isSelected && selectElement('logo', 'global-logo'); }}
        >
          <img src={doctorLogo} alt="Logo" className="w-10 h-10 object-contain" />
        </div>
      )}

      {/* Doctor Name Section */}
      <div 
        className={`absolute z-30 transition-shadow ${isSelected && selectedDoctorName ? 'border-[1.5px] border-dashed border-indigo-500 rounded-xl p-2 bg-white/5' : ''}`}
        style={{
          left: doctorNamePos.x + '%',
          top: doctorNamePos.y + '%',
          transform: 'translate(-50%, -50%)',
          cursor: isSelected ? 'grab' : 'default',
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'doctorName', 'global-name', containerRef.current, doctorNamePos)}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('doctorName', 'global-name'); }}
      >
        <span className="font-black tracking-tighter uppercase whitespace-nowrap" style={{ color: headerColor, fontSize: headerFontSize + 'px' }}>
          {doctor?.name || 'Dra. Mariel Herrera'}
        </span>
      </div>

      {/* Divider Section */}
      <div 
        className={`absolute z-30 transition-shadow ${isSelected && canvas.selectedDivider ? 'border-[1.5px] border-dashed border-indigo-500 p-2 bg-white/5' : ''}`}
        style={{
          left: dividerPos.x + '%',
          top: dividerPos.y + '%',
          width: dividerWidth + '%',
          transform: 'translate(-50%, -50%)',
          cursor: isSelected ? 'grab' : 'default',
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'divider', 'global-divider', containerRef.current, dividerPos)}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('divider', 'global-divider'); }}
      >
        <div 
          style={{ 
            height: dividerHeight + 'px', 
            backgroundColor: dividerColor,
            width: '100%'
          }} 
        />
      </div>

      {/* Content Section */}
      <div 
        className={`absolute z-10 transition-shadow pointer-events-auto w-[calc(100%-4rem)] px-4 ${isSelected && selectedContentIndex === index ? 'border-[1.5px] border-dashed border-indigo-500 rounded-2xl p-4 bg-white/10 backdrop-blur-sm' : ''}`}
        style={{
          left: (contentPositions[index]?.x ?? 50) + '%',
          top: (contentPositions[index]?.y ?? 60) + '%',
          transform: `translate(-50%, -50%) rotate(${contentRotations[index] || 0}deg)`,
          cursor: isSelected ? 'grab' : 'default',
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'content', index, containerRef.current, contentPositions[index] || { x: 50, y: 60 })}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('content', index); }}
      >
        <div className="text-center relative">
          <h4 className="font-black mb-3 uppercase leading-tight" style={{ fontSize: titleFontSize + 'px', color: titleColor }}>{slide.title}</h4>
          <div className="h-1 w-12 bg-indigo-600/30 mb-3 rounded-full mx-auto"></div>
          <p className="font-bold leading-relaxed whitespace-pre-wrap" style={{ fontSize: fontSize + 'px', color: contentColor }}>{slide.content}</p>
        </div>
      </div>
      
      {/* Images Layer */}
      {slide.customImages?.map((img, imgIdx) => {
        const imgId = `${index}-${imgIdx}`;
        const pos = imagePositions[imgId] || { x: 50, y: 70 };
        const size = imageSizes[imgId] || 100;
        const rot = imageRotations[imgId] || 0;
        
        return (
          <div
            key={imgId}
            className={`absolute z-20 transition-shadow ${isSelected && selectedImageId === imgId ? 'border-[2px] border-indigo-500 ring-4 ring-indigo-500/20 shadow-xl' : ''}`}
            style={{
              left: pos.x + '%',
              top: pos.y + '%',
              width: size + 'px',
              height: size + 'px',
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              cursor: isSelected ? 'grab' : 'default',
              borderRadius: imageBorderRadius,
              overflow: 'hidden'
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'image', imgId, containerRef.current, pos)}
            onClick={(e) => { e.stopPropagation(); isSelected && selectElement('image', imgId); }}
          >
            <img src={img} alt="Custom" className="w-full h-full object-contain" style={{ borderRadius: imageBorderRadius }} />
            
            {isSelected && selectedImageId === imgId && (
              <>
                {/* Rotate */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-indigo-500 flex items-center justify-center cursor-alias text-indigo-600 z-50 hover:scale-110 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'image', imgId, containerRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}><FiRefreshCw size={14}/></div>
                
                {/* Resize */}
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-50 hover:scale-110 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'image', imgId, containerRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}><FiMaximize2 size={14} className="text-white" /></div>

                {/* Delete */}
                <button 
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center z-50 hover:scale-110 transition-transform"
                  onClick={(e) => { e.stopPropagation(); onRemoveImage && onRemoveImage(imgIdx); }}
                >
                  <FiTrash2 size={12} />
                </button>

                {/* Layer Control */}
                <button 
                  className="absolute -bottom-3 -left-3 w-8 h-8 bg-amber-500 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center z-50 hover:scale-110 transition-transform"
                  title="Cambiar Capa (Fondo/Frente)"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentZ = pos.zIndex || 30;
                    handlers.updateImage(imgId, { zIndex: currentZ === 10 ? 30 : 10 });
                  }}
                >
                  <FiLayers size={12} />
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Extra Elements Layer */}
      {(extraElements[index] || []).map((el) => {
        const elId = `${index}-${el.id}`;
        const isElSelected = isSelected && selectedExtraId === elId;
        const IconComp = el.type === 'icon' ? SVGIcons[el.content] : null;

        return (
          <div
            key={elId}
            className={`absolute z-30 transition-all ${isElSelected ? 'border-[2px] border-indigo-500 ring-4 ring-indigo-500/20 bg-white/5' : ''}`}
            style={{
              left: el.x + '%',
              top: el.y + '%',
              transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
              cursor: isSelected ? 'grab' : 'default',
              width: el.width + 'px',
              height: el.height + 'px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'extra', elId, containerRef.current, { x: el.x, y: el.y })}
            onClick={(e) => { e.stopPropagation(); isSelected && selectElement('extra', elId); }}
          >
            {el.type === 'text' ? (
              <div 
                className="font-bold whitespace-nowrap outline-none px-2"
                style={{ 
                  fontSize: (el.height * 0.8) + 'px', 
                  color: el.color,
                  background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2}, ${el.color3})` : 'transparent',
                  WebkitBackgroundClip: el.useGradient ? 'text' : 'initial',
                  WebkitTextFillColor: el.useGradient ? 'transparent' : 'initial',
                  fontWeight: el.bold ? '900' : '500',
                  fontStyle: el.italic ? 'italic' : 'normal'
                }}
              >{el.content}</div>
            ) : (
              <div style={{ width: '100%', height: '100%', color: el.color }} className="flex items-center justify-center p-1">
                {IconComp && <IconComp className="w-full h-full overflow-visible" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} />}
                {el.useGradient && <svg width="0" height="0" className="absolute"><defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="50%" style={{stopColor: el.color2}} /><stop offset="100%" style={{stopColor: el.color3}} /></linearGradient></defs></svg>}
              </div>
            )}

            {isElSelected && (
              <>
                {/* Transform Handles */}
                <div className="absolute -top-4 -left-4 w-7 h-7 bg-white rounded-full shadow-lg border-2 border-indigo-500 flex items-center justify-center cursor-alias text-indigo-600 z-50 hover:scale-110 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}><FiRefreshCw size={12}/></div>
                
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white cursor-ne-resize z-50 shadow-md"
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>

                <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white cursor-se-resize z-50 shadow-lg hover:scale-125 transition-transform flex items-center justify-center" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}><FiMaximize2 size={10} className="text-white" /></div>

                {/* Layer Control */}
                <button 
                  className="absolute -bottom-4 -left-4 w-7 h-7 bg-amber-500 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center z-50 hover:scale-110 transition-transform"
                  title="Cambiar Capa (Fondo/Frente)"
                  onClick={(e) => {
                    e.stopPropagation();
                    canvas.updateExtraElement(index, el.id, { zIndex: el.zIndex === 5 ? 30 : 5 });
                  }}
                >
                  <FiLayers size={12} />
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Watermark Section */}
      {watermark && (
        <div className="absolute bottom-4 left-4 z-40 opacity-30 pointer-events-none">
          <img src={watermark} alt="WM" className="w-12 h-12 object-contain" />
        </div>
      )}

      {isSelected && (
        <div className="absolute bottom-4 right-4 slide-actions z-[60] flex flex-col gap-1 pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); onPreview(index); }} className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 shadow-xl border border-gray-100 transition-all transform hover:scale-110" title="Vista Previa"><FiMaximize2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(index); }} className="p-2 bg-white text-amber-500 rounded-xl hover:bg-amber-50 shadow-xl border border-gray-100 transition-all transform hover:scale-110" title="Editar Contenido"><FiEdit3 size={14}/></button>
          <label className="p-2 bg-white text-indigo-400 rounded-xl hover:bg-indigo-50 shadow-xl border border-gray-100 cursor-pointer transition-all transform hover:scale-110" title="Insertar Imagen">
            <FiPlusCircle size={14} />
            <input type="file" className="hidden" accept="image/*" onChange={onAddImage} />
          </label>
          <button onClick={(e) => { e.stopPropagation(); onCopy(index); }} className="p-2 bg-white text-gray-400 rounded-xl hover:bg-gray-50 shadow-xl border border-gray-100 transition-all transform hover:scale-110" title="Duplicar Diapositiva"><FiCopy size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(index); }} className="p-2 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-xl shadow-xl border border-gray-100 transition-all transform hover:scale-110" title="Eliminar"><FiTrash2 size={14} /></button>
        </div>
      )}
    </div>
  );
};
