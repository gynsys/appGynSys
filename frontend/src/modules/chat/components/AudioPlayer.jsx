import React from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';

const AudioPlayer = ({ src, duration }) => {
    // Placeholder UI for Audio Player - logic to be implemented in Phase 5
    return (
        <div className="flex items-center gap-3 min-w-[200px] p-1">
            <button className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <FiPlay className="w-4 h-4 text-inherit" />
            </button>
            <div className="flex-1 flex flex-col gap-1">
                <div className="h-1 bg-white/30 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-white w-1/3 rounded-full" />
                </div>
                <div className="flex justify-between text-[10px] opacity-80 font-mono">
                    <span>0:00</span>
                    <span>{duration || '0:00'}</span>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
