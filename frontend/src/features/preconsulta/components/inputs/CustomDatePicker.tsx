import React, { useState, useEffect } from 'react';

interface Props {
    label: string;
    onNext: (val: string) => void;
    primaryColor?: string;
}

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export function CustomDatePicker({ label, onNext, primaryColor = '#4f46e5' }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleSubmit = () => {
        if (selectedDate) {
            // Return format YYYY-MM-DD
            const offset = selectedDate.getTimezoneOffset();
            const date = new Date(selectedDate.getTime() - (offset * 60 * 1000));
            onNext(date.toISOString().split('T')[0]);
        }
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = selectedDate?.getDate() === i &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getFullYear() === year;

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    style={isSelected ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${isSelected
                        ? '' // Base styles replaced by inline style
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="w-full max-w-md">
            <h3 className="text-xl font-medium text-gray-800 mb-1 text-center">{label}</h3>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h4 className="text-lg font-bold text-gray-900 capitalize">
                        {months[currentDate.getMonth()]} <span className="text-gray-500 font-normal">{currentDate.getFullYear()}</span>
                    </h4>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 mb-1">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-0 place-items-center">
                    {renderDays()}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selectedDate}
                style={{ backgroundColor: selectedDate ? primaryColor : undefined }}
                className={`mt-2 w-full py-2 px-6 rounded-xl font-bold text-lg transition-all shadow-lg ${!selectedDate ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white hover:transform hover:scale-[1.02] hover:opacity-90'}`}
            >
                Continuar
            </button>
        </div>
    );
}
