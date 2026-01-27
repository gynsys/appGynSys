import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subMonths, addMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DashboardCalendar({ appointments = [], title = "Calendario", type = "all", primaryColor = "#4F46E5" }) {
    // type: 'online', 'presencial', 'all'
    const [currentMonth, setCurrentMonth] = useState(new Date())

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

    // Filter appointments based on type
    const filteredAppointments = appointments.filter(app => {
        if (type === 'online') return app.location === 'Online (Videollamada)' || app.appointment_type === 'Consulta Online';
        if (type === 'presencial') return app.location !== 'Online (Videollamada)' && app.appointment_type !== 'Consulta Online';
        return true;
    });

    const getDayAppointments = (date) => {
        return filteredAppointments.filter(app => isSameDay(parseISO(app.appointment_date), date));
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-[350px] h-[376px]">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {title}
                </h3>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={handlePrevMonth}
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-white" />
                </button>

                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
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
            <div className="grid grid-cols-7 gap-0.5 w-fit mx-auto">
                {/* Week Day Headers */}
                {weekDays.map((day, idx) => (
                    <div
                        key={idx}
                        className="h-8 w-[40px] flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}

                {/* Day Cells */}
                {days.map((day, idx) => {
                    const dayApps = getDayAppointments(day);
                    const hasApps = dayApps.length > 0;

                    // Dynamic Today Style
                    const todayStyle = isToday(day)
                        ? { backgroundColor: `${primaryColor}20`, color: primaryColor, fontWeight: 'bold' }
                        : {};

                    const outsideClass = !isCurrentMonth(day) ? 'text-gray-400 dark:text-gray-600 opacity-50' : 'text-gray-900 dark:text-white'

                    return (
                        <div
                            key={idx}
                            className={`
                                h-[34px] w-[40px] rounded-md flex flex-col items-center justify-center text-sm relative
                                ${outsideClass}
                            `}
                            style={isToday(day) ? todayStyle : {}}
                        >
                            <span>{format(day, 'd')}</span>
                            {hasApps && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {dayApps.slice(0, 3).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: type === 'online' ? '#A855F7' : primaryColor }} // Purple for online, Primary for presencial
                                        ></div>
                                    ))}
                                    {dayApps.length > 3 && <div className="w-1 h-1 rounded-full bg-gray-400"></div>}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-base text-gray-500 justify-center">
                <div className="flex items-center gap-1">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: type === 'online' ? '#A855F7' : primaryColor }}
                    ></div>
                    <span>Cita {type === 'online' ? 'Online' : 'Presencial'}</span>
                </div>
            </div>
        </div>
    )
}
