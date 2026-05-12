import { useState, useEffect, useRef } from 'react';
import { AUDIO_TRACKS } from '../constants';
import { blogService } from '../../services/blogService';

export const useAudioPlayback = (activeTab, isPlaying, setIsPlaying, showToast) => {
  const [selectedAudio, setSelectedAudio] = useState('Medical');
  const [customAudioUrl, setCustomAudioUrl] = useState(null);
  const [prelisteningTrack, setPrelisteningTrack] = useState(null);
  const [userAudios, setUserAudios] = useState([]);
  const [loadingAudios, setLoadingAudios] = useState(false);
  
  const audioRef = useRef(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    loadUserAudios();
  }, []);

  const loadUserAudios = async () => {
    try {
      setLoadingAudios(true);
      const data = await blogService.getSocialAudios();
      setUserAudios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading user audios:', error);
    } finally {
      setLoadingAudios(false);
    }
  };

  const handleUploadAudio = async (file) => {
    try {
      showToast('Subiendo audio...', 'info');
      const response = await blogService.uploadSocialAudio(file);
      showToast('Audio subido con éxito', 'success');
      
      const newAudio = response.audio;
      setUserAudios(prev => [newAudio, ...prev]);
      
      // Select the new audio automatically
      setSelectedAudio(`User-${newAudio.id}`);
      setCustomAudioUrl(newAudio.url);
      
      return newAudio;
    } catch (error) {
      showToast('Error al subir audio', 'error');
      throw error;
    }
  };

  const handleDeleteAudio = async (audioId) => {
    try {
      await blogService.deleteSocialAudio(audioId);
      setUserAudios(prev => prev.filter(a => a.id !== audioId));
      if (selectedAudio === `User-${audioId}`) {
        setSelectedAudio('Medical');
        setCustomAudioUrl(null);
      }
      showToast('Audio eliminado', 'success');
    } catch (error) {
      showToast('Error al eliminar audio', 'error');
    }
  };

  const getActiveAudioSrc = () => {
    if (selectedAudio === 'Custom' && customAudioUrl) return customAudioUrl;
    if (selectedAudio.startsWith('User-')) {
      const audioId = parseInt(selectedAudio.split('-')[1]);
      const audio = userAudios.find(a => a.id === audioId);
      if (audio) return audio.url.startsWith('http') ? audio.url : `${import.meta.env.VITE_API_BASE_URL}${audio.url}`;
    }
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
  }, [activeTab, isPlaying, selectedAudio, customAudioUrl, userAudios]);

  // Prelistening Effect
  useEffect(() => {
    if (previewAudioRef.current) {
      if (prelisteningTrack) {
        setIsPlaying(false);
        let src = '';
        if (prelisteningTrack === 'Custom') {
          src = customAudioUrl;
        } else if (prelisteningTrack.startsWith('User-')) {
          const audioId = parseInt(prelisteningTrack.split('-')[1]);
          const audio = userAudios.find(a => a.id === audioId);
          src = audio ? (audio.url.startsWith('http') ? audio.url : `${import.meta.env.VITE_API_BASE_URL}${audio.url}`) : '';
        } else {
          src = AUDIO_TRACKS[prelisteningTrack];
        }
        
        if (src) {
          previewAudioRef.current.src = src;
          previewAudioRef.current.load();
          previewAudioRef.current.play().catch(e => console.log("Error in preview audio:", e));
        }
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
    getActiveAudioSrc,
    userAudios,
    loadingAudios,
    handleUploadAudio,
    handleDeleteAudio
  };
};
