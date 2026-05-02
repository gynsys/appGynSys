
import { useState, useEffect } from 'react';
import { DEFAULT_DESIGN } from '../lib/constants';

export const useSlideDesigner = () => {
  const [bgColor, setBgColor] = useState(DEFAULT_DESIGN.bgColor);
  const [bgColor2, setBgColor2] = useState(DEFAULT_DESIGN.bgColor2);
  const [bgColor3, setBgColor3] = useState(DEFAULT_DESIGN.bgColor3);
  const [useBgGradient, setUseBgGradient] = useState(DEFAULT_DESIGN.useBgGradient);
  
  const [fontSize, setFontSize] = useState(DEFAULT_DESIGN.fontSize);
  const [headerFontSize, setHeaderFontSize] = useState(DEFAULT_DESIGN.headerFontSize);
  
  const [titleColor, setTitleColor] = useState(DEFAULT_DESIGN.titleColor);
  const [contentColor, setContentColor] = useState(DEFAULT_DESIGN.contentColor);
  const [headerColor, setHeaderColor] = useState(DEFAULT_DESIGN.headerColor);
  
  const [extraElements, setExtraElements] = useState({});
  const [currentSlidePage, setCurrentSlidePage] = useState(0);
  const [selectedExtraId, setSelectedExtraId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(null);

  const addExtraElement = (slideIndex, type, content = '') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newElement = {
      id,
      type,
      content: content || (type === 'text' ? 'Nuevo Texto' : 'arrow'),
      x: 50,
      y: 30,
      width: type === 'text' ? 100 : 60,
      height: type === 'text' ? 40 : 60,
      rotation: 0,
      color: type === 'text' ? contentColor : titleColor,
      color2: '#4f46e5',
      color3: '#9333ea',
      useGradient: false,
      gradientDir: 'to bottom right',
      zIndex: 30
    };
    
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || [];
      return { ...prev, [slideIndex]: [...slideElements, newElement] };
    });
    setSelectedExtraId(`${slideIndex}-${id}`);
  };

  const updateExtraElement = (slideIndex, elementId, updates) => {
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || [];
      const newElements = slideElements.map(el => el.id === elementId ? { ...el, ...updates } : el);
      return { ...prev, [slideIndex]: newElements };
    });
  };

  const removeExtraElement = (slideIndex, elementId) => {
    setExtraElements(prev => {
      const slideElements = prev[slideIndex] || [];
      const newElements = slideElements.filter(el => el.id !== elementId);
      return { ...prev, [slideIndex]: newElements };
    });
    setSelectedExtraId(null);
  };

  const selectElement = (type, id) => {
    if (type === 'image') {
      setSelectedImageId(id);
      setSelectedContentIndex(null);
      setSelectedExtraId(null);
    } else if (type === 'content') {
      setSelectedContentIndex(id);
      setSelectedImageId(null);
      setSelectedExtraId(null);
    } else if (type === 'extra') {
      setSelectedExtraId(id);
      setSelectedImageId(null);
      setSelectedContentIndex(null);
    } else {
      setSelectedImageId(null);
      setSelectedContentIndex(null);
      setSelectedExtraId(null);
    }
  };

  return {
    design: {
      bgColor, setBgColor,
      bgColor2, setBgColor2,
      bgColor3, setBgColor3,
      useBgGradient, setUseBgGradient,
      fontSize, setFontSize,
      headerFontSize, setHeaderFontSize,
      titleColor, setTitleColor,
      contentColor, setContentColor,
      headerColor, setHeaderColor,
    },
    canvas: {
      extraElements, setExtraElements,
      currentSlidePage, setCurrentSlidePage,
      selectedExtraId, setSelectedExtraId,
      selectedImageId, setSelectedImageId,
      selectedContentIndex, setSelectedContentIndex,
      addExtraElement,
      updateExtraElement,
      removeExtraElement,
      selectElement
    }
  };
};
