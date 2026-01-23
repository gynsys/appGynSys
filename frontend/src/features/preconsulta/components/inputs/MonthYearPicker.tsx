import React, { useState } from 'react';

interface MonthYearPickerProps {
  label: string;
  onNext: (value: string) => void;
  allowNever?: boolean;
  primaryColor?: string;
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ label, onNext, allowNever = false, primaryColor = '#4f46e5' }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const handleYearChange = (increment: number) => {
    setSelectedYear(prev => prev + increment);
    setSelectedMonth(null); // Reset month on year change
  };

  const handleMonthSelect = (index: number) => {
    if (selectedYear === currentYear && index > new Date().getMonth()) return;
    setSelectedMonth(index);
  };

  const handleSubmit = () => {
    if (selectedMonth !== null) {
      // Format: YYYY-MM-DD (Default to day 01)
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      onNext(dateStr);
    }
  };

  const handleOption = (val: string) => {
    onNext(val);
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-xl font-medium text-gray-800 mb-6 text-center">{label}</label>

      <div className="bg-white border-2 border-gray-400 rounded-xl p-2 shadow-sm animate-fade-in">
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-1 px-1">
          <button
            onClick={() => handleYearChange(-1)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-gray-800">{selectedYear}</span>
          <button
            onClick={() => handleYearChange(1)}
            disabled={selectedYear >= currentYear}
            className={`p-1 rounded-full transition-colors ${selectedYear >= currentYear
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-600'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-1 mb-1">
          {MONTHS.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              style={selectedMonth === index ? { backgroundColor: primaryColor, color: '#fff' } : {}}
              className={`py-1 text-sm rounded-lg font-medium transition-all ${selectedMonth === index
                ? 'shadow-md transform scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleOption('No recuerdo')}
            className="w-full bg-white border border-gray-400 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
          >
            No recuerdo
          </button>
          <button
            onClick={() => handleOption('Nunca')}
            className="w-full bg-white border border-gray-400 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors text-sm"
          >
            Nunca
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedMonth === null}
          style={{ backgroundColor: selectedMonth !== null ? primaryColor : undefined }}
          className={`w-full py-2 px-6 rounded-lg font-semibold transition-colors shadow-md ${selectedMonth === null ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white hover:opacity-90'}`}
        >
          Confirmar Fecha
        </button>
      </div>
    </div>
  );
};
