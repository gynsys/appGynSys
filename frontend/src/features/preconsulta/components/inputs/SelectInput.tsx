import React from 'react';

interface SelectOption {
  label: string;
  value?: string;
  next_node?: string;
}

interface SelectInputProps {
  label: string;
  options: (SelectOption | string)[];
  onNext: (value: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, options, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      onNext(val);
    }
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-xl font-medium text-gray-800 mb-6 text-center">{label}</label>

      <div className="relative mb-8">
        <select
          defaultValue=""
          onChange={handleChange}
          className="w-full p-4 pr-10 bg-white border-2 border-gray-400 rounded-xl text-lg text-gray-800 focus:border-primary-500 focus:ring-primary-500 appearance-none cursor-pointer transition-colors shadow-sm"
        >
          <option value="" disabled>Selecciona una opción</option>
          {options.map((opt, index) => {
            const label = typeof opt === 'string' ? opt : opt.label;
            const value = typeof opt === 'string' ? opt : (opt.value || opt.label);
            return (
              <option key={index} value={value}>
                {label}
              </option>
            );
          })}
        </select>

        {/* Custom Arrow Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
