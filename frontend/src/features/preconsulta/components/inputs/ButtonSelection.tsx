import React from 'react';
import { FiCheck, FiX, FiCircle } from 'react-icons/fi';

interface SelectionOptionProps {
  label: string;
  onClick: () => void;
  primaryColor: string;
}

const SelectionOption: React.FC<SelectionOptionProps> = ({ label, onClick, primaryColor }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t === 'sí' || t === 'si' || t.startsWith('sí,') || t.startsWith('si,')) return <FiCheck className="text-lg" />;
    if (t === 'no' || t.startsWith('no,')) return <FiX className="text-lg" />;
    return <FiCircle className="text-xs opacity-40" />;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center justify-center gap-2 border transition-all shadow-sm
        py-3 px-6 text-sm sm:text-base
        rounded-full font-medium
        transform hover:scale-105
        bg-white dark:bg-gray-800
        text-gray-600 dark:text-gray-200
        border-gray-200 dark:border-gray-700
      `}
      style={{
        borderColor: isHovered ? primaryColor : undefined,
        backgroundColor: isHovered ? `${primaryColor}1a` : undefined,
        color: isHovered ? primaryColor : undefined,
      }}
    >
      {getIcon(label)}
      <span>{label}</span>
    </button>
  );
};

interface ButtonSelectionProps {
  label: string; // Usually empty passed from Widget
  options: ({ label: string; value?: string } | string)[];
  onNext: (value: string) => void;
  primaryColor?: string;
}

export const ButtonSelection: React.FC<ButtonSelectionProps> = ({ label, options, onNext, primaryColor = '#4F46E5' }) => {
  return (
    <div className="w-full max-w-xs animate-fade-in">
      {label && <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4 text-center">{label}</h3>}
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((option, index) => {
          const optLabel = typeof option === 'string' ? option : option.label;
          const optValue = typeof option === 'string' ? option : (option.value || option.label);

          return (
            <SelectionOption
              key={index}
              label={optLabel}
              onClick={() => onNext(optValue)}
              primaryColor={primaryColor}
            />
          );
        })}
      </div>
    </div>
  );
};
