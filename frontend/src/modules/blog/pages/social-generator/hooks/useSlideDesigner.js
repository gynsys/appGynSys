import { useState, useEffect } from 'react';
import { DEFAULT_DESIGN } from '../lib/constants';
import { blogService } from '../../../services/blogService';

const TEMPLATE_STORAGE_KEY = 'gynsys_carousel_templates';

export const useSlideDesigner = () => {
  // ... existing state definitions ...
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
  const [imageBorderRadius, setImageBorderRadius] = useState('0px');

  const [logoPos, setLogoPos] = useState({ x: 25, y: 12 });
  const [doctorNamePos, setDoctorNamePos] = useState({ x: 60, y: 12 });
  const [dividerPos, setDividerPos] = useState({ x: 50, y: 22 });
  const [dividerColor, setDividerColor] = useState('#e5e7eb');
  const [dividerHeight, setDividerHeight] = useState(2);
  const [dividerWidth, setDividerWidth] = useState(80);
  
  const [extraElements, setExtraElements] = useState({});
  const [currentSlidePage, setCurrentSlidePage] = useState(0);
  const [selectedExtraId, setSelectedExtraId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(false);
  const [selectedDoctorName, setSelectedDoctorName] = useState(false);
  const [selectedDivider, setSelectedDivider] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);

  // Custom Templates Management (Keeping localStorage for now as they are small styles)
  const [customTemplates, setCustomTemplates] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_STORAGE_KEY) : null;
    return saved ? JSON.parse(saved) : [];
  });

  // Projects Management (Now using Backend + Local Fallback)
  const [projects, setProjects] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gynsys_carousel_projects') : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const backendProjects = await blogService.getCarouselProjects();
      
      // Merge with local projects (avoiding duplicates if they were migrated)
      setProjects(prev => {
        const local = prev.filter(p => !p.is_backend); // Keep only truly local ones
        return [...backendProjects.map(p => ({ ...p, is_backend: true })), ...local];
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const saveCustomTemplate = (name) => {
    if (!name) return;
    const newTemplate = {
      id: Date.now(),
      name,
      design: {
        bgColor, bgColor2, bgColor3, useBgGradient,
        fontSize, titleFontSize, headerFontSize,
        titleColor, contentColor, headerColor,
        imageBorderRadius
      },
      global: {
        logoPos, doctorNamePos, dividerPos, dividerColor, dividerHeight, dividerWidth
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
    setImageBorderRadius(design.imageBorderRadius || '0px');
    setLogoPos(global.logoPos || { x: 25, y: 12 });
    setDoctorNamePos(global.doctorNamePos || { x: 60, y: 12 });
    setDividerPos(global.dividerPos);
    setDividerColor(global.dividerColor);
    setDividerHeight(global.dividerHeight);
    setDividerWidth(global.dividerWidth);
    const newExtraElements = {};
    for (let i = 0; i < totalSlides; i++) {
      newExtraElements[i] = elements.map(el => ({ 
        ...el, 
        id: Math.random().toString(36).substr(2, 9),
        bold: el.bold !== undefined ? el.bold : true,
        italic: el.italic !== undefined ? el.italic : false
      }));
    }
    setExtraElements(newExtraElements);
  };

  const saveProject = async (name, generatedContent) => {
    if (!name || !generatedContent) return;
    const projectData = {
      name,
      content: generatedContent,
      design: {
        bgColor, bgColor2, bgColor3, useBgGradient,
        fontSize, titleFontSize, headerFontSize,
        titleColor, contentColor, headerColor,
        imageBorderRadius
      },
      global_settings: {
        logoPos, doctorNamePos, dividerPos, dividerColor, dividerHeight, dividerWidth
      },
      elements: extraElements
    };
    
    try {
      await blogService.saveCarouselProject(projectData);
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    }
  };

  const deleteProject = async (id, isBackend) => {
    if (isBackend) {
      try {
        await blogService.deleteCarouselProject(id);
        await fetchProjects();
        return true;
      } catch (error) {
        console.error('Error deleting project:', error);
        return false;
      }
    } else {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('gynsys_carousel_projects', JSON.stringify(updated));
      return true;
    }
  };

  const loadProject = (project) => {
    if (!project) return null;
    const { design, elements, content } = project;
    const global = project.global_settings || project.global;
    
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
    setImageBorderRadius(design.imageBorderRadius || '0px');
    
    if (global) {
      setLogoPos(global.logoPos || { x: 25, y: 12 });
      setDoctorNamePos(global.doctorNamePos || { x: 60, y: 12 });
      setDividerPos(global.dividerPos);
      setDividerColor(global.dividerColor);
      setDividerHeight(global.dividerHeight);
      setDividerWidth(global.dividerWidth);
    }
    
    setExtraElements(elements);
    setCurrentSlidePage(0);
    return content;
  };

  const addExtraElement = (slideIndex, type, content = '', fontFamily = 'Arial') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newElement = {
      id,
      type,
      content: content || (type === 'text' ? 'Nuevo Texto' : 'arrow'),
      x: 50,
      y: 50,
      width: type === 'text' ? 150 : 80,
      height: type === 'text' ? 40 : 80,
      rotation: 0,
      color: type === 'text' ? contentColor : titleColor,
      color2: '#4f46e5',
      color3: '#9333ea',
      useGradient: false,
      gradientDir: 'to bottom right',
      zIndex: 30,
      bold: true,
      italic: false,
      fontFamily: type === 'text' ? fontFamily : 'Arial'
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
    setSelectedLogo(type === 'logo');
    setSelectedDoctorName(type === 'doctorName');
    setSelectedDivider(type === 'divider');
    setSelectedImageId(type === 'image' ? id : null);
    setSelectedContentIndex(type === 'content' ? id : null);
    setSelectedExtraId(type === 'extra' ? id : null);
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
      logoPos, setLogoPos,
      doctorNamePos, setDoctorNamePos,
      dividerPos, setDividerPos,
      dividerColor, setDividerColor,
      dividerHeight, setDividerHeight,
      dividerWidth, setDividerWidth,
      imageBorderRadius, setImageBorderRadius
    },
    canvas: {
      extraElements, setExtraElements,
      currentSlidePage, setCurrentSlidePage,
      selectedExtraId, setSelectedExtraId,
      selectedImageId, setSelectedImageId,
      selectedContentIndex, setSelectedContentIndex,
      selectedLogo,
      selectedDoctorName,
      selectedDivider,
      logoPos,
      doctorNamePos,
      dividerPos,
      dividerColor,
      dividerHeight,
      dividerWidth,
      addExtraElement,
      updateExtraElement,
      removeExtraElement,
      selectElement,
      applyTemplateToAll,
      isExportMode,
      setIsExportMode,
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
