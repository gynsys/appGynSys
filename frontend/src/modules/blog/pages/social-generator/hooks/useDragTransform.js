
import { useState, useEffect } from 'react';

export const useDragTransform = (updateExtraElement, scale = 1) => {
  const [dragging, setDragging] = useState(null);
  const [transformState, setTransformState] = useState(null);
  
  // Internal state for non-extra elements (images and main content)
  const [imagePositions, setImagePositions] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageRotations, setImageRotations] = useState({});
  const [imageZIndexes, setImageZIndexes] = useState({});
  const [contentPositions, setContentPositions] = useState({});
  const [contentRotations, setContentRotations] = useState({});

  // Global Template State
  const [brandingPos, setBrandingPos] = useState({ x: 50, y: 12 });
  const [dividerPos, setDividerPos] = useState({ x: 50, y: 22 });
  const [dividerColor, setDividerColor] = useState('#e5e7eb');
  const [dividerHeight, setDividerHeight] = useState(2);
  const [dividerWidth, setDividerWidth] = useState(80);

  const handleDragStart = (e, slideIndex, type, id, domElement, initialPos) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      type,
      slideIndex,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: initialPos.x,
      initialY: initialPos.y,
      rect: domElement.getBoundingClientRect()
    });
  };

  const handleTransformStart = (e, slideIndex, transformType, elementType, id, domElement, initialTransform) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = domElement.getBoundingClientRect();
    
    setTransformState({
      transformType,
      elementType,
      slideIndex,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: initialTransform.width,
      initialHeight: initialTransform.height,
      initialRotation: initialTransform.rotation,
      initialX: initialTransform.x,
      initialY: initialTransform.y,
      rect,
      centerX: rect.left + (initialTransform.x / 100) * rect.width,
      centerY: rect.top + (initialTransform.y / 100) * rect.height
    });
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragging) {
        const { type, slideIndex, id, startX, startY, initialX, initialY, rect } = dragging;
        
        // Calculate delta in pixels adjusted by scale
        const dxPixels = (e.clientX - startX) / scale;
        const dyPixels = (e.clientY - startY) / scale;
        
        // Convert pixel delta to percentage delta (canvas is 410px wide/high)
        const dxPct = (dxPixels / 410) * 100;
        const dyPct = (dyPixels / 410) * 100;
        
        const newX = Math.min(100, Math.max(0, initialX + dxPct));
        const newY = Math.min(100, Math.max(0, initialY + dyPct));
        
        if (type === 'image') {
          setImagePositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
        } else if (type === 'content') {
          setContentPositions(prev => ({ ...prev, [slideIndex]: { x: newX, y: newY } }));
        } else if (type === 'extra') {
          updateExtraElement(slideIndex, id.split('-')[1], { x: newX, y: newY });
        } else if (type === 'branding') {
          setBrandingPos({ x: newX, y: newY });
        } else if (type === 'divider') {
          setDividerPos({ x: newX, y: newY });
        }
      } else if (transformState) {
        const { transformType, elementType, slideIndex, id, startX, startY, initialWidth, initialHeight, initialRotation, initialX, initialY, centerX, centerY, rect } = transformState;
        const extraId = id.includes('-') ? id.split('-')[1] : id;

        // Delta in pixels adjusted by scale
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;

        if (transformType === 'resize') {
          // Uniform resize (width = height)
          const newSize = Math.max(elementType === 'image' ? 50 : 10, initialWidth + dx);
          if (elementType === 'image') setImageSizes(prev => ({ ...prev, [id]: newSize }));
          else updateExtraElement(slideIndex, extraId, { width: newSize, height: newSize });
        } else if (transformType === 'resize-w') {
          updateExtraElement(slideIndex, extraId, { width: Math.max(10, initialWidth + dx) });
        } else if (transformType === 'resize-h') {
          updateExtraElement(slideIndex, extraId, { height: Math.max(10, initialHeight + dy) });
        } else if (transformType === 'rotate') {
          const startAngle = Math.atan2(startY - centerY, startX - centerX);
          const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
          
          const newRot = initialRotation + angleDiff;
          
          if (elementType === 'image') setImageRotations(prev => ({ ...prev, [id]: newRot }));
          else if (elementType === 'content') setContentRotations(prev => ({ ...prev, [slideIndex]: newRot }));
          else updateExtraElement(slideIndex, extraId, { rotation: newRot });
        }
      }
    };

    const handlePointerUp = () => {
      setDragging(null);
      setTransformState(null);
    };
    
    if (dragging || transformState) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [dragging, transformState, updateExtraElement, scale]);

  return {
    handlers: { handleDragStart, handleTransformStart },
    state: { 
      imagePositions, setImagePositions,
      imageSizes, setImageSizes,
      imageRotations, setImageRotations,
      imageZIndexes, setImageZIndexes,
      contentPositions, setContentPositions,
      contentRotations, setContentRotations,
      brandingPos, setBrandingPos,
      dividerPos, setDividerPos,
      dividerColor, setDividerColor,
      dividerHeight, setDividerHeight,
      dividerWidth, setDividerWidth
    }
  };
};
