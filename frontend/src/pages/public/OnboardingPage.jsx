import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedOnboardingBot from '../../features/preconsulta/components/UnifiedOnboardingBot';

export default function OnboardingPage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const handleClose = () => {
        // Redirigir al perfil del doctor al terminar
        navigate(`/${slug}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 max-w-md animate-fade-in">
                <img src="/GynSys.png" alt="GynSys" className="h-12 w-auto mx-auto mb-4" />
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    Vía Rápida Onboarding
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    Completa tu información administrativa y médica en un solo paso.
                </p>
            </div>
            
            <UnifiedOnboardingBot 
                doctorSlug={slug} 
                onClose={handleClose} 
            />
        </div>
    );
}
