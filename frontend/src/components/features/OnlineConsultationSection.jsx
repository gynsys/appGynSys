import PropTypes from 'prop-types';
import { getImageUrl } from '../../lib/imageUtils';
import { MdVideoCall } from 'react-icons/md';
import SectionCard from '../common/SectionCard';

/**
 * Online Consultation Marketing Section
 * Full-width video cover banner showcasing online consultation service
 * Appears after Services section when is_active = true
 */
export default function OnlineConsultationSection({ doctor, settings, onOpenChat, primaryColor, containerBgColor, theme }) {
    if (!settings?.is_active) return null;

    return (

        <section id="consulta-online" className="mb-20 scroll-mt-28">
            <div className="w-full relative overflow-hidden transition-all duration-500 bg-gray-950 border border-gray-800 shadow-2xl shadow-black/50 rounded-2xl h-[578px]">
                {/* Video Background Cover - Full Size */}
                {settings.video_url ? (
                    <video
                        src={getImageUrl(settings.video_url)}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    // Placeholder gradient if no video
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50" />
                )}

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Content Overlay - Bottom positioned with padding */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        {/* Text Content - Left */}
                        <div className="flex-1 text-white max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-2xl">
                                Consultas Online por Videollamada
                            </h2>
                            <p className="text-gray-100 text-base md:text-lg leading-relaxed drop-shadow-lg font-medium">
                                Agenda tu consulta ginecológica desde la comodidad de tu hogar.
                                Atención personalizada, diagnóstico profesional y seguimiento continuo.
                            </p>
                        </div>

                        {/* CTA Button - Right */}
                        <button
                            onClick={onOpenChat}
                            className="flex-shrink-0 group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor || '#8B5CF6'} 0%, #EC4899 100%)`
                            }}
                        >
                            <span className="flex items-center gap-2 whitespace-nowrap">
                                <MdVideoCall className="w-6 h-6" />
                                Agendar Consulta Online
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

OnlineConsultationSection.propTypes = {
    doctor: PropTypes.object.isRequired,
    settings: PropTypes.object,
    onOpenChat: PropTypes.func.isRequired,
    primaryColor: PropTypes.string
};
