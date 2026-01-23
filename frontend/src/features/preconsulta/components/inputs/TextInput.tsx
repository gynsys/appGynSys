import React, { useState } from 'react';
import { MdSend } from 'react-icons/md';

interface TextInputProps {
  label: string;
  onNext: (value: string) => void;
  defaultValue?: string;
  primaryColor?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, onNext, defaultValue = '', primaryColor = '#4F46E5' }) => {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onNext(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {/* Label is usually hidden by global logic but kept for a11y/fallback */}
      {label && <label className="block text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">{label}</label>}

      <div className="relative flex items-center">
        <input
          type="text"
          className="w-full py-2 px-4 pr-14 border-2 border-gray-300 dark:border-gray-600 rounded-full text-lg transition-colors bg-white dark:bg-gray-800 dark:text-white shadow-sm dark:shadow-none"
          style={{
            borderColor: isFocused ? primaryColor : undefined,
            outline: 'none'
          }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Escribe tu respuesta..."
          autoFocus
        />

        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-2 p-2 text-white rounded-full disabled:opacity-50 transition-none flex items-center justify-center"
          style={{ backgroundColor: value.trim() ? primaryColor : '#9CA3AF' }}
          title="Enviar"
        >
          <MdSend size={20} className={!value.trim() ? "ml-1" : "ml-0.5"} />
          {/* ml adjustment allows visual centering of the arrow icon */}
        </button>
      </div>
    </form>
  );
};
