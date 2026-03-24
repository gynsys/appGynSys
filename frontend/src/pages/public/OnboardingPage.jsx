import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedOnboardingChat from '../../components/features/UnifiedOnboardingChat';
import api from '../../lib/axios';
import ModernLoader from '../../components/common/ModernLoader';

export default function OnboardingPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        const loadDoctor = async () => {
            try {
                const res = await api.get(`/onboarding/config/${slug}`);
                setDoctor(res.data);
            } catch (err) {
                console.error("Error loading onboarding doctor:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDoctor();
    }, [slug]);

    const handleClose = () => {
        navigate(`/${slug}`);
    };

    if (loading) return <ModernLoader isOpen={true} text="Cargando configuración..." />;
    if (!doctor) return <div className="text-center p-10">Médico no encontrado.</div>;

    const primaryColor = doctor.theme_primary_color || '#4F46E5';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-0 sm:p-4">
            <div className="text-center mb-6 hidden sm:block animate-fade-in max-w-md">
                <img src="/GynSys.png" alt="GynSys" className="h-10 w-auto mx-auto mb-2" />
                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    Vía Rápida Onboarding
                </h1>
                <p className="text-xs text-gray-500">
                    Completa tu información administrativa y médica.
                </p>
            </div>
            
            {/* Main Chat Container */}
            <div className="w-full max-w-md h-screen sm:h-[600px] bg-white dark:bg-gray-800 sm:rounded-3xl shadow-2xl overflow-hidden border-0 sm:border-2 border-gray-100 dark:border-gray-700 flex flex-col relative">
                <div 
                    className="p-4 text-white flex items-center justify-between flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center font-bold text-lg">
                           {doctor.doctor_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-bold text-sm leading-tight">{doctor.doctor_name}</h2>
                            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">En línea ahora</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <UnifiedOnboardingChat 
                        doctor={doctor}
                        doctorId={doctor.id}
                        onClose={handleClose}
                    />
                </div>
            </div>
        </div>
    );
}
