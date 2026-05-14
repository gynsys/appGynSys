import { useState } from 'react';

export const useVideoExport = (generatedContent, videoStyles, slideDuration, transitionType, transitionDuration, selectedPost, audioRef, getActiveAudioSrc, showToast) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [readyBlob, setReadyBlob] = useState(null);
  const [readyFilename, setReadyFilename] = useState('');

  const downloadReadyFile = async () => {
    if (!readyBlob) return;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Diagnóstico temporal para el usuario
    console.log(`[GynSys] Share Debug - isMobile: ${isMobile}, hasShare: ${!!navigator.share}, hasCanShare: ${!!navigator.canShare}`);

    if (isMobile && navigator.share) {
      try {
        const file = new File([readyBlob], readyFilename, { type: 'video/mp4' });
        
        // Verificamos si realmente podemos compartir este archivo específico
        const canShare = navigator.canShare && navigator.canShare({ files: [file] });
        
        if (canShare) {
          await navigator.share({
            files: [file],
            title: 'GynSys Video',
            text: 'Tu video de GynSys está listo.'
          });
          setReadyBlob(null);
          showToast('¡Acción completada!', 'success');
          return;
        } else {
          console.warn('[GynSys] navigator.canShare returned false for this file');
        }
      } catch (shareErr) {
        console.error('[GynSys] Share API Error:', shareErr);
        // No alert here, fallback to download
      }
    }

    // Fallback robusto usando nuestra nueva utilidad
    import('../../../../../utils/platform').then(m => {
       m.downloadFile(readyBlob, readyFilename);
       setReadyBlob(null);
    });
  };

  const handleExportVideo = async () => {
    const scenes = generatedContent?.video_slides || generatedContent?.slides;
    if (!scenes || !Array.isArray(scenes)) {
      showToast('No hay escenas para exportar', 'error');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    setReadyBlob(null);
    
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
        const filename = `video_gynsys_${selectedPost?.id || 'export'}.mp4`;
        
        setReadyBlob(blob);
        setReadyFilename(filename);
        setIsExporting(false);
        showToast('¡Video generado! Toca para descargar.', 'success');
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
    if (styles.backgroundType === 'gradient' && Array.isArray(styles.gradientColors) && styles.gradientColors.length >= 3) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, styles.gradientColors[0]);
      grad.addColorStop(0.5, styles.gradientColors[1]);
      grad.addColorStop(1, styles.gradientColors[2]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = styles.bgColor || styles.backgroundColor || '#000000';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Imagen
    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(0,0,0,${styles.overlayOpacity || 0.4})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Configuración de Texto Base
    const fontSize = styles.fontSize || 40;
    const fontFamily = styles.fontFamily || 'sans-serif';
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const slideText = slide.text || slide.content || slide.title || '';
    
    // Lógica de Envoltura de Texto (Word Wrap)
    const words = slideText.split(' ').filter(Boolean);
    let line = '';
    let lines = [];
    
    for (let n = 0; n < words.length; n++) {
      // Para medir, quitamos los marcadores de resaltado **
      const testWord = words[n].replace(/\*\*/g, '');
      const testLine = (line + testWord + ' ');
      
      if (ctx.measureText(testLine).width > 600 && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else { 
        line = line + words[n] + ' '; 
      }
    }
    lines.push(line.trim());
    
    // Centrado Vertical
    let y = (canvas.height / 2) - ((lines.length - 1) * fontSize * 0.6);
    
    // Dibujar cada línea con soporte para resaltado
    lines.forEach(l => {
      drawMixedStyleLine(ctx, l, canvas.width / 2, y, styles);
      y += fontSize * 1.2;
    });

    // Texto Secundario (Overlay)
    if (slide.overlayText) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `500 ${Math.max(16, fontSize * 0.5)}px ${fontFamily}`;
      ctx.fillText(slide.overlayText, canvas.width / 2, y + 20);
    }
  };

  const drawMixedStyleLine = (ctx, line, x, y, styles) => {
    const fontSize = styles.fontSize || 40;
    const fontFamily = styles.fontFamily || 'sans-serif';
    const highlightColor = styles.highlightColor || '#ff0000';
    const textColor = styles.textColor || '#ffffff';

    // Dividir por el marcador de resaltado
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    // Calcular ancho total para centrar
    const cleanLine = line.replace(/\*\*/g, '');
    const totalWidth = ctx.measureText(cleanLine).width;
    let currentX = x - (totalWidth / 2);

    parts.forEach(part => {
      if (!part) return;
      
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanPart = part.slice(2, -2);
        ctx.save();
        ctx.fillStyle = highlightColor;
        ctx.font = `italic bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(cleanPart, currentX, y);
        currentX += ctx.measureText(cleanPart).width;
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(part, currentX, y);
        currentX += ctx.measureText(part).width;
        ctx.restore();
      }
    });
  };

  return {
    handleExportVideo,
    isExporting,
    exportProgress
  };
};
