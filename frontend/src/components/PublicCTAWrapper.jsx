import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DownloadCTADialog from './cycle-predictor/DownloadCTADialog';
import { useAuthStore } from '../store/authStore';
import { isCapacitor } from '../utils/platform';

export default function PublicCTAWrapper({ children }) {
    const { isCycleAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Manejar Popup CTA globalmente para visitantes
    const [showCTADialog, setShowCTADialog] = useState(false);

    useEffect(() => {
        // Reiniciar el timer en cada cambio de ruta pública si es necesario
        if (!isCycleAuthenticated && !isCapacitor()) {
            const hasSeen = localStorage.getItem('has_seen_app_cta');
            
            let shouldShow = false;
            if (!hasSeen) {
                shouldShow = true;
            } else if (hasSeen !== 'installed' && hasSeen !== 'registered') {
                const timestamp = parseInt(hasSeen, 10);
                if (!isNaN(timestamp)) {
                    const daysPassed = (new Date().getTime() - timestamp) / (1000 * 3600 * 24);
                    if (daysPassed > 15) shouldShow = true;
                }
            }

            if (!shouldShow) return;

            // 1. Disparador por tiempo: Failsafe para quienes no hacen scroll vertical (ej. vistas cortas)
            const timer = setTimeout(() => {
                setShowCTADialog(prev => !prev ? true : prev);
            }, 7000);

            // 2. Disparador por Scroll Profundo: Salta orgánicamente si lee hasta casi el final de la página (70%)
            const handleScroll = () => {
                const scrolledToY = window.scrollY + window.innerHeight;
                const thresholdY = document.documentElement.scrollHeight * 0.70;
                
                if (scrolledToY >= thresholdY) {
                    setShowCTADialog(true);
                    window.removeEventListener('scroll', handleScroll);
                    clearTimeout(timer); // Previene disparos dobles
                }
            };

            window.addEventListener('scroll', handleScroll, { passive: true });

            return () => {
                clearTimeout(timer);
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isCycleAuthenticated, location.pathname]);

    return (
        <>
            {children}
            <DownloadCTADialog 
                open={showCTADialog}
                onOpenChange={setShowCTADialog}
                onRegisterClick={() => {
                    setShowCTADialog(false);
                    // Los mandamos a la app de ciclo en la web donde podrán iniciar sesión
                    navigate('/cycle/dashboard');
                }}
            />
        </>
    );
}
