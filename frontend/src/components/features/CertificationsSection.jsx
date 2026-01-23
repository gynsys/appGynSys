import SectionCard from '../common/SectionCard'
import { getImageUrl } from '../../lib/imageUtils';

export default function CertificationsSection({ primaryColor, certifications = [], show_carousel = false, containerBgColor, theme }) {
    if (!show_carousel || !certifications || certifications.length === 0) return null;

    // We duplicate the list to create the infinite scroll effect seamlessly
    const scrollItems = [...certifications, ...certifications];

    return (
        <SectionCard
            id="certificaciones"
            containerBgColor={containerBgColor}
            theme={theme}
        // No explicit title, using internal header
        >
            <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          width: fit-content;
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

            <div className="text-center pb-8">
                <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-widest">
                    Formación Académica y Afiliaciones
                </h3>
            </div>

            <div className="relative">
                {/* Gradient overlays for smooth fading at edges */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white/0 dark:from-gray-900/0 to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white/0 dark:from-gray-900/0 to-transparent z-10"></div>

                <div className="animate-scroll py-4">
                    {scrollItems.map((cert, index) => (
                        <div key={`${cert.id}-${index}`} className="group relative flex flex-col items-center justify-center px-12 md:px-20 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                            {/* Logo Container - Grayscale by default, Color on Hover */}
                            <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center filter grayscale transition-all duration-300 group-hover:grayscale-0 transform group-hover:scale-110 cursor-pointer">
                                <img
                                    src={getImageUrl(cert.logo_url)}
                                    alt={cert.name}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute top-0 left-2/3 ml-4 hidden group-hover:block z-20 w-56 animate-fade-in-right">
                                <div className="text-left relative p-3">
                                    <p className="font-bold text-sm mb-1 leading-tight" style={{ color: primaryColor }}>{cert.name}</p>
                                    <p className="font-medium text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{cert.title}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
}
