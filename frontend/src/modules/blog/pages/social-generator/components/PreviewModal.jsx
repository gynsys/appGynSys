
import React from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

export const PreviewModal = ({ isOpen, currentIndex, total, slides, renderSlide, onClose, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-100/95 dark:bg-black/95 backdrop-blur-md">
      {currentIndex > 0 && (
        <button 
          onClick={() => onNavigate(currentIndex - 1)} 
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-gray-600 dark:text-white p-4 bg-gray-200/80 dark:bg-white/10 rounded-full hover:bg-gray-300 dark:hover:bg-white/20 transition-all z-[110] hover:scale-110 shadow-lg"
        >
          <FiChevronLeft size={32} />
        </button>
      )}
      
      <div className="flex items-center justify-center transition-all duration-300 transform scale-[0.8] xs:scale-[0.9] sm:scale-100 md:scale-[1.2] lg:scale-[1.4] z-[105]">
        {renderSlide(slides[currentIndex], currentIndex, true)}
      </div>
      
      {currentIndex < total - 1 && (
        <button 
          onClick={() => onNavigate(currentIndex + 1)} 
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-gray-600 dark:text-white p-4 bg-gray-200/80 dark:bg-white/10 rounded-full hover:bg-gray-300 dark:hover:bg-white/20 transition-all z-[110] hover:scale-110 shadow-lg"
        >
          <FiChevronRight size={32} />
        </button>
      )}

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-gray-600 dark:text-white p-3 bg-gray-200/80 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition-all z-[110] shadow-lg"
      >
        <FiX size={32} />
      </button>
    </div>
  );
};
