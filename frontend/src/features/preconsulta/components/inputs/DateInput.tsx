import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateInputProps {
  label: string;
  onNext: (value: string) => void;
}

export const DateInput: React.FC<DateInputProps> = ({ label, onNext }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Small delay to show selection then proceed, or just button? 
      // User asked for "faster selection". 
      // Auto-advance might be too aggressive if they misclick. 
      // Let's keep the button but make it very prominent.
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      onNext(formattedDate);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="text-xl font-medium text-gray-800 mb-6 text-center">{label}</h3>

      <div className="flex justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          locale={es}
          captionLayout="dropdown-buttons"
          fromYear={1950}
          toYear={new Date().getFullYear()}
          modifiersClassNames={{
            selected: 'bg-black text-white hover:bg-gray-800 rounded-full'
          }}
          styles={{
            head_cell: { width: '40px' },
            cell: { width: '40px' },
            day: { margin: 'auto' }
          }}
        />
      </div>

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="mt-6 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        Continuar
      </button>
    </div>
  );
};
