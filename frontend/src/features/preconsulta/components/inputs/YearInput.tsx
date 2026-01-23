import React, { useState } from 'react';

interface YearInputProps {
  label: string;
  onNext: (value: string) => void;
}

export const YearInput: React.FC<YearInputProps> = ({ label, onNext }) => {
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const handlePrev = () => setViewYear(y => y - 6);
  const handleNext = () => setViewYear(y => Math.min(currentYear, y + 6));

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
  };

  const handleSubmit = () => {
    if (selectedYear) {
      onNext(selectedYear.toString());
    }
  };

  // Generate the 6 years ending at viewYear
  // Example: if viewYear is 2025, we want 2020, 2021, 2022, 2023, 2024, 2025
  const years = Array.from({ length: 6 }, (_, i) => viewYear - 5 + i);

  return (
    <div className="w-full max-w-md">
      <h3 className="text-xl font-medium text-gray-800 mb-6 text-center">{label}</h3>

      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border border-gray-300">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-xl font-bold text-gray-800">{viewYear}</span>

        <button
          onClick={handleNext}
          disabled={viewYear >= currentYear}
          className={`p-2 rounded-full transition-colors ${viewYear >= currentYear
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-600'
            }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Year Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => handleYearClick(y)}
            className={`py-4 px-2 rounded-lg text-lg font-medium transition-all border ${selectedYear === y
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
          >
            {y}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedYear}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${selectedYear
            ? 'bg-indigo-600 text-white hover:bg-gray-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
      >
        Continuar
      </button>
    </div>
  );
};
