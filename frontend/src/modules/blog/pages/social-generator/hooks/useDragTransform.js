
import { useState, useEffect } from 'react';

export const useDragTransform = (updateExtraElement) => {
  const [dragging, setDragging] = useState(null);
  const [transformState, setTransformState] = useState(null);
  const [imagePositions, setImagePositions] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageRotations, setImageRotations] = useState({});
  const [imageZIndexes, setImageZIndexes] = useState({});
  const [contentPositions, setContentPositions] = useState({});
  const [contentRotations, setContentRotations] = useState({});

  const handleDragStart = (e, slideIndex, type, id, domElement, initialPos) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = domElement.getBoundingClientRect();
    
    setDragging({
      type,
      slideIndex,
      id,
      offsetX: e.clientX - rect.left - (initialPos.x / 100) * rect.width,
      offsetY: e.clientY - rect.top - (initialPos.y / 100) * rect.height,
      rect
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
      rect,
      centerX: rect.left + (initialTransform.x / 100) * rect.width,
      centerY: rect.top + (initialTransform.y / 100) * rect.height
    });
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragging) {
        const { type, slideIndex, id, rect, offsetX, offsetY } = dragging;
        const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left - offsetX) / rect.width) * 100));
        const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top - offsetY) / rect.height) * 100));
        
        if (type === 'image') {
          setImagePositions(prev => ({ ...prev, [id]: { x: xPct, y: yPct } }));
        } else if (type === 'content') {
          setContentPositions(prev => ({ ...prev, [slideIndex]: { x: xPct, y: yPct } }));
        } else if (type === 'extra') {
          updateExtraElement(slideIndex, id.split('-')[1], { x: xPct, y: yPct });
        }
      } else if (transformState) {
        const { transformType, elementType, slideIndex, id, startX, startY, initialWidth, initialHeight, initialRotation, centerX, centerY } = transformState;
        const extraId = id.includes('-') ? id.split('-')[1] : id;

        if (transformType === 'resize') {
          const deltaX = e.clientX - startX;
          const newSize = Math.max(elementType === 'image' ? 50 : 10, initialWidth + deltaX);
          if (elementType === 'image') setImageSizes(prev => ({ ...prev, [id]: newSize }));
          else updateExtraElement(slideIndex, extraId, { width: newSize, height: newSize });
        } else if (transformType === 'resize-w') {
          const deltaX = e.clientX - startX;
          updateExtraElement(slideIndex, extraId, { width: Math.max(10, initialWidth + deltaX) });
        } else if (transformType === 'resize-h') {
          const deltaY = e.clientY - startY;
          updateExtraElement(slideIndex, extraId, { height: Math.max(10, initialHeight + deltaY) });
        } else if (transformType === 'rotate') {
          const startAngle = Math.atan2(startY - centerY, startX - centerX);
          const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
          
          if (elementType === 'image') setImageRotations(prev => ({ ...prev, [id]: initialRotation + angleDiff }));
          else if (elementType === 'content') setContentRotations(prev => ({ ...prev, [slideIndex]: initialRotation + angleDiff }));
          else updateExtraElement(slideIndex, extraId, { rotation: initialRotation + angleDiff });
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
  }, [dragging, transformState, updateExtraElement]);

  return {
    handlers: { handleDragStart, handleTransformStart },
    state: { 
      imagePositions, setImagePositions,
      imageSizes, setImageSizes,
      imageRotations, setImageRotations,
      imageZIndexes, setImageZIndexes,
      contentPositions, setContentPositions,
      contentRotations, setContentRotations
    }
  };
};
