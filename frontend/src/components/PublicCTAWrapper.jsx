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

            if (shouldShow) {
                const timer = setTimeout(() => {
                    setShowCTADialog(true);
                }, 7000);
                return () => clearTimeout(timer);
            }
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
