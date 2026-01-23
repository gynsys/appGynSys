import { useState } from 'react';
import PropTypes from 'prop-types';
import { MdVideoCall } from 'react-icons/md';

/**
 * Floating button to open online consultation chatbot
 * Displays in bottom-right corner with pulse animation
 */
export default function OnlineConsultationButton({ onOpen, primaryColor }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={onOpen}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`group relative shadow-2xl rounded-full transition-all duration-300 ${isHovered ? 'scale-110' : 'animate-pulse-slow scale-100'
                    }`}
                aria-label="Consulta Online"
            >
                {/* Glow effect */}
                <div
                    className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor || '#8B5CF6'} 0%, #EC4899 100%)`
                    }}
                />

                {/* Button content */}
                <div className="relative flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-900 rounded-full">
                    <MdVideoCall
                        size={28}
                        className="text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110"
                        style={{ color: primaryColor || '#8B5CF6' }}
                    />
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                            Consulta Online
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            📹 Videollamada
                        </span>
                    </div>
                </div>

                {/* Ping effect when not hovered */}
                {!isHovered && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: primaryColor || '#8B5CF6' }}
                        />
                        <span
                            className="relative inline-flex rounded-full h-3 w-3"
                            style={{ backgroundColor: primaryColor || '#8B5CF6' }}
                        />
                    </span>
                )}
            </button>
        </div>
    );
}

OnlineConsultationButton.propTypes = {
    onOpen: PropTypes.func.isRequired,
    primaryColor: PropTypes.string
};
