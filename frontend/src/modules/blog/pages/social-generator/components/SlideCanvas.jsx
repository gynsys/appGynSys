import React, { useRef } from 'react';
import { FiMaximize2, FiEdit3, FiPlusCircle, FiCopy, FiCheck, FiTrash2, FiLayers } from 'react-icons/fi';
import { SVGIcons } from '../lib/svgIcons';

export const SlideCanvas = ({
  slide,
  index,
  isPreview,
  isExport,
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
  onAddImage
}) => {
  const containerRef = useRef(null);
  const isSelected = !isPreview && !isExport && canvas.currentSlidePage === index;
  
  const { 
    imagePositions, imageSizes, imageRotations, 
    contentPositions, contentRotations 
  } = transform;

  const { 
    fontSize, titleFontSize, titleColor, contentColor, headerColor, headerFontSize,
    brandingPos, dividerPos, dividerColor, dividerHeight, dividerWidth
  } = design;

  const {
    extraElements, selectElement, selectedExtraId, selectedImageId, selectedContentIndex
  } = canvas;

  const { handleDragStart, handleTransformStart } = handlers;

  return (
    <div 
      ref={containerRef}
      className={`relative w-[410px] h-[410px] overflow-hidden shadow-2xl transition-all duration-500 ${isExport ? '' : 'rounded-[40px]'}`}
      style={{ 
        background: design.useBgGradient 
          ? `linear-gradient(to bottom right, ${design.bgColor}, ${design.bgColor2}, ${design.bgColor3})` 
          : design.bgColor,
      }}
      onClick={() => isSelected && selectElement(null, null)}
    >
      {/* Branding Section */}
      <div 
        className={`absolute z-30 transition-shadow ${isSelected && canvas.selectedBranding ? 'border-[1.5px] border-dashed border-indigo-500 rounded-xl p-2' : ''}`}
        style={{
          left: canvas.brandingPos.x + '%',
          top: canvas.brandingPos.y + '%',
          transform: 'translate(-50%, -50%)',
          cursor: isSelected ? 'grab' : 'default',
          userSelect: 'none'
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'branding', 'global-brand', containerRef.current, canvas.brandingPos)}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('branding', 'global-brand'); }}
      >
        <div className="flex items-center gap-3">
          {doctorLogo && <img src={doctorLogo} alt="Logo" className="w-8 h-8 object-contain" />}
          <span className="font-black tracking-tighter uppercase" style={{ color: headerColor, fontSize: headerFontSize + 'px' }}>
            {doctor?.name || 'Dra. Mariel Herrera'}
          </span>
        </div>
      </div>

      {/* Divider Section */}
      <div 
        className={`absolute z-30 transition-shadow ${isSelected && canvas.selectedDivider ? 'border-[1.5px] border-dashed border-indigo-500 p-2' : ''}`}
        style={{
          left: canvas.dividerPos.x + '%',
          top: canvas.dividerPos.y + '%',
          width: canvas.dividerWidth + '%',
          transform: 'translate(-50%, -50%)',
          cursor: isSelected ? 'grab' : 'default',
          userSelect: 'none'
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'divider', 'global-divider', containerRef.current, canvas.dividerPos)}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('divider', 'global-divider'); }}
      >
        <div 
          style={{ 
            height: canvas.dividerHeight + 'px', 
            backgroundColor: canvas.dividerColor,
            width: '100%'
          }} 
        />
      </div>

      {/* Content Section */}
      <div 
        className={`absolute z-10 transition-shadow pointer-events-auto w-[calc(100%-4rem)] px-4 ${isSelected && selectedContentIndex === index ? 'border-[1.5px] border-dashed border-indigo-500 rounded-2xl p-4 bg-white/5 backdrop-blur-sm' : ''}`}
        style={{
          left: (contentPositions[index]?.x ?? 50) + '%',
          top: (contentPositions[index]?.y ?? 60) + '%',
          transform: `translate(-50%, -50%) rotate(${contentRotations[index] || 0}deg)`,
          cursor: isSelected ? 'grab' : 'default',
          userSelect: 'none'
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
            className={`absolute z-20 transition-shadow ${isSelected && selectedImageId === imgId ? 'border-[1.5px] border-dashed border-indigo-500 rounded-xl' : ''}`}
            style={{
              left: pos.x + '%',
              top: pos.y + '%',
              width: size + 'px',
              height: size + 'px',
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              cursor: isSelected ? 'grab' : 'default',
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'image', imgId, containerRef.current, pos)}
            onClick={(e) => { e.stopPropagation(); isSelected && selectElement('image', imgId); }}
          >
            <img src={img} alt="Custom" className="w-full h-full object-cover rounded-xl" />
            
            {isSelected && selectedImageId === imgId && (
              <>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-alias text-[10px] z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'image', imgId, containerRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}>↻</div>
                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'image', imgId, containerRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}></div>
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
            className={`absolute z-30 transition-shadow ${isElSelected ? 'border-[1.5px] border-dashed border-indigo-500 p-2' : ''}`}
            style={{
              left: el.x + '%',
              top: el.y + '%',
              transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
              cursor: isSelected ? 'grab' : 'default',
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'extra', elId, containerRef.current, { x: el.x, y: el.y })}
            onClick={(e) => { e.stopPropagation(); isSelected && selectElement('extra', elId); }}
          >
            {el.type === 'text' ? (
              <div 
                className="font-bold whitespace-nowrap outline-none"
                style={{ 
                  fontSize: (el.width/5) + 'px', 
                  color: el.color,
                  background: el.useGradient ? `linear-gradient(${el.gradientDir}, ${el.color}, ${el.color2}, ${el.color3})` : 'transparent',
                  WebkitBackgroundClip: el.useGradient ? 'text' : 'initial',
                  WebkitTextFillColor: el.useGradient ? 'transparent' : 'initial',
                  fontWeight: el.bold ? '900' : 'bold'
                }}
              >{el.content}</div>
            ) : (
              <div style={{ width: el.width + 'px', height: el.height + 'px', color: el.color }} className="pointer-events-none">
                {IconComp && <IconComp className="w-full h-full overflow-visible pointer-events-none" fill={el.useGradient ? `url(#grad-${elId}-${isExport ? 'exp' : 'reg'})` : 'currentColor'} />}
                {el.useGradient && <svg width="0" height="0" className="absolute"><defs><linearGradient id={`grad-${elId}-${isExport ? 'exp' : 'reg'}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: el.color}} /><stop offset="50%" style={{stopColor: el.color2}} /><stop offset="100%" style={{stopColor: el.color3}} /></linearGradient></defs></svg>}
              </div>
            )}

            {isElSelected && (
              <>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-alias text-[10px] z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}>↻</div>
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-full cursor-ew-resize z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize-w', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
                <div className="absolute bottom-1/2 -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-indigo-600 rounded-full cursor-ns-resize z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize-h', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'extra', elId, containerRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
                
                <button 
                  className="absolute -bottom-2 -left-2 w-6 h-6 bg-amber-500 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center z-40 hover:scale-125 transition-transform"
                  title="Enviar al fondo"
                  onClick={(e) => {
                    e.stopPropagation();
                    canvas.updateExtraElement(index, el.id, { zIndex: el.zIndex === 5 ? 30 : 5 });
                  }}
                >
                  <FiLayers size={10} />
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
        <div className="absolute bottom-4 right-4 slide-actions z-30 flex gap-1 pointer-events-auto">
          <div className="flex flex-col gap-1">
            <button onClick={(e) => { e.stopPropagation(); onPreview(index); }} className="p-1.5 bg-white/80 text-indigo-600 rounded-lg hover:bg-white shadow-sm" title="Vista Previa"><FiMaximize2 size={12}/></button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(index); }} className="p-1.5 bg-white/80 text-amber-500 rounded-lg hover:bg-white shadow-sm" title="Editar"><FiEdit3 size={12}/></button>
            <label className="p-1.5 bg-white/80 text-indigo-400 rounded-lg hover:bg-white shadow-sm cursor-pointer" title="Añadir Imagen">
              <FiPlusCircle size={12} />
              <input type="file" className="hidden" accept="image/*" onChange={onAddImage} />
            </label>
            <button onClick={(e) => { e.stopPropagation(); onCopy(index); }} className="p-1.5 bg-white/80 text-gray-400 rounded-lg hover:bg-white shadow-sm" title="Copiar"><FiCopy size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(index); }} className="p-1.5 bg-white/80 text-red-400 hover:bg-red-500 hover:text-white rounded-lg shadow-sm transition-all" title="Eliminar"><FiTrash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
