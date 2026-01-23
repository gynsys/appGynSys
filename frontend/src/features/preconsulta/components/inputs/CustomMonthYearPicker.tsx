import React, { useState } from 'react';

interface Props {
    label: string;
    onNext: (val: string) => void;
    allowNever?: boolean;
    primaryColor?: string;
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function CustomMonthYearPicker({ label, onNext, allowNever = false, primaryColor = '#4f46e5' }: Props) {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

    const changeYear = (amount: number) => {
        setYear(prev => prev + amount);
        setSelectedMonth(null);
    };

    const handleMonthClick = (index: number) => {
        if (year === currentYear && index > new Date().getMonth()) return;
        setSelectedMonth(index);
    };

    const handleOption = (option: string) => {
        onNext(option);
    };

    const handleSubmit = () => {
        if (selectedMonth !== null) {
            const dateStr = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
            onNext(dateStr);
        }
    };

    return (
        <div className="w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-medium text-gray-800 mb-2 text-center">{label}</h3>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 px-2">
                    <button
                        onClick={() => changeYear(-1)}
                        className="text-xl font-bold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        &lt;
                    </button>
                    <h4 className="text-xl font-bold text-gray-800 tracking-wide">
                        {year}
                    </h4>
                    <button
                        onClick={() => changeYear(1)}
                        disabled={year >= currentYear}
                        className="text-xl font-bold text-gray-600 hover:text-gray-900 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        &gt;
                    </button>
                </div>

                {/* Months Grid - 4 columns as per image */}
                <div className="grid grid-cols-4 gap-x-2 gap-y-2">
                    {months.map((m, index) => {
                        /* Disable future months if current year */
                        const isFuture = year === currentYear && index > new Date().getMonth();
                        const isSelected = selectedMonth === index;

                        return (
                            <button
                                key={m}
                                disabled={isFuture}
                                onClick={() => handleMonthClick(index)}
                                style={isSelected ? { color: primaryColor, transform: 'scale(1.1)' } : {}}
                                className={`
                            text-sm font-bold uppercase tracking-wider transition-all
                            ${isSelected
                                        ? '' // Base class as fallback
                                        : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                                    }
                            ${isFuture ? 'text-gray-300 cursor-not-allowed' : ''}
                        `}
                            >
                                {m}
                            </button>
                        );
                    })}
                </div>
            </div>

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
                    className={`w-full py-2 px-6 rounded-lg font-bold text-lg transition-all shadow-lg ${selectedMonth === null ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white hover:transform hover:scale-[1.02] hover:opacity-90'}`}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};
