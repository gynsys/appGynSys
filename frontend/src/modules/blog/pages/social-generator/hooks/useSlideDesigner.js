import { useState, useEffect } from 'react';
import { DEFAULT_DESIGN } from '../lib/constants';

const TEMPLATE_STORAGE_KEY = 'gynsys_carousel_templates';
const PROJECT_STORAGE_KEY = 'gynsys_carousel_projects';

export const useSlideDesigner = () => {
  // Colors & General Design
  const [bgColor, setBgColor] = useState(DEFAULT_DESIGN.bgColor);
  const [bgColor2, setBgColor2] = useState(DEFAULT_DESIGN.bgColor2);
  const [bgColor3, setBgColor3] = useState(DEFAULT_DESIGN.bgColor3);
  const [useBgGradient, setUseBgGradient] = useState(DEFAULT_DESIGN.useBgGradient);
  const [fontSize, setFontSize] = useState(DEFAULT_DESIGN.fontSize);
  const [titleFontSize, setTitleFontSize] = useState(24);
  const [headerFontSize, setHeaderFontSize] = useState(DEFAULT_DESIGN.headerFontSize);
  const [titleColor, setTitleColor] = useState(DEFAULT_DESIGN.titleColor);
  const [contentColor, setContentColor] = useState(DEFAULT_DESIGN.contentColor);
  const [headerColor, setHeaderColor] = useState(DEFAULT_DESIGN.headerColor);

  // Global Template Settings (Branding & Divider)
  const [brandingPos, setBrandingPos] = useState({ x: 50, y: 12 });
  const [dividerPos, setDividerPos] = useState({ x: 50, y: 22 });
  const [dividerColor, setDividerColor] = useState('#e5e7eb');
  const [dividerHeight, setDividerHeight] = useState(2);
  const [dividerWidth, setDividerWidth] = useState(80);
  
  // Elements & Selection
  const [extraElements, setExtraElements] = useState({});
  const [currentSlidePage, setCurrentSlidePage] = useState(0);
  const [selectedExtraId, setSelectedExtraId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(null);
  const [selectedBranding, setSelectedBranding] = useState(false);
  const [selectedDivider, setSelectedDivider] = useState(false);

  // Custom Templates Management
  const [customTemplates, setCustomTemplates] = useState(() => {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Projects Management
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const saveCustomTemplate = (name) => {
    if (!name) return;
    const newTemplate = {
      id: Date.now(),
      name,
      design: {
        bgColor, bgColor2, bgColor3, useBgGradient,
        fontSize, titleFontSize, headerFontSize,
        titleColor, contentColor, headerColor
      },
      global: {
        brandingPos, dividerPos, dividerColor, dividerHeight, dividerWidth
      },
      elements: extraElements[currentSlidePage] || []
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteTemplate = (id) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
  };

  const applyCustomTemplate = (template, totalSlides) => {
    if (!template) return;
    const { design, global, elements } = template;
    setBgColor(design.bgColor);
    setBgColor2(design.bgColor2);
    setBgColor3(design.bgColor3);
    setUseBgGradient(design.useBgGradient);
    setFontSize(design.fontSize);
    setTitleFontSize(design.titleFontSize || 24);
    setHeaderFontSize(design.headerFontSize);
    setTitleColor(design.titleColor);
    setContentColor(design.contentColor);
    setHeaderColor(design.headerColor);
    setBrandingPos(global.brandingPos);
    setDividerPos(global.dividerPos);
    setDividerColor(global.dividerColor);
    setDividerHeight(global.dividerHeight);
    setDividerWidth(global.dividerWidth);
    const newExtraElements = {};
    for (let i = 0; i < totalSlides; i++) {
      newExtraElements[i] = elements.map(el => ({ ...el, id: Math.random().toString(36).substr(2, 9) }));
    }
    setExtraElements(newExtraElements);
  };

  const saveProject = (name, generatedContent) => {
    if (!name || !generatedContent) return;
    const newProject = {
      id: Date.now(),
      name,
      content: generatedContent,
      design: {
        bgColor, bgColor2, bgColor3, useBgGradient,
        fontSize, titleFontSize, headerFontSize,
        titleColor, contentColor, headerColor
      },
      global: {
        brandingPos, dividerPos, dividerColor, dividerHeight, dividerWidth
      },
      elements: extraElements
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updated));
  };

  const loadProject = (project) => {
    if (!project) return null;
    const { design, global, elements, content } = project;
    setBgColor(design.bgColor);
    setBgColor2(design.bgColor2);
    setBgColor3(design.bgColor3);
    setUseBgGradient(design.useBgGradient);
    setFontSize(design.fontSize);
    setTitleFontSize(design.titleFontSize || 24);
    setHeaderFontSize(design.headerFontSize);
    setTitleColor(design.titleColor);
    setContentColor(design.contentColor);
    setHeaderColor(design.headerColor);
    setBrandingPos(global.brandingPos);
    setDividerPos(global.dividerPos);
    setDividerColor(global.dividerColor);
    setDividerHeight(global.dividerHeight);
    setDividerWidth(global.dividerWidth);
    setExtraElements(elements);
    setCurrentSlidePage(0);
    return content;
  };

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
      setSelectedBranding(false);
      setSelectedDivider(false);
    } else if (type === 'content') {
      setSelectedContentIndex(id);
      setSelectedImageId(null);
      setSelectedExtraId(null);
      setSelectedBranding(false);
      setSelectedDivider(false);
    } else if (type === 'extra') {
      setSelectedExtraId(id);
      setSelectedImageId(null);
      setSelectedContentIndex(null);
      setSelectedBranding(false);
      setSelectedDivider(false);
    } else if (type === 'branding') {
      setSelectedBranding(true);
      setSelectedDivider(false);
      setSelectedExtraId(null);
      setSelectedImageId(null);
      setSelectedContentIndex(null);
    } else if (type === 'divider') {
      setSelectedDivider(true);
      setSelectedBranding(false);
      setSelectedDivider(false);
      setSelectedExtraId(null);
      setSelectedImageId(null);
      setSelectedContentIndex(null);
    } else {
      setSelectedImageId(null);
      setSelectedContentIndex(null);
      setSelectedExtraId(null);
      setSelectedBranding(false);
      setSelectedDivider(false);
    }
  };

  const applyTemplateToAll = (totalSlides) => {
    const currentElements = extraElements[currentSlidePage] || [];
    const newExtraElements = {};
    for (let i = 0; i < totalSlides; i++) {
      newExtraElements[i] = currentElements.map(el => ({ ...el, id: Math.random().toString(36).substr(2, 9) }));
    }
    setExtraElements(newExtraElements);
  };

  return {
    design: {
      bgColor, setBgColor,
      bgColor2, setBgColor2,
      bgColor3, setBgColor3,
      useBgGradient, setUseBgGradient,
      fontSize, setFontSize,
      titleFontSize, setTitleFontSize,
      headerFontSize, setHeaderFontSize,
      titleColor, setTitleColor,
      contentColor, setContentColor,
      headerColor, setHeaderColor,
      brandingPos, setBrandingPos,
      dividerPos, setDividerPos,
      dividerColor, setDividerColor,
      dividerHeight, setDividerHeight,
      dividerWidth, setDividerWidth
    },
    canvas: {
      extraElements, setExtraElements,
      currentSlidePage, setCurrentSlidePage,
      selectedExtraId, setSelectedExtraId,
      selectedImageId, setSelectedImageId,
      selectedContentIndex, setSelectedContentIndex,
      selectedBranding,
      selectedDivider,
      brandingPos,
      dividerPos,
      dividerColor,
      dividerHeight,
      dividerWidth,
      addExtraElement,
      updateExtraElement,
      removeExtraElement,
      selectElement,
      applyTemplateToAll,
      customTemplates,
      saveCustomTemplate,
      applyCustomTemplate,
      deleteTemplate,
      projects,
      saveProject,
      loadProject,
      deleteProject
    }
  };
};
