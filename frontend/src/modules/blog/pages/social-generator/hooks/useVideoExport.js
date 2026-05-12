
import { useState } from 'react';

export const useVideoExport = (generatedContent, videoStyles, slideDuration, selectedPost, audioRef, getActiveAudioSrc, showToast) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportVideo = async () => {
    if (!generatedContent?.video_slides) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      
      // COMBINAR AUDIO Y VIDEO PARA EXPORTACIÓN
      const videoStream = canvas.captureStream(30);
      let combinedStream = videoStream;

      if (audioRef.current) {
        audioRef.current.src = getActiveAudioSrc();
        audioRef.current.load();
        
        // Timeout para el audio (máx 5s de espera)
        await Promise.race([
          new Promise(resolve => { audioRef.current.oncanplaythrough = resolve; }),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        audioRef.current.currentTime = 0;
        audioRef.current.play();
        const audioStream = audioRef.current.captureStream ? audioRef.current.captureStream() : audioRef.current.mozCaptureStream();
        combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
      }

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9,opus' 
      });
      const chunks = [];
      
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_gynsys_${selectedPost?.id}.mp4`;
        a.click();
        setIsExporting(false);
        showToast('¡Video con Audio generado con éxito!', 'success');
      };

      recorder.start();
      
      for (let i = 0; i < generatedContent.video_slides.length; i++) {
        const slide = generatedContent.video_slides[i];
        
        // Draw Background
        ctx.fillStyle = videoStyles.bgColor || videoStyles.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Image if exists
        if (slide.image) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Timeout para imagen
            await Promise.race([
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
                img.src = slide.image;
              }),
              new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'rgba(0,0,0,0.4)'; // Overlay
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          } catch (e) { console.log("Error loading slide image"); }
        }

        // Draw Text
        ctx.fillStyle = videoStyles.textColor;
        ctx.font = `bold ${videoStyles.fontSize}px ${videoStyles.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const words = slide.text.split(' ');
        let line = '';
        let y = canvas.height / 2 - 100;
        
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 600 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 60;
          } else { line = testLine; }
        }
        ctx.fillText(line, canvas.width / 2, y);
        
        setExportProgress(Math.round(((i + 1) / generatedContent.video_slides.length) * 100));
        await new Promise(r => setTimeout(r, slideDuration * 1000));
      }
      
      recorder.stop();
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('Error al renderizar el video', 'error');
    }
  };

  return {
    handleExportVideo,
    isExporting,
    exportProgress
  };
};
