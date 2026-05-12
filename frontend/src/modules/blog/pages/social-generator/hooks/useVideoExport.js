
import { useState } from 'react';

export const useVideoExport = (generatedContent, videoStyles, slideDuration, transitionType, transitionDuration, selectedPost, audioRef, getActiveAudioSrc, showToast) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportVideo = async () => {
    const scenes = generatedContent?.video_slides || generatedContent?.slides;
    if (!scenes || !Array.isArray(scenes)) {
      showToast('No hay escenas para exportar', 'error');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // 1. Pre-cargar todas las imágenes para evitar parpadeos o fallos
      const loadedImages = {};
      for (let i = 0; i < scenes.length; i++) {
        if (scenes[i].image) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = scenes[i].image;
          });
          if (img.complete && img.naturalWidth > 0) loadedImages[i] = img;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      
      const videoStream = canvas.captureStream(30);
      let combinedStream = videoStream;

      if (audioRef.current) {
        audioRef.current.src = getActiveAudioSrc();
        audioRef.current.load();
        await Promise.race([
          new Promise(resolve => { audioRef.current.oncanplaythrough = resolve; }),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        const audioStream = audioRef.current.captureStream ? audioRef.current.captureStream() : audioRef.current.mozCaptureStream();
        combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_gynsys_${selectedPost?.id || 'export'}.mp4`;
        a.click();
        setIsExporting(false);
        showToast('¡Video exportado con éxito!', 'success');
      };

      recorder.start();
      
      const fps = 30;
      const framesPerSlide = fps * slideDuration;
      const transitionFrames = fps * transitionDuration;

      for (let i = 0; i < scenes.length; i++) {
        for (let f = 0; f < framesPerSlide; f++) {
          let progress = 1; // 0 to 1
          if (f < transitionFrames && i > 0) {
            progress = f / transitionFrames; // Transición entrando
          }
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();

          // Lógica de Transición
          if (f < transitionFrames && i > 0) {
            const prevIndex = i - 1;
            const exitProgress = 1 - progress;

            // Dibujar la escena anterior (Saliendo)
            ctx.save();
            if (transitionType === 'fade') ctx.globalAlpha = exitProgress;
            else if (transitionType === 'slide') ctx.translate(-progress * canvas.width, 0);
            else if (transitionType === 'zoom') {
               ctx.translate(canvas.width/2, canvas.height/2);
               ctx.scale(1 + progress, 1 + progress);
               ctx.translate(-canvas.width/2, -canvas.height/2);
               ctx.globalAlpha = exitProgress;
            }
            drawScene(ctx, scenes[prevIndex], loadedImages[prevIndex], videoStyles, canvas);
            ctx.restore();

            // Dibujar la escena actual (Entrando)
            ctx.save();
            if (transitionType === 'fade') ctx.globalAlpha = progress;
            else if (transitionType === 'slide') ctx.translate(canvas.width - progress * canvas.width, 0);
            else if (transitionType === 'zoom') {
               ctx.translate(canvas.width/2, canvas.height/2);
               ctx.scale(progress, progress);
               ctx.translate(-canvas.width/2, -canvas.height/2);
               ctx.globalAlpha = progress;
            }
            drawScene(ctx, scenes[i], loadedImages[i], videoStyles, canvas);
            ctx.restore();
          } else {
            // Escena estática
            drawScene(ctx, scenes[i], loadedImages[i], videoStyles, canvas);
          }

          ctx.restore();
          await new Promise(r => setTimeout(r, 1000 / fps));
        }
        setExportProgress(Math.round(((i + 1) / scenes.length) * 100));
      }
      
      recorder.stop();
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('Error al renderizar el video', 'error');
    }
  };

  const drawScene = (ctx, slide, image, styles, canvas) => {
    // Fondo
    ctx.fillStyle = styles.bgColor || styles.backgroundColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Imagen
    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Texto
    ctx.fillStyle = styles.textColor || '#ffffff';
    ctx.font = `bold ${styles.fontSize || 40}px ${styles.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const slideText = slide.text || slide.content || slide.title || '';
    const words = slideText.split(' ').filter(Boolean);
    let line = '';
    let lines = [];
    
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > 600 && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else { line = testLine; }
    }
    lines.push(line);
    
    let y = (canvas.height / 2) - ((lines.length - 1) * (styles.fontSize || 40) * 0.6);
    lines.forEach(l => {
      ctx.fillText(l, canvas.width / 2, y);
      y += (styles.fontSize || 40) * 1.2;
    });

    // Texto Secundario (Overlay)
    if (slide.overlayText) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `500 ${Math.max(16, (styles.fontSize || 40) * 0.5)}px ${styles.fontFamily || 'sans-serif'}`;
      ctx.fillText(slide.overlayText, canvas.width / 2, y + 20);
    }
  };

  return {
    handleExportVideo,
    isExporting,
    exportProgress
  };
};
