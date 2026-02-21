import { FiDownload, FiActivity } from 'react-icons/fi';
import { useToastStore } from '../../store/toastStore';
import usePWAStore from '../../store/pwaStore';

const PWAInstallButton = ({ isFloating = false, fullWidth = false }) => {
    const { deferredPrompt, isStandalone, setDeferredPrompt } = usePWAStore();
    const toast = useToastStore();

    const handleInstallClick = async () => {
        // Caso: Ya está instalada
        if (isStandalone) {
            toast.success('¡GynSys ya está instalada en tu dispositivo! ✨');
            return;
        }

        if (!deferredPrompt) {
            // Detectar Plataforma
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone;
            const isAndroid = /Android/.test(navigator.userAgent);
            const isChrome = /Chrome/.test(navigator.userAgent);

            if (isIOS) {
                toast.info('iOS: Pulsa "Compartir" y luego "Añadir a pantalla de inicio" ✨');
            } else if (isAndroid && isChrome) {
                toast.info('Busca "Instalar aplicación" en el menú (⋮) de tu Chrome 📲');
            } else {
                toast.info('Usa Chrome en Android o Safari en iOS para instalar la App 🛠️');
            }
            return;
        }

        try {
            // Mostrar el prompt nativo directamente
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                toast.success('¡Instalación iniciada! 🎉');
            }
            setDeferredPrompt(null);
        } catch (err) {
            console.error('Error PWA:', err);
            toast.error('Usa el menú de tu navegador para instalar 🛠️');
        }
    };

    // Estilo base para ambos estados
    const baseClasses = `${fullWidth ? 'w-full px-2 py-1.5' : 'px-4 py-1.5'} rounded-lg font-medium text-xs shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center backdrop-blur-md border`;
    const activeStyle = "bg-white/10 dark:bg-gray-800/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white";
    const installedStyle = "bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400 cursor-default";

    if (isFloating) {
        return (
            <button
                onClick={handleInstallClick}
                className={`${baseClasses} ${isStandalone ? installedStyle : activeStyle} group`}
                title={isStandalone ? "App Instalada" : "Instalar App"}
            >
                {isStandalone ? (
                    <FiActivity className="mr-2 w-5 h-5" />
                ) : (
                    <FiDownload className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isStandalone ? 'App Instalada' : 'Instalar App'}
            </button>
        );
    }

    return (
        <button
            onClick={handleInstallClick}
            className={`${fullWidth ? 'w-full justify-center px-6 py-3' : 'space-x-2 px-4 py-2'} flex items-center rounded-xl bg-white/10 dark:bg-gray-800/20 backdrop-blur-md border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold transition-all shadow-xl hover:bg-indigo-600 hover:text-white active:scale-95 group`}
            title="Instalar App"
        >
            <FiDownload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className={fullWidth ? '' : 'hidden sm:inline'}>Instalar App</span>
        </button>
    );
};

export default PWAInstallButton;
