import React, { useState, useEffect } from 'react';
import { MdSend } from 'react-icons/md';

interface NumericInputProps {
  label: string;
  onNext: (value: string) => void;
  defaultValue?: string;
  primaryColor?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({ label, onNext, defaultValue = '', primaryColor = '#4F46E5' }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [label, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.toString().trim()) {
      const normalized = value.toString().replace(',', '.');
      onNext(normalized);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setValue(val);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {label && <label className="block text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">{label}</label>}

      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          className="w-full py-2 px-4 pr-14 border-2 border-gray-300 dark:border-gray-600 rounded-full text-lg transition-colors bg-white dark:bg-gray-800 dark:text-white shadow-sm dark:shadow-none"
          style={{
            borderColor: value ? primaryColor : undefined,
            outline: 'none'
          }}
          value={value}
          onChange={handleChange}
          placeholder="0"
          autoFocus
        />

        <button
          type="submit"
          disabled={!value.toString().trim()}
          className="absolute right-2 p-2 text-white rounded-full disabled:opacity-50 transition-none flex items-center justify-center"
          style={{ backgroundColor: value.toString().trim() ? primaryColor : '#9CA3AF' }}
          title="Enviar"
        >
          <MdSend size={20} className={!value.toString().trim() ? "ml-1" : "ml-0.5"} />
        </button>
      </div>
    </form>
  );
};
