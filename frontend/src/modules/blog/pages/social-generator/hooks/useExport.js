
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { useToastStore } from '../../../store/toastStore';

export const useExport = (selectedPost, bgColor) => {
  const { showToast } = useToastStore();

  const downloadCarousel = async () => {
    const zip = new JSZip();
    const slides = document.querySelectorAll('.export-slide-item');
    if (slides.length === 0) return;

    try {
      showToast('Empaquetando carrusel...', 'loading');
      const actionButtons = document.querySelectorAll('.slide-actions');
      actionButtons.forEach(btn => btn.style.display = 'none');

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i], {
          useCORS: true,
          scale: 3,
          backgroundColor: bgColor,
          logging: false
        });
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`Slide_${i + 1}.png`, imgData, { base64: true });
      }

      actionButtons.forEach(btn => btn.style.display = 'flex');
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
