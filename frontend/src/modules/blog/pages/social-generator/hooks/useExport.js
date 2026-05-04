
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { useToastStore } from '../../../../../store/toastStore';

export const useExport = (selectedPost, designer, generatedContent) => {
  const { showToast } = useToastStore();

  const downloadCarousel = async () => {
    if (!generatedContent?.slides || generatedContent.slides.length === 0) return;
    const zip = new JSZip();

    try {
      showToast('Empaquetando carrusel...', 'loading');
      
      // Ocultar botones de accion temporalmente
      const actionButtons = document.querySelectorAll('.slide-actions');
      actionButtons.forEach(btn => btn.style.display = 'none');

      // Guardar el estado actual del editor para restaurarlo despues
      const originalPage = designer.canvas.currentSlidePage;
      const originalExtraId = designer.canvas.selectedExtraId;
      const originalImageId = designer.canvas.selectedImageId;
      const originalContentIndex = designer.canvas.selectedContentIndex;

      // Limpiar selecciones para que no salgan los bordes/controles en la captura
      designer.canvas.setSelectedExtraId(null);
      designer.canvas.setSelectedImageId(null);
      designer.canvas.setSelectedContentIndex(null);
      
      // Set export mode flag for proper SVG gradient rendering
      designer.canvas.setIsExportMode(true);

      // Iterar por cada diapositiva usando el canvas principal
      for (let i = 0; i < generatedContent.slides.length; i++) {
        // Cambiar la pagina activa
        designer.canvas.setCurrentSlidePage(i);
        
        // Esperar a que React renderice la nueva diapositiva, las imagenes se carguen y los gradientes SVG se procesen
        await new Promise(resolve => setTimeout(resolve, 1500));

        const slideNode = document.getElementById('main-slide-canvas');
        if (!slideNode) continue;

        const canvas = await html2canvas(slideNode, {
          useCORS: true,
          scale: 3,
          backgroundColor: designer.design.bgColor || '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.90).split(',')[1];
        zip.file(`Slide_${i + 1}.jpg`, imgData, { base64: true });
      }

      // Restaurar todo a como estaba
      actionButtons.forEach(btn => btn.style.display = 'flex');
      designer.canvas.setCurrentSlidePage(originalPage);
      designer.canvas.setSelectedExtraId(originalExtraId);
      designer.canvas.setSelectedImageId(originalImageId);
      designer.canvas.setSelectedContentIndex(originalContentIndex);
      
      // Restore export mode flag
      designer.canvas.setIsExportMode(false);

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `carrusel-${selectedPost?.slug_url || 'gynsys'}.zip`;
      link.click();
      showToast('¡ZIP descargado!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al descargar', 'error');
    }
  };

  return { downloadCarousel };
};
