import { useState, useCallback, useRef } from 'react';

export const useDragTransform = (onUpdateElement, scale = 1, globalSetters = {}) => {
  const [imagePositions, setImagePositions] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageRotations, setImageRotations] = useState({});
  const [contentPositions, setContentPositions] = useState({});
  const [contentRotations, setContentRotations] = useState({});
  const [extraElements, setExtraElements] = useState({});

  const state = {
    imagePositions, imageSizes, imageRotations,
    contentPositions, contentRotations,
    extraElements
  };

  const draggingRef = useRef(null);
  const rafRef = useRef(null);

  const handleDragStart = (e, index, type, id, container, initialPos) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = container.getBoundingClientRect();

    draggingRef.current = {
      type, id, index,
      startX, startY,
      initialX: initialPos.x,
      initialY: initialPos.y,
      rect
    };

    const handleMouseMove = (moveEvent) => {
      if (!draggingRef.current) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const { type, id, index, startX, startY, initialX, initialY, rect } = draggingRef.current;
        const dx = (moveEvent.clientX - startX) / scale;
        const dy = (moveEvent.clientY - startY) / scale;

        const newX = initialX + (dx / rect.width) * 100 * scale;
        const newY = initialY + (dy / rect.height) * 100 * scale;

        if (type === 'image') {
          setImagePositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
        } else if (type === 'content') {
          setContentPositions(prev => ({ ...prev, [index]: { x: newX, y: newY } }));
        } else if (type === 'logo') {
          globalSetters.setLogoPos({ x: newX, y: newY });
        } else if (type === 'doctorName') {
          globalSetters.setDoctorNamePos({ x: newX, y: newY });
        } else if (type === 'divider') {
          globalSetters.setDividerPos({ x: newX, y: newY });
        } else if (type === 'extra') {
          const [sIdx, elId] = id.split('-');
          onUpdateElement(parseInt(sIdx), elId, { x: newX, y: newY });
        }
      });
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTransformStart = (e, index, action, type, id, container, initialData) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = container.getBoundingClientRect();

    const transformData = {
      action, type, id, index,
      startX, startY,
      ...initialData,
      rect
    };

    const handleMouseMove = (moveEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const dx = (moveEvent.clientX - startX) / scale;
        const dy = (moveEvent.clientY - startY) / scale;

        if (action === 'rotate') {
          const centerX = rect.left + (transformData.x / 100) * rect.width;
          const centerY = rect.top + (transformData.y / 100) * rect.height;
          const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
          const newRotation = angle + 90;

          if (type === 'image') setImageRotations(prev => ({ ...prev, [id]: newRotation }));
          else if (type === 'content') setContentRotations(prev => ({ ...prev, [index]: newRotation }));
          else if (type === 'extra') {
            const [sIdx, elId] = id.split('-');
            onUpdateElement(parseInt(sIdx), elId, { rotation: newRotation });
          }
        } else if (action === 'resize' || action === 'resize-w' || action === 'resize-h') {
          const newWidth = Math.max(10, transformData.width + dx * 2);
          const newHeight = Math.max(10, transformData.height + dy * 2);

          if (type === 'image') setImageSizes(prev => ({ ...prev, [id]: newWidth }));
          else if (type === 'extra') {
            const [sIdx, elId] = id.split('-');
            const updates = {};
            if (action === 'resize' || action === 'resize-w') updates.width = newWidth;
            if (action === 'resize' || action === 'resize-h') updates.height = newHeight;
            onUpdateElement(parseInt(sIdx), elId, updates);
          }
        }
      });
    };

    const handleMouseUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return {
    state,
    handlers: {
      handleDragStart,
      handleTransformStart,
      updateImage: (id, updates) => setImagePositions(prev => ({ ...prev, [id]: { ...(prev[id] || { x: 50, y: 70 }), ...updates } }))
    }
  };
};
