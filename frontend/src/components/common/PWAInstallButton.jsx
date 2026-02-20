import { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { useToastStore } from '../../store/toastStore';

const PWAInstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const toast = useToastStore();

    useEffect(() => {
        // Detectar si ya está en modo standalone (PWA instalada)
        const checkStandalone = () => {
            const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone
                || document.referrer.includes('android-app://');
            setIsStandalone(isStandaloneMode);
        };

        checkStandalone();

        const handleBeforeInstallPrompt = (e) => {
            // Prevenir que el navegador muestre su propio prompt
            e.preventDefault();
            // Guardar el evento para dispararlo luego
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detectar si la app fue instalada exitosamente
        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            toast.success('¡App instalada correctamente!');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [toast]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Caso iOS o navegadores que no soportan beforeinstallprompt
            if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone) {
                toast.info('Para instalar: presiona el icono de compartir y luego "Añadir a pantalla de inicio"');
            } else {
                toast.info('Instalación no soportada en este navegador. Intenta con Chrome o Safari.');
            }
            return;
        }

        // Mostrar el prompt nativo
        deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Usuario aceptó la instalación');
        } else {
            console.log('Usuario rechazó la instalación');
        }

        // Solo se puede usar una vez
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    // No mostrar si ya está instalada o si no hay evento (excepto iOS para guia)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isStandalone) return null;
    if (!isVisible && !isIOS) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold transition-all shadow-md hover:shadow-lg group"
            title="Instalar App"
        >
            <FiDownload className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Instalar App</span>
        </button>
    );
};

export default PWAInstallButton;
