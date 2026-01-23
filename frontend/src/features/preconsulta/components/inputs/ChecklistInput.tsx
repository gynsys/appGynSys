import React, { useState } from 'react';
import { MdSend } from 'react-icons/md';

interface ChecklistInputProps {
  label: string;
  options?: string[];
  keyboardType?: string;
  onNext: (values: string[]) => void;
  otherPrompt?: string;
  primaryColor?: string;
}

export const ChecklistInput: React.FC<ChecklistInputProps> = ({
  label,
  onNext,
  options,
  keyboardType,
  otherPrompt,
  primaryColor = '#4F46E5'
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherValue, setOtherValue] = useState('');

  const finalOptions = options || [];

  const toggleOption = (option: string) => {
    const exclusiveOptions = ['Sin complicaciones', 'Ninguna', 'Ninguno'];

    if (exclusiveOptions.includes(option)) {
      if (selected.includes(option)) {
        setSelected(selected.filter(s => s !== option));
      } else {
        setSelected([option]);
      }
      return;
    }

    let newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];

    newSelected = newSelected.filter(s => !exclusiveOptions.includes(s));
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    let finalValues = selected.map(s => {
      if (s === 'Otro' && otherValue.trim()) {
        return `Otro: ${otherValue.trim()}`;
      }
      return s;
    });
    onNext(finalValues);
  };

  // Special render for radiales_mama
  if (keyboardType === 'radiales_mama') {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    return (
      <div className="w-full max-w-md animate-fade-in flex flex-col items-center">
        {label && <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-6 text-center">{label}</h3>}

        <div className="relative w-48 h-48 mb-6 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-inner">
          {/* Central Point or Crosshair decoration */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

          {hours.map((hour) => {
            const isSelected = selected.includes(hour.toString());
            // Calculate position
            const angle = (hour * 30 - 90) * (Math.PI / 180); // 12 is at -90deg (top)
            const radius = 75; // px
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <button
                key={hour}
                onClick={() => toggleOption(hour.toString())}
                className={`
                  absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all
                  transform -translate-x-1/2 -translate-y-1/2
                  ${isSelected
                    ? 'text-white shadow-lg scale-110'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
                style={{
                  top: `calc(50% + ${y}px)`,
                  left: `calc(50% + ${x}px)`,
                  backgroundColor: isSelected ? primaryColor : undefined,
                  borderColor: isSelected ? primaryColor : undefined,
                  zIndex: isSelected ? 10 : 1
                }}
              >
                {hour}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full max-w-xs py-3 rounded-full text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          Continuar <MdSend size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs animate-fade-in">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">{label}</h3>
      <div className="flex flex-col gap-2 mb-4">
        {finalOptions.map((option) => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={`w-full py-2 px-4 rounded-lg border text-left transition-all text-sm ${selected.includes(option)
              ? 'bg-opacity-10 font-bold border-transparent'
              : 'border-gray-200 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
              }`}
            style={selected.includes(option) ? { backgroundColor: `${primaryColor}1A`, color: primaryColor, border: `1px solid ${primaryColor}` } : {}}
          >
            {selected.includes(option) ? '✓ ' : ''}{option}
          </button>
        ))}

        {selected.includes('Otro') && (
          <div className="mt-2 animate-fade-in">
            <input
              type="text"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              placeholder="Especificar..."
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              style={{ paddingRight: '2.5rem', borderColor: primaryColor }} // Space for button
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="p-3 rounded-full text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95"
          style={{ backgroundColor: primaryColor }}
          title="Enviar respuestas"
        >
          <MdSend size={20} />
        </button>
      </div>
    </div>
  );
};
