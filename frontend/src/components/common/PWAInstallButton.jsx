import { FiDownload } from 'react-icons/fi';
import { useToastStore } from '../../store/toastStore';
import usePWAStore from '../../store/pwaStore';

const PWAInstallButton = ({ isFloating = false, fullWidth = false }) => {
    const { deferredPrompt, isStandalone, setDeferredPrompt } = usePWAStore();
    const toast = useToastStore();

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Detectar iOS
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone;

            if (isIOS) {
                toast.info('Para instalar: presiona el icono de compartir y luego "Añadir a pantalla de inicio"');
            } else if (window.chrome || (navigator.userAgent.indexOf("Chrome") !== -1)) {
                // Caso Chrome Desktop donde el evento antes pudo fallar o fue ignorado
                toast.info('Busca el icono de "Instalar" (computadora con flecha) en la barra de direcciones de tu navegador.');
            } else {
                toast.info('Instalación no soportada o ya instalada. Intenta con Chrome en Android o Safari en iOS.');
            }
            return;
        }

        try {
            // Mostrar el prompt nativo
            deferredPrompt.prompt();

            // Esperar la respuesta del usuario
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                toast.success('¡Gracias por instalar GynSys!');
            }

            // Limpiar el prompt global
            setDeferredPrompt(null);
        } catch (err) {
            console.error('Error durante la instalación:', err);
            toast.error('Hubo un error al intentar instalar la aplicación.');
        }
    };

    // No mostrar si ya está instalada
    if (isStandalone) return null;

    if (isFloating) {
        return (
            <button
                onClick={handleInstallClick}
                className={`${fullWidth ? 'w-full px-6 py-3' : 'px-4 py-2'} rounded-full font-bold text-sm shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 group ring-4 ring-indigo-500/20`}
                title="Instalar App Now"
            >
                <FiDownload className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Instalar App
            </button>
        );
    }

    return (
        <button
            onClick={handleInstallClick}
            className={`${fullWidth ? 'w-full justify-center px-6 py-3' : 'space-x-2 px-4 py-2'} flex items-center rounded-xl bg-indigo-600 text-white font-bold transition-all shadow-xl hover:bg-indigo-700 active:scale-95 group`}
            title="Instalar App"
        >
            <FiDownload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className={fullWidth ? '' : 'hidden sm:inline'}>Instalar App</span>
        </button>
    );
};

export default PWAInstallButton;
