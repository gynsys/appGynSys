
import React from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

export const PreviewModal = ({ isOpen, currentIndex, total, slides, renderSlide, onClose, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      {currentIndex > 0 && (
        <button 
          onClick={() => onNavigate(currentIndex - 1)} 
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:scale-110"
        >
          <FiChevronLeft size={32} />
        </button>
      )}
      
      <div className="w-full max-w-xl shadow-2xl transition-all duration-300 scale-[1.1] md:scale-[1.3] z-[105]">
        {renderSlide(slides[currentIndex], currentIndex, true)}
      </div>
      
      {currentIndex < total - 1 && (
        <button 
          onClick={() => onNavigate(currentIndex + 1)} 
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:scale-110"
        >
          <FiChevronRight size={32} />
        </button>
      )}

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[110] hover:bg-red-500"
      >
        <FiX size={32} />
      </button>
    </div>
  );
};
