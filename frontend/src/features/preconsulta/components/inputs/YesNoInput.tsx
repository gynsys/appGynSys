import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

interface YesNoInputProps {
  label: string;
  onNext: (value: boolean) => void;
  primaryColor?: string;
}

export const YesNoInput: React.FC<YesNoInputProps> = ({ label, onNext, primaryColor = '#4F46E5' }) => {
  const [isYesHovered, setIsYesHovered] = React.useState(false);

  return (
    <div className="w-full max-w-xs animate-fade-in">
      {label && <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4 text-center">{label}</h3>}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => onNext(true)}
          onMouseEnter={() => setIsYesHovered(true)}
          onMouseLeave={() => setIsYesHovered(false)}
          className="flex items-center gap-2 border py-2 px-6 rounded-full font-medium transition-all shadow-sm hover:scale-105"
          style={{
            borderColor: `${primaryColor}4d`, // 30% opacity
            backgroundColor: isYesHovered ? `${primaryColor}33` : `${primaryColor}1a`, // 20% vs 10%
            color: primaryColor,
          }}
        >
          <FiCheck className="text-lg" />
          Sí
        </button>

        <button
          onClick={() => onNext(false)}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 py-2 px-6 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:scale-105 transition-all shadow-sm"
        >
          <FiX className="text-lg" />
          No
        </button>
      </div>
    </div>
  );
};
