import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CustomCalendar({ selected, onSelect, isPeriodDay, isFertileDay, isOvulationDay }) {
    const [currentMonth, setCurrentMonth] = useState(selected || new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: es })
    const endDate = endOfWeek(monthEnd, { locale: es })

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const isToday = (date) => isSameDay(date, new Date())
    const isCurrentMonth = (date) => date.getMonth() === currentMonth.getMonth()
    const isSelected = (date) => selected && isSameDay(date, selected)

    return (
        <div className="w-full max-w-sm mx-auto p-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={handlePrevMonth}
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-white" />
                </button>

                <h2 className="text-base font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>

                <button
                    onClick={handleNextMonth}
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                    <ChevronRight className="h-4 w-4 text-gray-800 dark:text-white" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Week Day Headers */}
                {weekDays.map((day, idx) => (
                    <div
                        key={idx}
                        className="h-9 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}

                {/* Day Cells */}
                {days.map((day, idx) => {
                    const isPeriod = isPeriodDay && isPeriodDay(day)
                    const isFertile = isFertileDay && isFertileDay(day)
                    const isOvulation = isOvulationDay && isOvulationDay(day)
                    const todayClass = isToday(day) ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-100 font-bold border border-pink-200 dark:border-pink-800' : ''
                    const selectedClass = isSelected(day) ? 'bg-pink-500 text-white hover:bg-pink-600' : ''
                    const outsideClass = !isCurrentMonth(day) ? 'text-gray-400 dark:text-gray-600 opacity-50' : 'text-gray-900 dark:text-white'

                    let markerClass = ''
                    if (isPeriod) markerClass = 'ring-2 ring-pink-400 ring-inset'
                    else if (isFertile) markerClass = 'ring-2 ring-teal-600 ring-inset'
                    else if (isOvulation) markerClass = 'ring-2 ring-teal-200 ring-inset'

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onSelect && onSelect(day)}
                            className={`
                                h-9 w-9 rounded-full flex items-center justify-center text-sm
                                transition-colors hover:bg-gray-100 dark:hover:bg-gray-700
                                ${outsideClass} ${todayClass} ${selectedClass} ${markerClass}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
