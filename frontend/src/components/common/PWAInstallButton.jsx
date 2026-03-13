import { FiDownload, FiActivity } from 'react-icons/fi';
import { useToastStore } from '../../store/toastStore';
import usePWAStore from '../../store/pwaStore';
import { isCapacitor } from '../../utils/platform';

const PWAInstallButton = ({ isFloating = false, fullWidth = false }) => {
    if (isCapacitor()) return null;
    const { deferredPrompt, isStandalone, setDeferredPrompt } = usePWAStore();
    const toast = useToastStore();

    const handleInstallClick = async () => {
        // --- DETECCIÓN DE PLATAFORMA ---
        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.navigator.standalone;
        const isAndroid = /Android/.test(ua);

        // Caso 1: Android - Descarga Directa de APK (Mejor que PWA)
        if (isAndroid) {
            toast.info('Descargando App para Android... 📲');
            const link = document.createElement('a');
            link.href = '/GynSys.apk';
            link.download = 'GynSys.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Caso 2: iOS - Instrucciones PWA (No admite APK)
        if (isIOS) {
            toast.info('Para instalar en iOS: Pulsa "Compartir" y luego "Añadir a pantalla de inicio" ✨');
            return;
        }

        // Caso 3: Desktop u Otros - Intentar PWA Nativo si está disponible
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') toast.success('¡Instalación iniciada! 🎉');
                setDeferredPrompt(null);
            } catch (err) {
                console.error('Error PWA:', err);
                toast.error('Usa el menú de tu navegador para instalar 🛠️');
            }
            return;
        }

        // Caso 4: Desktop sin prompt - Sugerir Chrome o APK manual
        toast.info('Sugerencia: Usa Chrome en Android o Safari en iOS para la mejor experiencia 🛠️');
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
