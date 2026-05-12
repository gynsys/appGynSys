
import { useState } from 'react';

export const useVideoExport = (generatedContent, videoStyles, slideDuration, selectedPost, audioRef, getActiveAudioSrc, showToast) => {
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
      const durationPerSlide = slideDuration; // segundos
      const transitionDuration = 0.5; // segundos de fade
      const framesPerSlide = fps * durationPerSlide;
      const transitionFrames = fps * transitionDuration;

      for (let i = 0; i < scenes.length; i++) {
        for (let f = 0; f < framesPerSlide; f++) {
          // Determinar opacidad para la transición
          let opacity = 1;
          if (f < transitionFrames && i > 0) {
            opacity = f / transitionFrames; // Fade in
          }
          
          // Limpiar Canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Fondo
          ctx.globalAlpha = 1;
          ctx.fillStyle = videoStyles.bgColor || videoStyles.backgroundColor || '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Imagen de fondo (con opacidad de escena)
          ctx.globalAlpha = opacity;
          if (loadedImages[i]) {
            ctx.drawImage(loadedImages[i], 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Dibujar Texto
          ctx.fillStyle = videoStyles.textColor || '#ffffff';
          ctx.font = `bold ${videoStyles.fontSize || 40}px ${videoStyles.fontFamily || 'sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const slideText = scenes[i].text || scenes[i].content || scenes[i].title || '';
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
          
          let y = (canvas.height / 2) - ((lines.length - 1) * (videoStyles.fontSize || 40) * 0.6);
          lines.forEach(l => {
            ctx.fillText(l, canvas.width / 2, y);
            y += (videoStyles.fontSize || 40) * 1.2;
          });

          // Esperar un frame
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
  return {
    handleExportVideo,
    isExporting,
    exportProgress
  };
};
