
import React from 'react';
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
  handlers = {},
  watermark,
  slideRef,
  onEdit,
  onPreview,
  onCopy,
  onAddImage
}) => {
  const {
    bgColor, bgColor2, bgColor3, useBgGradient,
    fontSize, headerFontSize, titleColor, contentColor, headerColor
  } = design;

  const {
    selectedExtraId, selectedImageId, selectedContentIndex,
    extraElements, selectElement
  } = canvas;

  const {
    imagePositions, imageSizes, imageRotations, imageZIndexes,
    contentPositions, contentRotations
  } = transform;

  const { handleDragStart, handleTransformStart } = handlers;

  const slideId = index + (isExport ? '-export' : '');
  const isSelected = !isPreview && !isExport;

  return (
    <div
      ref={slideRef}
      className={`${isExport ? 'export-slide-item' : 'carousel-slide-item'} rounded-none p-10 flex flex-col relative group shadow-xl overflow-hidden`}
      style={{ 
        background: useBgGradient ? `linear-gradient(to bottom right, ${bgColor}, ${bgColor2}, ${bgColor3})` : bgColor, 
        border: '1px solid #d1d5db', 
        width: '410px', 
        height: '410px',
        position: isExport ? 'relative' : undefined 
      }}
      onClick={() => isSelected && selectElement(null)}
    >
      {watermark && (
        <img src={watermark} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" style={{ opacity: 0.08 }} />
      )}
      
      <div className="flex items-center justify-start gap-3 mb-10 border-b border-gray-100 dark:border-gray-700/50 pb-6 w-full relative z-30">
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden flex-shrink-0">
          {doctorLogo && <img src={doctorLogo} alt="Logo" className="w-full h-full object-contain" />}
        </div>
        <span
          style={{ fontSize: headerFontSize + 'px', color: headerColor }}
          className="font-black uppercase tracking-tight"
        >{doctor?.nombre_completo}</span>
      </div>
      
      {!isPreview && !isExport && (
        <span className="absolute top-20 right-8 text-7xl font-black text-black/5 dark:text-white/5 pointer-events-none">{index + 1}</span>
      )}
      
      {/* Content Layer */}
      <div 
        className={`absolute z-10 transition-shadow pointer-events-auto w-[calc(100%-4rem)] px-4 ${isSelected && selectedContentIndex === index ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-2xl p-4 bg-white/5 backdrop-blur-sm' : ''}`}
        style={{
          left: (contentPositions[index]?.x ?? 50) + '%',
          top: (contentPositions[index]?.y ?? 60) + '%',
          transform: `translate(-50%, -50%) rotate(${contentRotations[index] || 0}deg)`,
          cursor: isSelected ? 'grab' : 'default',
          userSelect: 'none'
        }}
        onMouseDown={(e) => isSelected && handleDragStart(e, index, 'content', index, slideRef.current, contentPositions[index] || { x: 50, y: 60 })}
        onClick={(e) => { e.stopPropagation(); isSelected && selectElement('content', index); }}
      >
        <div className="text-center relative">
          <h4 className="font-black mb-3 uppercase leading-tight" style={{ fontSize: (fontSize + 4) + 'px', color: titleColor }}>{slide.title}</h4>
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
            className={`absolute z-20 transition-shadow ${isSelected && selectedImageId === imgId ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-xl' : ''}`}
            style={{
              left: pos.x + '%',
              top: pos.y + '%',
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              zIndex: imageZIndexes[imgId] || 20,
              cursor: isSelected ? 'grab' : 'default',
              userSelect: 'none'
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'image', imgId, slideRef.current, pos)}
            onClick={(e) => { e.stopPropagation(); isSelected && selectElement('image', imgId); }}
          >
            <div className="relative group/img">
              <img
                src={img}
                className="rounded-xl shadow-md border-2 border-white/50 object-cover pointer-events-none"
                style={{ width: size + 'px', height: size + 'px' }}
                alt=""
              />
              
              {isSelected && selectedImageId === imgId && (
                <>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center cursor-alias text-[12px] text-gray-500 hover:text-indigo-600 z-30"
                    onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'image', imgId, slideRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}
                  >↻</div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'image', imgId, slideRef.current, { x: pos.x, y: pos.y, width: size, height: size, rotation: rot })}
                  ></div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Extra Elements Layer */}
      {extraElements[index]?.map((el) => {
        const elId = `${index}-${el.id}`;
        const isElSelected = isSelected && selectedExtraId === elId;
        const IconComp = el.type === 'shape' ? SVGIcons[el.content] : null;

        return (
          <div
            key={el.id}
            className={`absolute z-[30] transition-shadow ${isElSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
            style={{
              left: el.x + '%',
              top: el.y + '%',
              transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
              zIndex: el.zIndex || 30,
              cursor: isSelected ? 'grab' : 'default',
              userSelect: 'none'
            }}
            onMouseDown={(e) => isSelected && handleDragStart(e, index, 'extra', elId, slideRef.current, { x: el.x, y: el.y })}
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
                  WebkitTextFillColor: el.useGradient ? 'transparent' : 'initial'
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
                  onMouseDown={(e) => handleTransformStart(e, index, 'rotate', 'extra', elId, slideRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}>↻</div>
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-8 bg-indigo-600 rounded-full cursor-ew-resize z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize-w', 'extra', elId, slideRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-indigo-600 rounded-full cursor-ns-resize z-40" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize-h', 'extra', elId, slideRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-se-resize z-40 hover:scale-125 transition-transform" 
                  onMouseDown={(e) => handleTransformStart(e, index, 'resize', 'extra', elId, slideRef.current, { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation })}></div>
              </>
            )}
          </div>
        );
      })}

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
          </div>
        </div>
      )}
    </div>
  );
};
