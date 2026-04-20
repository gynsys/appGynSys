import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Download, Sparkles, X, Smartphone, UserPlus } from 'lucide-react';
import { isCapacitor } from '../../utils/platform';

export default function DownloadCTADialog({ open, onOpenChange, onRegisterClick }) {
    const tenantPrimaryColor = localStorage.getItem('tenant_theme_primary') || '#ec4899';
    const tenantLogo = localStorage.getItem('tenant_logo');
    const tenantName = localStorage.getItem('tenant_name') || 'nuestra app';
    
    // Ocultar si ya estamos en app nativa
    if (isCapacitor()) return null;

    const isIOS = () => {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    };

    const handleDownload = () => {
        // Marcamos como interactuado para no molestar de nuevo
        localStorage.setItem('has_seen_app_cta', 'installed');
        
        if (isIOS()) {
            // iOS instruction alert since we don't have .ipa sideloading
            alert("Para instalar en iPhone: Toca el ícono de compartir en Safari y luego 'Agregar a Inicio'.");
        } else {
            // Descargar el APK local directo del servidor
            const link = document.createElement('a');
            link.href = '/GynSys.apk';
            link.download = 'GynSys.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onOpenChange(false);
        }
    };

    const handleDismiss = () => {
        // Se guarda un timestamp de "lo vio y lo cerró"
        const now = new Date().getTime();
        localStorage.setItem('has_seen_app_cta', now.toString());
        onOpenChange(false);
    };

    const handleRegisterClick = () => {
        localStorage.setItem('has_seen_app_cta', 'registered');
        onOpenChange(false);
        if (onRegisterClick) onRegisterClick();
    };

    return (
        <Dialog open={open} onOpenChange={handleDismiss}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl sm:rounded-3xl">
                
                {/* Header Section con Degradado y Logo */}
                <div 
                    className="relative w-full h-32 flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${tenantPrimaryColor}20 0%, ${tenantPrimaryColor}10 100%)` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent"></div>
                    
                    <button 
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 w-20 h-20 bg-white dark:bg-gray-800 rounded-full shadow-lg border-4 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden p-1">
                        {tenantLogo ? (
                            <img src={tenantLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                            <Sparkles className="w-10 h-10" style={{ color: tenantPrimaryColor }} />
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6 pt-2 text-center">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            La app de tu doctora, en tu teléfono
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Descarga la App nativa de {tenantName} para registrar tus síntomas, recibir proyecciones exactas y activar <strong className="text-gray-900 dark:text-white">notificaciones push automáticas</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Acciones */}
                    <div className="flex flex-col gap-3 mt-5">
                        <button
                            onClick={handleDownload}
                            className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-transform active:scale-[0.98] shadow-md hover:shadow-lg"
                            style={{ backgroundColor: tenantPrimaryColor }}
                        >
                            {isIOS() ? <Smartphone className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                            <span>{isIOS() ? "Instalar App en iPhone" : "Descargar App (Android)"}</span>
                        </button>
                        
                        <button
                            onClick={handleRegisterClick}
                            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Continuar en la web y registrarme
                        </button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
