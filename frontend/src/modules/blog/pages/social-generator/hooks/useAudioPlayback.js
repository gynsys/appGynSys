
import { useState, useEffect, useRef } from 'react';
import { AUDIO_TRACKS } from '../constants';

export const useAudioPlayback = (activeTab, isPlaying, setIsPlaying, showToast) => {
  const [selectedAudio, setSelectedAudio] = useState('Medical');
  const [customAudioUrl, setCustomAudioUrl] = useState(null);
  const [prelisteningTrack, setPrelisteningTrack] = useState(null);
  
  const audioRef = useRef(null);
  const previewAudioRef = useRef(null);

  const getActiveAudioSrc = () => {
    if (selectedAudio === 'Custom' && customAudioUrl) return customAudioUrl;
    return AUDIO_TRACKS[selectedAudio] || AUDIO_TRACKS['Medical'];
  };

  // Main Audio Effect
  useEffect(() => {
    if (audioRef.current) {
      if (activeTab === 'video' && isPlaying) {
        audioRef.current.src = getActiveAudioSrc();
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("[GynSys] Autoplay prevented");
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [activeTab, isPlaying, selectedAudio, customAudioUrl]);

  // Prelistening Effect
  useEffect(() => {
    if (previewAudioRef.current) {
      if (prelisteningTrack) {
        // Pausamos el video principal para no mezclar sonidos
        setIsPlaying(false);
        previewAudioRef.current.src = prelisteningTrack === 'Custom' ? customAudioUrl : AUDIO_TRACKS[prelisteningTrack];
        previewAudioRef.current.load();
        previewAudioRef.current.play().catch(e => console.log("Error in preview audio:", e));
      } else {
        previewAudioRef.current.pause();
      }
    }
  }, [prelisteningTrack]);

  return {
    audioRef,
    previewAudioRef,
    selectedAudio,
    setSelectedAudio,
    customAudioUrl,
    setCustomAudioUrl,
    prelisteningTrack,
    setPrelisteningTrack,
    getActiveAudioSrc
  };
};
