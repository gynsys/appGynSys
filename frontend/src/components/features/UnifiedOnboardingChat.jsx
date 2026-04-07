import { useState, useEffect, useRef } from 'react';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale'; // New import
import { useAuthStore } from '../../store/authStore';
import { getImageUrl } from '../../lib/imageUtils';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { appointmentService } from '../../services/appointmentService';
import { locationService } from '../../services/locationService';
import { preconsultationService } from '../../services/preconsultationService';
import axios from '../../lib/axios'; // Existing axios import
import ModernLoader from '../common/ModernLoader';
// Merged and updated react-icons imports
import { MdSend, MdHistory, MdCalendarToday, MdAccessTime, MdLocationOn, MdCategory, MdCheckCircle, MdArrowBack } from 'react-icons/md';
import { IoMdClose, IoMdArrowBack } from 'react-icons/io';
import { FaUser, FaIdCard, FaMapMarkerAlt, FaPhone, FaCalendarAlt, FaBriefcase, FaEnvelope, FaStethoscope } from 'react-icons/fa';
import { FiCheck, FiX, FiCircle } from 'react-icons/fi';

// Dynamic Flow Data
import jsonDataFlow from '../../features/preconsulta/data/personal_info_flow.json';
import { PRECONSULTA_OPTIONS } from '../../features/preconsulta/data/options';
import { preconsultaTexts } from '../../features/preconsulta/data/texts'; // Added

// Helper: Parse Schedule String to Allowed Days (0=Sun, 1=Mon, ..., 6=Sat)
const parseAllowedDays = (scheduleString) => {
  if (!scheduleString) return [1, 2, 3, 4, 5]; // Default M-F

  const s = scheduleString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normalize accents (Sábado -> Sabado)
  const days = new Set();

  // Regex helpers for whole words
  const has = (word) => new RegExp(`\\b${word}\\b`).test(s);
  const hasPartial = (str) => s.includes(str);

  // 1. Check Ranges first
  if (hasPartial('lunes a viernes') || hasPartial('l-v') || hasPartial('l a v')) {
    [1, 2, 3, 4, 5].forEach(d => days.add(d));
  }

  // 2. Check individual days
  if (has('lunes') || has('lun') || has('lu')) days.add(1);
  if (has('martes') || has('mar') || has('ma')) days.add(2);
  if (has('miercoles') || has('mie') || has('mi')) days.add(3);
  if (has('jueves') || has('jue') || has('ju')) days.add(4);
  if (has('viernes') || has('vie') || has('vi')) days.add(5);
  // "Sabado" might be "Sabados", so check root
  if (hasPartial('sabado') || has('sab') || has('sa')) days.add(6);
  if (hasPartial('domingo') || has('dom') || has('do')) days.add(0);

  // If no specific days found (and not range), fallback to M-F
  // But if we found ANY day, return only those.
  if (days.size === 0) return [1, 2, 3, 4, 5];

  return Array.from(days).sort();
};

// Helper: Generate next N valid dates
const generateSmartDates = (allowedDays, count = 3, startDate = new Date()) => {
  const dates = [];
  let current = new Date(startDate);
  current.setDate(current.getDate() + 1); // Start from tomorrow

  // Safety break to prevent infinite loop if allowedDays is empty
  let safety = 0;
  while (dates.length < count && safety < 30) {
    const day = current.getDay();
    if (allowedDays.includes(day)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
    safety++;
  }
  return dates;
};

// Helper: Format Date for Button (e.g., "Lun 12")
const formatSmartDate = (date) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[date.getDay()]} ${date.getDate()}`;
};

// Helper: Parse hours from string (e.g. "8am a 12pm" -> [8, 12])
const parseTimeRange = (timeStr) => {
  if (!timeStr) return null;
  const s = timeStr.toLowerCase().replace(/\s/g, ''); // remove spaces

  // Regex for "8am-12pm", "8:00-12:00", "8a12"
  // Capture groups: 1=StartHour, 2=StartAmpm, 3=EndHour, 4=EndAmpm
  const match = s.match(/(\d{1,2})(?::00)?(?:am|pm)?(?:-|a|to)(\d{1,2})(?::00)?(am|pm)?/);

  if (match) {
    let start = parseInt(match[1]);
    let end = parseInt(match[2]);
    const endAmpm = match[3]; // often only the end has pm e.g "8-12pm"

    // Basic AM/PM logic
    // If end is small (1, 2, 3, 4, 5) and has pm, add 12.
    if (endAmpm === 'pm' && end < 12) end += 12;
    // If start is small (1-6) and end > 12, start is likely PM too? No, usually 1pm-5pm.
    // Let's assume standard business hours if ambiguous.
    // If 8-12, assume 8am-12pm.

    return { start, end };
  }
  return null;
}

const generateSmartTimes = (scheduleStr) => {
  // Default Slots
  const defaultSlots = ['09:00', '10:00', '14:00', '16:00'];
  if (!scheduleStr) return defaultSlots;

  const range = parseTimeRange(scheduleStr);
  if (!range) return defaultSlots; // Fallback if no range detected

  const { start, end } = range;
  const slots = [];

  // Generate valid hours
  for (let h = start; h < end; h++) {
    // Skip lunch hour? Maybe not logic for now.
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // If we have too many slots, maybe just pick 4 evenly distributed?
  // For now, return first 4 or all if less.
  return slots.slice(0, 4);
}

// Helper: Format Allowed Days to Natural Spanish
const formatDaysText = (allowedDays) => {
  if (!allowedDays || allowedDays.length === 0) return "los días de consulta";
  
  const dayNamesSingular = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayNamesPlural = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
  const sortedDays = [...allowedDays].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)); // Sort starting from Monday
  
  if (sortedDays.length === 1) {
    return `los días ${dayNamesPlural[sortedDays[0]]}`;
  }

  // Check for Lunes a Viernes [1,2,3,4,5]
  const isMF = sortedDays.length === 5 && sortedDays.join('') === '12345';
  if (isMF) return "lunes a viernes";

  // Check for continuous range
  let continuous = true;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] !== sortedDays[i-1] + 1) {
      continuous = false;
      break;
    }
  }

  if (continuous && sortedDays.length > 2) {
    return `${dayNamesSingular[sortedDays[0]]} a ${dayNamesSingular[sortedDays[sortedDays.length - 1]]}`;
  }

  // List days (Lunes, Miércoles y Viernes)
  const names = sortedDays.map(d => dayNamesPlural[d]);
  if (names.length === 2) {
    return `los días ${names[0]} y ${names[1]}`;
  }
  
  const last = names.pop();
  return `los días ${names.join(', ')} y ${last}`;
};

// Helper: Capitalize words
const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Simple Input Component
const SimpleInput = ({ placeholder, onSubmit, type = 'text', autoFocus = true, numericOnly = false, primaryColor }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
    // Keep focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (numericOnly) {
      val = val.replace(/[^0-9]/g, ''); // Strip non-numeric chars
    }
    setValue(val);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type={type === 'number' ? 'text' : type}
          inputMode={numericOnly ? 'numeric' : undefined}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-full px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 dark:text-white transition-all shadow-sm"
          style={{
            '--tw-ring-color': primaryColor,
            borderColor: value ? primaryColor : undefined
          }}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevent blur on mobile
          className="absolute right-2 p-1.5 rounded-full disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center shadow-md"
          style={{
            backgroundColor: value.trim() ? primaryColor : '#9CA3AF',
            color: 'white'
          }}
          title="Enviar"
        >
          <MdSend size={18} className={!value.trim() ? "ml-0.5" : ""} />
        </button>
      </div>
    </form>
  );
};

SimpleInput.propTypes = {
  placeholder: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  type: PropTypes.string,
  autoFocus: PropTypes.bool,
  numericOnly: PropTypes.bool,
  primaryColor: PropTypes.string.isRequired,
};

// Scale Input Component (Visual 1-10)
const ScaleInput = ({ onSubmit, primaryColor }) => {
  const handleSelect = (val) => {
    onSubmit(val.toString());
  };

  const ScaleButton = ({ value }) => (
    <button
      onClick={() => handleSelect(value)}
      className="bg-white dark:bg-gray-100 hover:bg-gray-200 dark:hover:bg-white text-gray-800 font-bold border-2 border-transparent hover:border-indigo-500 rounded-xl py-2 px-1 text-sm transition-all shadow-sm active:scale-95 flex-1"
    >
      {value}
    </button>
  );

  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      <div
        className="p-3 rounded-2xl shadow-xl space-y-3"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Leve: 1, 2, 3 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-black text-white uppercase tracking-wider w-16 text-center sm:text-left">Leve</span>
          <div className="flex gap-1.5 flex-1">
            <ScaleButton value={1} />
            <ScaleButton value={2} />
            <ScaleButton value={3} />
          </div>
        </div>

        {/* Moderado: 4, 5, 6 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-black text-white uppercase tracking-wider w-16 text-center sm:text-left">Moderado</span>
          <div className="flex gap-1.5 flex-1">
            <ScaleButton value={4} />
            <ScaleButton value={5} />
            <ScaleButton value={6} />
          </div>
        </div>

        {/* Intenso: 7, 8, 9, 10 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-black text-white uppercase tracking-wider w-16 text-center sm:text-left">Intenso</span>
          <div className="flex gap-1.5 flex-1">
            <ScaleButton value={7} />
            <ScaleButton value={8} />
            <ScaleButton value={9} />
            <ScaleButton value={10} />
          </div>
        </div>
      </div>
    </div>
  );
};

ScaleInput.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  primaryColor: PropTypes.string.isRequired,
};

// Date Picker Component (Visual Calendar)
const DatePicker = ({ onSubmit, primaryColor }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleSubmit = () => {
    if (selectedDate) {
      const offset = selectedDate.getTimezoneOffset();
      const date = new Date(selectedDate.getTime() - (offset * 60 * 1000));
      onSubmit(date.toISOString().split('T')[0]);
    }
  };

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
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected
          ? ''
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h4 className="text-sm font-black text-gray-900 dark:text-white capitalize">
            {months[month]} <span className="text-gray-500 font-normal">{year}</span>
          </h4>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 place-items-center">
          {days}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        style={{ backgroundColor: selectedDate ? primaryColor : undefined }}
        className={`mt-3 w-full py-3 px-6 rounded-xl font-black text-sm transition-all shadow-lg ${!selectedDate ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white hover:transform hover:scale-[1.02] hover:opacity-90'}`}
      >
        CONTINUAR
      </button>
    </div>
  );
};

DatePicker.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  primaryColor: PropTypes.string.isRequired,
};

// Month Year Picker Component (Visual Month Grid)
const MonthYearPicker = ({ onSubmit, primaryColor }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const handleMonthClick = (index) => {
    if (year === currentYear && index > new Date().getMonth()) return;
    setSelectedMonth(index);
  };

  const handleSubmit = () => {
    if (selectedMonth !== null) {
      const dateStr = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      onSubmit(dateStr);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={() => setYear(prev => prev - 1)} className="text-xl font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">&lt;</button>
          <h4 className="text-lg font-black text-gray-800 dark:text-white tracking-wide">{year}</h4>
          <button 
            onClick={() => setYear(prev => prev + 1)} 
            disabled={year >= currentYear}
            className="text-xl font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
          >&gt;</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {months.map((m, index) => {
            const isFuture = year === currentYear && index > new Date().getMonth();
            const isSelected = selectedMonth === index;
            return (
              <button
                key={m}
                disabled={isFuture}
                onClick={() => handleMonthClick(index)}
                style={isSelected ? { backgroundColor: primaryColor, color: '#fff' } : {}}
                className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${isSelected ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'} ${isFuture ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onSubmit('No recuerdo')} className="py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all">No recuerdo</button>
        <button onClick={() => onSubmit('Nunca')} className="py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all">Nunca</button>
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedMonth === null}
        style={{ backgroundColor: selectedMonth !== null ? primaryColor : undefined }}
        className={`mt-2 w-full py-3 px-6 rounded-xl font-black text-sm transition-all shadow-lg ${selectedMonth === null ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white hover:transform hover:scale-[1.02] hover:opacity-90'}`}
      >
        CONTINUAR
      </button>
    </div>
  );
};

MonthYearPicker.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  primaryColor: PropTypes.string.isRequired,
};

// Selection Option for Buttons
const SelectionOption = ({ label, onClick, primaryColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = (text) => {
    const t = text.toLowerCase();
    if (t === 'sí' || t === 'si' || t.startsWith('sí,') || t.startsWith('si,')) return <FiCheck className="text-lg" />;
    if (t === 'no' || t.startsWith('no,')) return <FiX className="text-lg" />;
    return <FiCircle className="text-xs opacity-40" />;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center justify-center gap-2 border transition-all shadow-sm py-2 px-4 text-xs sm:text-sm rounded-full font-bold transform hover:scale-105 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-700 active:scale-95"
      style={{
        borderColor: isHovered ? primaryColor : undefined,
        backgroundColor: isHovered ? `${primaryColor}1a` : undefined,
        color: isHovered ? primaryColor : undefined,
      }}
    >
      {getIcon(label)}
      <span>{label}</span>
    </button>
  );
};

// Button Selection Component
const ButtonSelection = ({ options, onNext, primaryColor }) => {
  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option, index) => {
          const optLabel = typeof option === 'string' ? option : option.label;
          const optValue = typeof option === 'string' ? option : (option.value || option.label);
          return (
            <SelectionOption
              key={index}
              label={optLabel}
              onClick={() => onNext(optValue)}
              primaryColor={primaryColor}
            />
          );
        })}
      </div>
    </div>
  );
};

// Yes/No Input Component
const YesNoInput = ({ onNext, primaryColor }) => {
  const [isYesHovered, setIsYesHovered] = useState(false);
  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => onNext('Sí')}
          onMouseEnter={() => setIsYesHovered(true)}
          onMouseLeave={() => setIsYesHovered(false)}
          className="flex items-center gap-2 border py-3 px-8 rounded-full font-black text-sm transition-all shadow-md hover:scale-105 active:scale-95"
          style={{
            borderColor: `${primaryColor}4d`,
            backgroundColor: isYesHovered ? `${primaryColor}33` : `${primaryColor}1a`,
            color: primaryColor,
          }}
        >
          <FiCheck className="text-lg" />
          Sí
        </button>
        <button
          onClick={() => onNext('No')}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 py-3 px-8 rounded-full font-black text-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <FiX className="text-lg" />
          No
        </button>
      </div>
    </div>
  );
};

// Checklist Input Component
const ChecklistInput = ({ options, keyboardType, onNext, primaryColor }) => {
  const [selected, setSelected] = useState([]);
  const [otherValue, setOtherValue] = useState('');

  const toggleOption = (option) => {
    const exclusiveOptions = ['Sin complicaciones', 'Ninguna', 'Ninguno'];
    if (exclusiveOptions.includes(option)) {
      if (selected.includes(option)) {
        setSelected(selected.filter(s => s !== option));
      } else {
        setSelected([option]);
      }
      return;
    }
    let newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];
    newSelected = newSelected.filter(s => !exclusiveOptions.includes(s));
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    let finalValues = selected.map(s => {
      if (s === 'Otro' && otherValue.trim()) return `Otro: ${otherValue.trim()}`;
      return s;
    });
    onNext(finalValues.join(', '));
  };

  if (keyboardType === 'radiales_mama') {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return (
      <div className="w-full max-w-sm animate-fade-in flex flex-col items-center mx-auto">
        <div className="relative w-40 h-40 mb-6 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          {hours.map((hour) => {
            const isSelected = selected.includes(hour.toString());
            const angle = (hour * 30 - 90) * (Math.PI / 180);
            const radius = 65; 
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            return (
              <button
                key={hour}
                onClick={() => toggleOption(hour.toString())}
                className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] transition-all transform -translate-x-1/2 -translate-y-1/2 active:scale-90 ${isSelected ? 'text-white shadow-lg scale-110' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'}`}
                style={{ top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`, backgroundColor: isSelected ? primaryColor : undefined, borderColor: isSelected ? primaryColor : undefined, zIndex: isSelected ? 10 : 1 }}
              >
                {hour}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full py-3 rounded-xl text-white font-black text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          CONTINUAR <MdSend size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      <div className="flex flex-col gap-2 mb-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={`w-full py-2.5 px-4 rounded-xl border text-left transition-all text-xs font-bold active:scale-95 ${selected.includes(option) ? 'bg-opacity-10 border-transparent' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            style={selected.includes(option) ? { backgroundColor: `${primaryColor}1A`, color: primaryColor, border: `1px solid ${primaryColor}` } : {}}
          >
            {selected.includes(option) ? '✓ ' : ''}{option}
          </button>
        ))}
        {selected.includes('Otro') && (
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            placeholder="Especificar..."
            className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none ring-1 ring-transparent focus:ring-indigo-500"
            autoFocus
          />
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className="w-full py-3 rounded-xl text-white font-black text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
        style={{ backgroundColor: primaryColor }}
      >
        CONTINUAR <MdSend size={18} />
      </button>
    </div>
  );
};

ChecklistInput.propTypes = {
  options: PropTypes.array.isRequired,
  keyboardType: PropTypes.string,
  onNext: PropTypes.func.isRequired,
  primaryColor: PropTypes.string.isRequired,
};

// Year Input Component
const YearInput = ({ label, onNext, primaryColor }) => {
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(currentYear);
  const [selectedYear, setSelectedYear] = useState(null);

  const handlePrev = () => setViewYear(y => y - 6);
  const handleNext = () => setViewYear(y => Math.min(currentYear, y + 6));

  const years = Array.from({ length: 6 }, (_, i) => viewYear - 5 + i);

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in text-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <label className="block text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">{label}</label>
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xl font-black text-gray-800 dark:text-white">{viewYear}</span>
          <button 
            onClick={handleNext} 
            disabled={viewYear >= currentYear}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 disabled:opacity-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              style={selectedYear === y ? { backgroundColor: primaryColor, color: '#fff' } : {}}
              className={`py-4 text-sm font-black rounded-xl border transition-all ${selectedYear === y ? 'shadow-md scale-105' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => onNext(selectedYear.toString())}
        disabled={!selectedYear}
        style={{ backgroundColor: selectedYear ? primaryColor : undefined }}
        className={`mt-4 w-full py-3 px-6 rounded-xl font-black text-sm transition-all shadow-lg text-white disabled:bg-gray-200 disabled:text-gray-500`}
      >
        CONTINUAR
      </button>
    </div>
  );
};

// Select Input Component (Dropdown)
const SelectInput = ({ label, options, onNext, primaryColor }) => {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val) onNext(val);
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <div className="relative">
        <select
          defaultValue=""
          onChange={handleChange}
          className="w-full p-4 pr-10 bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-white appearance-none cursor-pointer transition-colors shadow-sm focus:outline-none"
          style={{ borderColor: primaryColor }}
        >
          <option value="" disabled>Selecciona una opción</option>
          {options.map((opt, index) => {
            const labelStr = typeof opt === 'string' ? opt : opt.label;
            const valueStr = typeof opt === 'string' ? opt : (opt.value || opt.label);
            return (
              <option key={index} value={valueStr}>{labelStr}</option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7-7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};

// Obstetric Table Component
const ObstetricTable = ({ onNext, primaryColor }) => {
  const [counts, setCounts] = useState({ gestas: '', partos: '', cesareas: '', abortos: '' });
  const [step, setStep] = useState('counters');
  const [childrenDetails, setChildrenDetails] = useState([]);

  const totalBirths = (parseInt(counts.partos) || 0) + (parseInt(counts.cesareas) || 0);

  useEffect(() => {
    if (childrenDetails.length !== totalBirths) {
      const newDetails = Array(totalBirths).fill(null).map((_, i) => ({
        id: `child_${Date.now()}_${i}`,
        year: '',
        type: i < (parseInt(counts.partos) || 0) ? 'Parto' : 'Cesarea',
        weight: '',
        height: '',
        complications: 'Sin complicaciones'
      }));
      setChildrenDetails(newDetails);
    }
  }, [totalBirths]);

  const handleCountChange = (field, val) => {
    if (val === '' || /^\d+$/.test(val)) setCounts(prev => ({ ...prev, [field]: val }));
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...childrenDetails];
    updated[index] = { ...updated[index], [field]: value };
    setChildrenDetails(updated);
  };

  const toRoman = (num) => {
    if (num <= 0) return '0';
    const val = [10, 9, 5, 4, 1];
    const syb = ["X", "IX", "V", "IV", "I"];
    let roman = '';
    let i = 0, n = num;
    while (n > 0) {
      while (n >= val[i]) { roman += syb[i]; n -= val[i]; }
      i++;
    }
    return roman;
  };

  const handleSubmit = () => {
    const g = parseInt(counts.gestas) || 0, p = parseInt(counts.partos) || 0, c = parseInt(counts.cesareas) || 0, a = parseInt(counts.abortos) || 0;
    let parts = [];
    if (g > 0) parts.push(`${toRoman(g)}G`);
    if (p > 0) parts.push(`${toRoman(p)}P`);
    if (c > 0) parts.push(`${toRoman(c)}C`);
    if (a > 0) parts.push(`${toRoman(a)}A`);
    const summary = parts.length > 0 ? parts.join(' ') : 'Nuligesta';
    onNext({ ...counts, children: childrenDetails, summary });
  };

  if (step === 'counters') {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-in p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
        <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 text-center tracking-widest">RESUMEN OBSTÉTRICO</h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {['gestas', 'partos', 'cesareas', 'abortos'].map(field => (
            <div key={field} className="flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase mb-1">{field}</span>
              <input
                type="number"
                value={counts[field]}
                onChange={(e) => handleCountChange(field, e.target.value)}
                className="w-16 h-12 text-center text-xl font-black border-2 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                style={{ borderColor: counts[field] ? primaryColor : undefined }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => totalBirths > 0 ? setStep('details') : handleSubmit()}
          className="w-full py-3 rounded-xl text-white font-black text-sm shadow-lg transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          {totalBirths > 0 ? 'SIGUIENTE: DETALLAR HIJOS' : 'FINALIZAR'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto max-h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DETALLE DE NACIMIENTOS</h4>
        <button onClick={() => setStep('counters')} className="text-[10px] font-black text-indigo-500 underline">VOLVER</button>
      </div>
      <div className="space-y-4 mb-6">
        {childrenDetails.map((child, index) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <p className="text-[10px] font-black mb-2 text-indigo-500 uppercase">Hijo #{index + 1} ({child.type})</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input placeholder="Año" type="number" value={child.year} onChange={(e) => handleDetailChange(index, 'year', e.target.value)} className="p-2 text-[10px] border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none" />
              <input placeholder="Peso (kg)" value={child.weight} onChange={(e) => handleDetailChange(index, 'weight', e.target.value)} className="p-2 text-[10px] border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none" />
            </div>
            <select value={child.complications} onChange={(e) => handleDetailChange(index, 'complications', e.target.value)} className="w-full p-2 text-[10px] border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none">
              <option value="Sin complicaciones">Sin complicaciones</option>
              {['Preeclampsia', 'Hemorragia', 'Distocia', 'Infección', 'Placenta previa', 'Otras'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-white font-black text-sm shadow-lg transition-all" style={{ backgroundColor: primaryColor }}>
        GUARDAR HISTORIAL
      </button>
    </div>
  );
};

export default function UnifiedOnboardingChat({ doctorId, doctor = {}, onClose, onRequireAuth }) {
  // Auth Store
  const { isCycleAuthenticated, cycleUser } = useAuthStore();

  // Brand Color
  const primaryColor = doctor?.theme_primary_color || '#4F46E5';

  // Constants
  const STEPS = {
    NAME: 'NAME',
    DNI: 'DNI',        // Moved up
    AGE: 'AGE',
    MENOPAUSE_BASIC: 'MENOPAUSE_BASIC', // Check menopause if age >= 45
    RESIDENCE: 'RESIDENCE', // New Step
    TYPE: 'TYPE',
    REASON: 'REASON',
    LOCATION: 'LOCATION',
    DATE_SUGGESTION: 'DATE_SUGGESTION', // Smart Step
    TIME_SUGGESTION: 'TIME_SUGGESTION', // Smart Step
    DATE_MANUAL: 'DATE_MANUAL',         // Fallback
    TIME_MANUAL: 'TIME_MANUAL',         // Fallback
    PHONE: 'PHONE',
    OCCUPATION: 'OCCUPATION',
    EMAIL: 'EMAIL',
    RECURRENT_CONFIRM: 'RECURRENT_CONFIRM', 
    PRECONSULTA_INTRO: 'PRECONSULTA_INTRO', // New
    PRECONSULTA_QUESTION: 'PRECONSULTA_QUESTION', // New
    PRECONSULTA_FINISH: 'PRECONSULTA_FINISH',
    CONFIRM: 'CONFIRM',
    SUCCESS: 'SUCCESS'
  };

  // State
  const [step, setStep] = useState(STEPS.NAME);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [canFocus, setCanFocus] = useState(false); 

  // 4. Preconsultation State (Dynamic Engine)
  const [preconsultaState, setPreconsultaState] = useState({
    currentNodeId: null,
    history: [],
    answers: {},
    isFinished: false,
    loopState: null
  });

  // Helper to sync booking data to preconsulta answers
  const syncFormDataToAnswers = (data) => {
    return {
      full_name: data.patient_name || '',
      ci: data.patient_dni || '',
      age: data.patient_age || '',
      phone: data.patient_phone || '',
      address: data.residence || '',
      occupation: data.occupation || '',
      email: data.patient_email || ''
    };
  };

  // Logic to determine the next node (Ported from usePreconsultaEngine)
  const getNextNodeId = (node, value, currentAnswers) => {
    if (node.next_if_contains && Array.isArray(value)) {
      if (value.includes(node.next_if_contains.value)) {
        return node.next_if_contains.next_node;
      }
    }
    if (node.type === 'yes_no') {
      const isYes = value === true || value === 'Sí' || value === 'Yes' || value === 'Si';
      if (isYes && node.next_on_yes) return node.next_on_yes;
      if (!isYes && node.next_on_no) return node.next_on_no;
    }
    if ((node.type === 'buttons' || node.type === 'dropdown' || node.type === 'loop_buttons' || node.type === 'select') && node.options) {
      const selectedOption = node.options.find((opt) => opt.label === value || opt.value === value || opt === value);
      if (selectedOption && selectedOption.next_node) return selectedOption.next_node;
    }
    if (node.next_node) return node.next_node;
    return null;
  };

  // Mock logic for "Action" nodes (Ported from usePreconsultaEngine)
  const handleActionNode = (node, pendingAnswers) => {
    const { handler } = node;
    const answers = { ...preconsultaState.answers, ...pendingAnswers };

    switch (handler) {
      case 'calculate_imc': {
        const peso = parseFloat(answers.peso_kg || 0);
        const altura = parseFloat(answers.altura_m || 0);
        if (peso > 0 && altura > 0) {
          const imc = (peso / (altura * altura)).toFixed(2);
          return { nextId: node.next_node || null, sideEffect: { imc_calculado: imc } };
        }
        return { nextId: node.next_node || null };
      }
      
      case 'decide_if_ask_frequency':
        return { nextId: answers.gyn_cycles === 'Regulares' ? node.next_if_regular : node.next_if_irregular };
      
      case 'check_if_pregnant_for_fertility':
        const obstetricType = answers.obstetric_history_type;
        const hasBeenPregnant = obstetricType === 'Primigesta' || obstetricType === 'Multigesta';
        return { nextId: hasBeenPregnant ? node.next_if_skip_fertility : node.next_if_ask_fertility };

      case 'decide_if_ask_mac_checklist':
        return { nextId: answers.gyn_mac_bool === 'Sí' ? node.next_if_yes : node.next_if_no };

      case 'check_functional_exam_enabled':
        const doctorConfig = doctor;
        const enabled = doctorConfig.include_functional_exam !== false;
        return { nextId: enabled ? node.next_if_enabled : node.next_if_disabled };

      case 'calculate_ho_action': {
        const type = answers.obstetric_history_type;
        const ho = answers.ho_table_results || {};
        const g = parseInt(ho.gestas) || 0;
        const p = parseInt(ho.partos) || 0;
        const c = parseInt(ho.cesareas) || 0;
        const a = parseInt(ho.abortos) || 0;
        
        const summary = g > 0 ? `${g}G ${p}P ${c}C ${a}A` : (type || 'Nuligesta');
        return { 
          nextId: node.next_node || 'ASK_SEXUALLY_ACTIVE', 
          sideEffect: { obstetric_history_summary: summary } 
        };
      }

      case 'combine_irregular_cycle_info':
      case 'combine_regular_cycle_info':
        return { nextId: node.next_node || 'ASK_DYSMENORRHEA_BOOL' };

      case 'combine_dysmenorrhea_info':
        return { nextId: node.next_node || 'ASK_FUM' };

      case 'decide_if_ask_menopause': {
        const age = parseInt(answers.age) || 0;
        // If already answered in basic flow, skip it
        if (answers.is_menopause) {
          return { nextId: node.next_if_no }; 
        }
        return { nextId: age >= 45 ? node.next_if_yes : node.next_if_no };
      }

      case 'decide_if_menopause_skip': {
        const isMenopause = answers.is_menopause === 'Sí' || answers.is_menopause === 'Si' || answers.is_menopause === true;
        return { nextId: isMenopause ? node.next_if_skip : node.next_if_stay };
      }

      case 'finish_preconsultation':
      case 'generate_summaries':
        return { nextId: null, isFinished: true };

      default:
        return { nextId: node.next_node || null };
    }
  };

  const goToNextPreconsulta = (value) => {
    const currentNode = jsonDataFlow.nodes[preconsultaState.currentNodeId];
    let pendingAnswers = {};

    if (currentNode.save_to && value !== undefined) {
      let finalValue = value;
      if (currentNode.type === 'yes_no') {
        if (value === true || value === 'Sí' || value === 'Si') finalValue = currentNode.value_on_yes || 'Sí';
        if (value === false || value === 'No') finalValue = currentNode.value_on_no || 'No';
      }
      pendingAnswers[currentNode.save_to] = finalValue;
    }

    let nextId = getNextNodeId(currentNode, value, { ...preconsultaState.answers, ...pendingAnswers });
    let totalSideEffects = { ...pendingAnswers };

    // Process Actions
    while (nextId && jsonDataFlow.nodes[nextId]?.type === 'action') {
      const result = handleActionNode(jsonDataFlow.nodes[nextId], totalSideEffects);
      if (result.sideEffect) totalSideEffects = { ...totalSideEffects, ...result.sideEffect };
      if (result.isFinished) {
        setPreconsultaState(prev => ({ 
          ...prev, 
          answers: { ...prev.answers, ...totalSideEffects },
          isFinished: true 
        }));
        // handleFinalSubmit({ ...preconsultaState.answers, ...totalSideEffects }); // Assuming this is called elsewhere
        return;
      }
      nextId = result.nextId;
    }

    if (!nextId) {
      setPreconsultaState(prev => ({ 
        ...prev, 
        answers: { ...prev.answers, ...totalSideEffects },
        isFinished: true 
      }));
      // handleFinalSubmit({ ...preconsultaState.answers, ...totalSideEffects }); // Assuming this is called elsewhere
      return;
    }

    setPreconsultaState(prev => ({
      ...prev,
      history: [...prev.history, prev.currentNodeId],
      currentNodeId: nextId,
      answers: { ...prev.answers, ...totalSideEffects }
    }));

    // Add message to chat
    const displayValue = Array.isArray(value) ? value.join(', ') : (typeof value === 'object' && value?.summary ? value.summary : value);
    addMessage(displayValue, 'user');
    
    // Usually the engine waits for user input or handles actions.
  };

  // Pre-consultation specific state
  const [preconsultationQuestions, setPreconsultationQuestions] = useState(null); // Use null for loading state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [preconsultationAnswers, setPreconsultationAnswers] = useState({});

  // Delay autoFocus to prevent layout jumps during modal entrance
  useEffect(() => {
    const timer = setTimeout(() => setCanFocus(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Smart Logic State
  const [suggestedDates, setSuggestedDates] = useState([]);
  const [suggestedTimes, setSuggestedTimes] = useState([]);

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_dni: '',
    patient_age: '',
    residence: '',      // Added residence
    appointment_type: '',
    reason_for_visit: '',
    location: null,
    date_part: '', // YYYY-MM-DD
    time_part: '', // HH:MM
    patient_phone: '',
    occupation: '',
    patient_email: ''
  });

  const messagesEndRef = useRef(null);

  // Initialize Chat
  useEffect(() => {
    const initFlow = async () => {
      // Only initialize if history is empty to prevent resets when doctor data updates
      if (history.length > 0) return;

      let name = doctor?.doctor_name || doctor?.nombre_completo || 'Doctor';
      const hasTitle = typeof name === 'string' && name.toLowerCase().startsWith('dr');
      const isFemale = typeof name === 'string' && name.toLowerCase().includes('dra.');
      // Use dynamic prefix and enforce 4 lines for aesthetics
      let finalPrefix = 'de';
      if (isFemale) {
        finalPrefix = 'de la';
      } else if (hasTitle) {
        finalPrefix = 'del';
      }

      if (isCycleAuthenticated && cycleUser) {
        try {
          const res = await appointmentService.getPatientByEmail(cycleUser.email);
          
          let greeting = '¡Hola!';
          const firstNameRaw = cycleUser.nombre_completo || 'Paciente';
          if (cycleUser.nombre_completo && cycleUser.nombre_completo.trim() !== '') {
            greeting = `Hola Sra. <span class="font-bold">${cycleUser.nombre_completo}</span>.`;
          }

          if (res.exists) {
            if (res.needs_verification) {
              setHistory([
                {
                  type: 'bot',
                  text: `<p class="mb-2">${greeting}</p><p>⚠️ Para poder agendar más citas, tu cuenta debe estar verificada. Acabamos de enviarte un correo nuevo con el enlace de confirmación. ¡Haz clic en él para continuar!</p>`
                }
              ]);
              setStep('BLOCKED_VERIFICATION');
              return;
            }

            if (res.patient_data.patient_dni) {
              const pd = res.patient_data;
              const firstName = pd.patient_name.split(' ')[0];
              
              setFormData(prev => ({
                ...prev,
                patient_name: pd.patient_name,
                patient_email: pd.patient_email,
                patient_dni: pd.patient_dni,
                patient_age: pd.patient_age,
                patient_phone: pd.patient_phone,
                residence: pd.residence || '',
                occupation: pd.occupation || ''
              }));
              
              // Check if we have all basic data to skip to TYPE
              if (pd.patient_phone && pd.occupation && pd.patient_email) {
                setHistory([
                  {
                    type: 'bot',
                    text: `<p class="mb-1">¡Qué gusto verte de nuevo Sra. <span class="font-bold">${firstName}</span>! 🎉</p><p class="mb-1">Ya tengo tus datos básicos en el sistema.</p><p class="font-bold">Para agilizar, ¿Qué tipo de consulta precisas hoy?</p>`
                  }
                ]);
                setStep(STEPS.TYPE);
              } else {
                // Return to normal flow from the first missing piece
                setHistory([
                  {
                    type: 'bot',
                    text: `<p class="mb-1">¡Qué gusto verte de nuevo Sra. <span class="font-bold">${firstName}</span>! 🎉</p><p class="mb-1">Veo que nos faltan algunos datos en tu perfil. Vamos a completarlos rápidamente.</p>`
                  }
                ]);
                if (!pd.patient_phone) {
                  addMessage("Por favor indica tu número de teléfono (mínimo 11 dígitos).", 'bot');
                  setStep(STEPS.PHONE);
                } else if (!pd.occupation) {
                  addMessage("¿Cuál es su ocupación actual?", 'bot');
                  setStep(STEPS.OCCUPATION);
                } else {
                  addMessage("¿Cuál es tu correo electrónico?", 'bot');
                  setStep(STEPS.EMAIL);
                }
              }
              return;
            }
          }
        } catch (err) {
          console.error("Error fetching returning patient data", err);
        }

        setHistory([
          {
            type: 'bot',
            text: `<p class="mb-1">${greeting}</p><p class="mb-1">Para asegurar la precisión de tu historia médica,</p><p class="font-bold">por favor escribe tu nombre y apellido completo:</p>`
          }
        ]);
        setStep(STEPS.NAME);
        setFormData(prev => ({
          ...prev,
          patient_email: cycleUser.email
        }));
      } else {
        // Frictionless: Don't block if not authenticated for Unified Onboarding
        setHistory([
          {
            type: 'bot',
            text: `<p class="mb-1">Hola, soy el asistente virtual ${finalPrefix}</p><p class="font-bold mb-1">${name}.</p><p class="mb-1">Para asegurar la precisión de tu historia médica,</p><p class="font-bold">por favor escribe tu nombre y apellido completo:</p>`
          }
        ]);
        setStep(STEPS.NAME);
      }
    };
    initFlow();
  }, [doctor, history.length, isCycleAuthenticated, cycleUser]);

  // Fetch Locations and Questions on Mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (doctor?.slug_url) {
        try {
          console.log("[UnifiedOnboarding] Fetching locations for slug:", doctor.slug_url);
          const locData = await locationService.getPublicLocations(doctor.slug_url);
          console.log("[UnifiedOnboarding] Locations fetched:", locData?.length || 0);
          setLocations(locData || []);
        } catch (err) {
          console.error("[UnifiedOnboarding] Error fetching locations for onboarding", err);
        }
      } else {
        console.warn("[UnifiedOnboarding] No slug_url available for locations", doctor);
      }
    };

    const fetchQuestions = async () => {
      if (doctor?.slug_url) {
        try {
          console.log("[UnifiedOnboarding] Fetching questions for slug:", doctor.slug_url);
          const res = await axios.get(`/onboarding/questions/${doctor.slug_url}`);
          console.log("[UnifiedOnboarding] Questions fetched:", res.data?.length || 0);
          setPreconsultationQuestions(res.data || []);
        } catch (err) {
          console.error("[UnifiedOnboarding] Error fetching preconsultation questions", err);
          // Fallback to empty to allow the rest of the flow to continue
          setPreconsultationQuestions([]);
        }
      } else {
        console.warn("[UnifiedOnboarding] No slug_url available for doctor", doctor);
      }
    };

    fetchLocations();
    fetchQuestions();
  }, [doctor?.slug_url]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const addMessage = (text, type = 'user') => {
    setHistory(prev => [...prev, { type, text }]);
  };

  // Automated Bot Messages for Medical Flow
  useEffect(() => {
    if (step === STEPS.PRECONSULTA_QUESTION && preconsultaState.currentNodeId) {
      const node = jsonDataFlow.nodes[preconsultaState.currentNodeId];
      if (!node) return;

      // Skip action nodes
      if (node.type === 'action') {
        // handleActionNode needs pendingAnswers, but here we probably just want to advance
        const result = handleActionNode(node, {});
        // Since we are inside a useEffect, we should be careful about calling goToNextPreconsulta
        // which updates the same state. But for action nodes it's necessary.
        const nextId = result.nextId;
        if (nextId) {
          setPreconsultaState(prev => ({ ...prev, currentNodeId: nextId }));
        }
        return;
      }

      // Get text for the node
      const text = node.text_raw || preconsultaTexts[node.text_key] || "Por favor responde:";
      
      // Prevent duplicate messages for the same node
      const lastMsg = history[history.length - 1];
      if (lastMsg?.text === text && lastMsg.type === 'bot') return;

      const timer = setTimeout(() => {
        addMessage(text, 'bot');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [preconsultaState.currentNodeId, step]);

  // Transition to Preconsulta Finish
  useEffect(() => {
    if (preconsultaState.isFinished && step === STEPS.PRECONSULTA_QUESTION) {
      setStep(STEPS.PRECONSULTA_FINISH);
      addMessage("¡Excelente! He recopilado toda la información necesaria para tu consulta médica.", 'bot');
    }
  }, [preconsultaState.isFinished, step]);

  // Auto-close modal on success
  useEffect(() => {
    if (step === STEPS.SUCCESS && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  /* --- Step Handlers --- */

  const handleNameSubmit = (value) => {
    // Validation: No numbers allowed
    if (/\d/.test(value)) {
      addMessage("El nombre no debe contener números. Por favor intenta de nuevo.", 'bot');
      return;
    }
    const capsName = capitalizeWords(value);
    addMessage(capsName, 'user');
    setFormData(prev => ({ ...prev, patient_name: capsName }));
    setTimeout(() => {
      addMessage(`Un gusto Sra. ${capsName}. Por favor indíqueme su número de cédula o DNI`, 'bot');
      setStep(STEPS.DNI);
    }, 600);
  };

  /* --- RECURRENT PATIENT LOGIC --- */

  const handleRecurrentResponse = (response) => {
    // response: 'UPDATE' or 'KEEP'
    if (response === 'KEEP') {
      addMessage("No, mantener datos actuales", 'user');

      // Auto-fill form with stored data has been done in handleDniSubmit _tempData
      // Just ensure it's committed to formData
      setFormData(prev => ({
        ...prev,
        ...prev._tempData, // Apply temp data
        patient_dni: prev.patient_dni, // Ensure DNI is kept
        patient_name: prev.patient_name // Ensure Name is kept
      }));

      setTimeout(() => {
        addMessage("¡Perfecto! Continuemos entonces.", 'bot');
        // SKIP to Type
        setStep(STEPS.TYPE);
        setTimeout(() => {
          addMessage("¿Qué tipo de consulta deseas agendar?", 'bot');
        }, 500);
      }, 600);

    } else {
      addMessage("Sí, quiero actualizar", 'user');
      setTimeout(() => {
        addMessage("Entendido. Actualicemos su información. ¿Podría indicarme su edad?", 'bot');
        setStep(STEPS.AGE);
      }, 600);
    }
  };

  const handleDniSubmit = async (value) => {
    // Validation: Min 7 digits (millions)
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) {
      addMessage("La cédula debe tener al menos 7 dígitos (millones). Por favor revisa.", 'bot');
      return;
    }

    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, patient_dni: value }));

    // Check if patient exists (Recurrent Check)
    let recurrentData = null;
    try {
      const checkPromise = appointmentService.checkPatient(formData.patient_name, value);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));

      const result = await Promise.race([checkPromise, timeoutPromise]);
      if (result && result.exists && result.patient_data) {
        recurrentData = result.patient_data;
      }
    } catch (err) {
      console.warn("Patient verification skipped/failed:", err);
    }

    if (recurrentData) {
      if (result.needs_verification) {
        addMessage(`¡Bienvenida nuevamente Sra. ${recurrentData.patient_name}!`, 'bot');
        addMessage(`⚠️ Para poder agendar más citas, tu cuenta debe estar verificada. Acabamos de enviarte un correo nuevo con el enlace de confirmación. ¡Haz clic en él para continuar!`, 'bot');
        setStep('BLOCKED_VERIFICATION');
        return;
      }

      // Store found data temporarily
      setFormData(prev => ({ ...prev, _tempData: recurrentData }));

      setTimeout(() => {
        addMessage(`¡Bienvenida nuevamente Sra. ${recurrentData.patient_name}!`, 'bot');

        // Show summary of known data
        const summaryHtml = `
          <p class="mb-2">Veo que ya tienes historia con nosotros,</p>
          <p class="font-bold">¿Desea actualizar algún dato?</p>
        `;

        setTimeout(() => {
          addMessage(summaryHtml, 'bot');
          setStep(STEPS.RECURRENT_CONFIRM); // NEW STATE
        }, 600);
      }, 600);

      return; // STOP HERE if recurrent
    }

    // New Patient Flow (Normal)
    setTimeout(() => {
      addMessage("¿Podría indicarme su edad?", 'bot');
      setStep(STEPS.AGE);
    }, 1200);
  };

  const handleAgeSubmit = (value) => {
    addMessage(value, 'user');
    const age = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, patient_age: value }));
    
    setTimeout(() => {
      if (age >= 45) {
        addMessage("Entiendo. Por tu edad, ¿ya has pasado por la etapa de la menopausia o el cese de tus ciclos?", 'bot');
        setStep(STEPS.MENOPAUSE_BASIC);
      } else {
        addMessage("¿En cual ciudad reside actualmente?", 'bot');
        setStep(STEPS.RESIDENCE); // Go to Residence
      }
    }, 600);
  };

  const handleMenopauseBasicSubmit = (value) => {
    addMessage(value, 'user');
    // Also save it to preconsulta answers directly if possible
    setPreconsultaState(prev => ({
      ...prev,
      answers: { ...prev.answers, is_menopause: value }
    }));
    
    setTimeout(() => {
      addMessage("¿En cual ciudad reside actualmente?", 'bot');
      setStep(STEPS.RESIDENCE); // Resume normal flow
    }, 600);
  };

  const handleResidenceSubmit = (value) => {
    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, residence: value }));
    setTimeout(() => {
      addMessage("Entendido. Por favor indica tu número de teléfono (mínimo 11 dígitos).", 'bot');
      setStep(STEPS.PHONE);
    }, 600);
  };

  const handleTypeSelect = (type) => {
    addMessage(type, 'user');
    setFormData(prev => ({ ...prev, appointment_type: type }));
    setTimeout(() => {
      addMessage("Entendido. ¿Cuál es el motivo de tu consulta?", 'bot');
      setStep(STEPS.REASON);
    }, 600);
  };

  const handleReasonSelect = (value) => {
    addMessage(value, 'user');
    setFormData(prev => ({ ...prev, reason_for_visit: value }));
    setTimeout(() => {
      if (locations.length > 0) {
        addMessage("Perfecto. ¿En qué sede te gustaría ser atendida?", 'bot');
        setStep(STEPS.LOCATION);
      } else {
        addMessage("¿En qué sede te gustaría ser atendida? (Escribe el nombre)", 'bot');
        setStep(STEPS.LOCATION);
      }
    }, 600);
  };

  const handleLocationSelect = (loc) => {
    const locName = typeof loc === 'string' ? loc : loc.name;
    const scheduleStr = typeof loc !== 'string' ? (loc.schedule?.label || loc.schedule) : '';

    addMessage(locName, 'user');

    // Extract days text (heuristic: take everything before the first digit)
    // e.g. "Lunes a Viernes 8am" -> "Lunes a Viernes"
    let daysText = "los días de consulta";
    if (scheduleStr) {
      const match = scheduleStr.match(/^([^\d]+)/);
      if (match) {
        daysText = match[1].replace(/[:|-]$/, '').trim(); // Remove trailing colon/dash
      }
    }

    // Generate Smart Logic
    if (typeof loc !== 'string') {
      const allowedDays = parseAllowedDays(scheduleStr);
      const suggestions = generateSmartDates(allowedDays);
      setSuggestedDates(suggestions);
      setFormData(prev => ({ ...prev, location: locName, _tempSchedule: scheduleStr }));
      daysText = formatDaysText(allowedDays);
    } else {
      setSuggestedDates(generateSmartDates([1, 2, 3, 4, 5]));
      setFormData(prev => ({ ...prev, location: locName, _tempSchedule: '' }));
      daysText = "lunes a viernes";
    }

    setTimeout(() => {
      const firstName = formData.patient_name.split(' ')[0];
      // Updated Message: "Sra. {name}, para {sede} las consultas son {dias}, le mostraré..."
      addMessage(`Sra. ${firstName}, para ${locName} las consultas son ${daysText}, le mostraré los días disponibles para su cita:`, 'bot');
      setStep(STEPS.DATE_SUGGESTION);
    }, 800);
  };

  const handleLocationTextSubmit = (value) => {
    handleLocationSelect(value);
  }

  // --- Date Handling ---

  const handleSmartDateSelect = async (dateObj) => {
    const readable = dateObj.toLocaleDateString();
    const isoDate = dateObj.toISOString().split('T')[0];

    addMessage(readable, 'user');
    setFormData(prev => ({ ...prev, date_part: isoDate }));

    // Show searching feedback
    addMessage("🔍 Verificando disponibilidad...", 'bot');

    try {
      const bookedIsoStrings = await appointmentService.getBookedTimes(doctorId, isoDate);
      
      // Parse booked times to local HH:mm
      const bookedTimesLocal = bookedIsoStrings.map(isoString => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      });

      // Generate Smart Times
      const smartTimes = generateSmartTimes(formData._tempSchedule);
      
      setSuggestedTimes(smartTimes);
      setFormData(prev => ({ ...prev, booked_times: bookedTimesLocal })); // store to disable them

      setTimeout(() => {
        const nameParts = formData.patient_name.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su cita?`, 'bot');
        setStep(STEPS.TIME_SUGGESTION);
      }, 600);

    } catch (err) {
      console.error("Error fetching available times", err);
      // Fallback
      setSuggestedTimes(generateSmartTimes(formData._tempSchedule));
      setStep(STEPS.TIME_SUGGESTION);
    }
  };

  const handleManualDateTrigger = () => {
    addMessage("Elegir otra fecha...", 'user');
    setTimeout(() => {
      addMessage("Por favor selecciona la fecha en el calendario.", 'bot');
      setStep(STEPS.DATE_MANUAL);
    }, 500);
  }

  const handleManualDateSubmit = (val) => {
    // val is YYYY-MM-DD
    const [y, m, d] = val.split('-');
    const readable = `${d}/${m}/${y}`;
    addMessage(readable, 'user');
    setFormData(prev => ({ ...prev, date_part: val }));

    setTimeout(() => {
      const nameParts = formData.patient_name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
      addMessage(`Perfecto Sra. ${lastName}, ¿A qué hora le gustaría su cita?`, 'bot');
      // Just go to manual time for manual dates to be safe
      setStep(STEPS.TIME_MANUAL);
    }, 600);
  }

  // --- Time Handling ---

  const handleSmartTimeSelect = (timeStr) => {
    addMessage(timeStr, 'user');
    setFormData(prev => ({ ...prev, time_part: timeStr }));
    setTimeout(() => {
      // Use the value just set to avoid stale closure issues
      handleConfirm({ ...formData, time_part: timeStr });
    }, 600);
  }

  const handleManualTimeTrigger = () => {
    addMessage("Elegir otra hora...", 'user');
    setTimeout(() => {
      addMessage("Por favor selecciona la hora.", 'bot');
      setStep(STEPS.TIME_MANUAL);
    }, 500);
  }

  const handleManualTimeSubmit = (val) => {
    addMessage(val, 'user');
    setFormData(prev => ({ ...prev, time_part: val }));
    setTimeout(() => {
      // Use the value just set to avoid stale closure issues
      handleConfirm({ ...formData, time_part: val });
    }, 600);
  }

  /* --- CONTACT FLOW LOGIC --- */


  // --- Contact Info ---

  const handlePhoneSubmit = (value) => {
    // Validation: Min 11 digits
    const digits = value.replace(/\D/g, '');
    if (digits.length < 11) {
      addMessage("El teléfono debe tener al menos 11 dígitos. Ej: 04141234567.", 'bot');
      return;
    }

    setFormData(prev => ({ ...prev, patient_phone: value }));
    addMessage(value, 'user');

    // Check if occupation is needed
    if (formData.occupation) {
      // Skip occupation if exists (Partial update scenario)
      handleOccupationSubmit(formData.occupation); // Recursively check email
      return;
    }

    setTimeout(() => {
      addMessage(`Gracias. ¿Cuál es su ocupación actual?`, 'bot');
      setStep(STEPS.OCCUPATION);
    }, 500);
  };

  const handleOccupationSubmit = (value) => {
    // If value passed directly (from skip logic) or event
    const val = typeof value === 'string' ? value : value;

    if (typeof value !== 'string') { // Only add message if it came from user input
      addMessage(val, 'user');
    }

    setFormData(prev => ({ ...prev, occupation: val }));

    // Check if email is needed
    if (formData.patient_email) {
      handleEmailSubmit(formData.patient_email);
      return;
    }

    // Proceed to Email
    setTimeout(() => {
      addMessage("¿Cuál es tu correo electrónico?", 'bot');
      setStep(STEPS.EMAIL);
    }, 400);
  };

  const handleEmailSubmit = async (value) => {
    const val = typeof value === 'string' ? value : value;
    if (typeof value !== 'string') {
      addMessage(val, 'user');
    }

    setFormData(prev => ({ ...prev, patient_email: val }));

    // Check verification before continuing
    try {
      const res = await appointmentService.getPatientByEmail(val);
      if (res.exists && res.needs_verification) {
        setHistory(prev => [
            ...prev,
            {
                type: 'bot',
                text: '⚠️ Para poder agendar más citas, tu cuenta debe estar verificada. Acabamos de enviarte un correo nuevo con el enlace de confirmación. ¡Haz clic en él para continuar!'
            }
        ]);
        setStep('BLOCKED_VERIFICATION');
        return;
      }
    } catch (error) {
       console.error("Error checking verification on email submit:", error);
    }

    setTimeout(() => {
      if (formData.date_part && formData.time_part) {
        handleConfirm();
      } else {
        addMessage("¿Qué tipo de consulta deseas agendar?", 'bot');
        setStep(STEPS.TYPE);
      }
    }, 600);
  };

  const handleConfirm = async (currentData = formData) => {
    setFormData(currentData);

    // Sync initial data to preconsulta answers
    const initialMedicalAnswers = syncFormDataToAnswers(currentData);
    
    addMessage("¡Datos básicos listos! Ahora, para ahorrar unos 20 minutos de tiempo en tu consulta, te haré unas preguntas sobre tus antecedentes médicos:", 'bot');
    
    setPreconsultaState(prev => ({
      ...prev,
      answers: { ...prev.answers, ...initialMedicalAnswers },
      currentNodeId: 'DECIDE_IF_ASK_MENOPAUSE' // STARTING MEDICAL NODE
    }));

    setStep(STEPS.PRECONSULTA_QUESTION);
  };

  const handlePreconsultationAnswer = (value, displayValue) => {
    const currentQ = preconsultationQuestions[currentQuestionIndex];
    addMessage(displayValue || value, 'user');
    
    // Store answer
    setPreconsultationAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < preconsultationQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        addMessage(preconsultationQuestions[nextIndex].text, 'bot');
      }, 600);
    } else {
      addMessage("¡Excelente! Hemos completado todo el interrogatorio. Guardando tu información...", 'bot');
      handleFinalSubmit({
        ...preconsultationAnswers,
        [currentQ.id]: value // Include last answer
      });
    }
  };

  const handleFinalSubmit = async (finalAnswers = preconsultationAnswers, currentData = formData) => {
    setLoading(true);
    try {
      // Clean date conversion using template literal
      let fullDate = null;
      if (currentData.date_part && currentData.time_part) {
        try {
          // Standard parsing using date-fns for safety and cleanliness
          const localDateObj = parseISO(`${currentData.date_part}T${currentData.time_part}:00`);
          
          if (!isNaN(localDateObj.getTime())) {
            fullDate = localDateObj.toISOString();
          }
        } catch (dErr) {
          console.error("Date construction error", dErr);
        }
      }

      const payload = {
        patient_data: {
          patient_name: currentData.patient_name,
          patient_dni: currentData.patient_dni,
          patient_age: currentData.patient_age,
          patient_phone: currentData.patient_phone,
          patient_email: currentData.patient_email,
          residence: currentData.residence,
          occupation: currentData.occupation
        },
        appointment_data: {
          doctor_id: doctorId,
          appointment_type: currentData.appointment_type,
          reason_for_visit: currentData.reason_for_visit,
          location: currentData.location,
          appointment_date: fullDate
        },
        answers: {
          ...preconsultaState.answers,
          ...finalAnswers
        }
      };

      console.log("[UnifiedOnboarding] Final Payload:", payload);
      await axios.post(`/onboarding/submit/${doctor?.slug_url || doctorId}`, payload);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      console.error("Submission error:", err);
      addMessage("Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.", 'bot');
    } finally {
      setLoading(false);
    }
  };

  const getReasonOptions = () => {
    if (formData.appointment_type === 'Ginecología') {
      return ['Control Ginecológico', 'Dolor Pélvico', 'Sangrado'];
    }
    if (formData.appointment_type === 'Prenatal') {
      return ['Control Prenatal', 'Dolor Pélvico', 'Sangrado'];
    }
    return [];
  };

  // RENDER SUCCESS VIEW
  if (step === STEPS.SUCCESS) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in bg-white dark:bg-gray-800 rounded-2xl relative">
        <MdCheckCircle size={80} style={{ color: primaryColor }} className="mb-6 drop-shadow-md animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Solicitud Enviada!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs mx-auto">
          Tu cita ha sido registrada con éxito. Te contactaremos pronto para confirmarla.
        </p>
        <p className="text-sm text-gray-400">Cerrando en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 relative overflow-hidden min-h-0">
      <ModernLoader isOpen={loading} text="Agendando Cita..." primaryColor={primaryColor} />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
            {msg.type === 'bot' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 mb-1 border border-gray-100">
                {doctor?.photo_url ? (
                  <img
                    src={getImageUrl(doctor.photo_url)}
                    alt="Doctor"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {doctor?.nombre_completo?.charAt(0) || 'D'}
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${msg.type === 'user'
                ? 'text-white rounded-br-none'
                : 'border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
              style={{
                backgroundColor: msg.type === 'user' ? primaryColor : `${primaryColor}33`
              }}
            >
              {msg.type === 'bot' ? (
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}


        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 w-full flex-shrink-0">
  
        {/* UNIFIED TEXT INPUTS (To prevent unmounting and keyboard flicker) */}
        {[STEPS.NAME, STEPS.DNI, STEPS.AGE, STEPS.RESIDENCE, STEPS.PHONE, STEPS.OCCUPATION, STEPS.EMAIL, STEPS.LOCATION].includes(step) && (locations.length === 0 || step !== STEPS.LOCATION) && (
          <SimpleInput
            placeholder={
              step === STEPS.NAME ? "Escribe tu nombre completo..." :
              step === STEPS.DNI ? "Ej: V-12345678" :
              step === STEPS.AGE ? "Ej: 30" :
              step === STEPS.RESIDENCE ? "Ej: Valencia, Caracas" :
              step === STEPS.PHONE ? "Ej: 04141234567" :
              step === STEPS.OCCUPATION ? "Ej: Administradora" :
              "ejemplo@email.com"
            }
            onSubmit={
              step === STEPS.NAME ? handleNameSubmit :
              step === STEPS.DNI ? handleDniSubmit :
              step === STEPS.AGE ? handleAgeSubmit :
              step === STEPS.RESIDENCE ? handleResidenceSubmit :
              step === STEPS.PHONE ? handlePhoneSubmit :
              step === STEPS.OCCUPATION ? handleOccupationSubmit :
              step === STEPS.LOCATION ? handleLocationSelect :
              handleEmailSubmit
            }
            type={step === STEPS.EMAIL ? "email" : step === STEPS.PHONE ? "tel" : "text"}
            numericOnly={step === STEPS.AGE}
            primaryColor={primaryColor}
            autoFocus={canFocus}
            key="unified-input-field"
          />
        )}

        {step === STEPS.RECURRENT_CONFIRM && (
          <div className="flex gap-2 justify-center w-full">
            <button
              onClick={() => handleRecurrentResponse('KEEP')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition"
            >
              No, mantener datos
            </button>
            <button
              onClick={() => handleRecurrentResponse('UPDATE')}
              className="px-6 py-2 text-white rounded-full font-medium shadow-md transition transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              Sí, actualizar
            </button>
          </div>
        )}

        {step === STEPS.MENOPAUSE_BASIC && (
          <YesNoInput 
            onNext={handleMenopauseBasicSubmit} 
            primaryColor={primaryColor} 
          />
        )}

        {step === STEPS.TYPE && (
          <div className="flex flex-wrap gap-2">
            {['Ginecología', 'Prenatal'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className="px-4 py-2 rounded-full transition-all text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {step === STEPS.REASON && (
          <div className="flex flex-wrap gap-2">
            {getReasonOptions().map(reason => (
              <button
                key={reason}
                onClick={() => handleReasonSelect(reason)}
                className="px-4 py-2 rounded-full transition-all text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                {reason}
              </button>
            ))}
          </div>
        )}

        {step === STEPS.LOCATION && locations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => handleLocationSelect(loc)}
                className="px-4 py-2 rounded-full transition-all text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}

        {/* SMART DATE SELECTION */}
        {step === STEPS.DATE_SUGGESTION && (
          <div className="flex flex-wrap gap-2">
            {suggestedDates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => handleSmartDateSelect(date)}
                className="px-4 py-3 rounded-xl transition-all text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-white flex items-center gap-2"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                <MdCalendarToday /> {formatSmartDate(date)}
              </button>
            ))}
            <button
              onClick={handleManualDateTrigger}
              className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm border border-gray-200 dark:border-gray-600"
            >
              Otra fecha...
            </button>
          </div>
        )}

        {/* MANUAL DATE FALLBACK */}
        {step === STEPS.DATE_MANUAL && (
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.date.value; if (val) handleManualDateSubmit(val); }} className="flex gap-2 w-full">
            <input
              name="date"
              type="date"
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 w-full dark:text-white"
              style={{ '--tw-ring-color': primaryColor }}
              required
            />
            <button
              type="submit"
              className="p-3 text-white rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
              title="Enviar"
            >
              <MdSend size={20} />
            </button>
          </form>
        )}

        {/* SMART TIME SELECTION */}
        {step === STEPS.TIME_SUGGESTION && (
          <div className="flex flex-wrap gap-2">
            {suggestedTimes.map((time, idx) => {
              const isBooked = formData.booked_times && formData.booked_times.includes(time);
              return (
              <button
                key={idx}
                onClick={() => !isBooked && handleSmartTimeSelect(time)}
                disabled={isBooked}
                className={`px-4 py-3 rounded-xl transition-all text-sm font-bold shadow-sm flex items-center gap-2 ${
                  isBooked 
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed line-through' 
                    : 'text-white hover:shadow-md hover:scale-105 active:scale-95'
                }`}
                style={isBooked ? {} : { backgroundColor: primaryColor }}
                title={isBooked ? "Horario ocupado" : "Seleccionar horario"}
              >
                <MdAccessTime /> {time}
              </button>
            )})}
            <button
              onClick={handleManualTimeTrigger}
              className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm border border-gray-200 dark:border-gray-600"
            >
              Otra hora...
            </button>
          </div>
        )}

        {/* MANUAL TIME FALLBACK */}
        {step === STEPS.TIME_MANUAL && (
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.time.value; if (val) handleManualTimeSubmit(val); }} className="flex gap-2 w-full">
            <input
              name="time"
              type="time"
              step="900" // 15 minutes
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 w-full dark:text-white"
              style={{ '--tw-ring-color': primaryColor }}
              required
            />
            <button
              type="submit"
              className="p-3 text-white rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
              title="Enviar"
            >
              <MdSend size={20} />
            </button>
          </form>
        )}

        {/* PRECONSULTATION INPUTS */}
        {step === STEPS.PRECONSULTA_QUESTION && preconsultaState.currentNodeId && jsonDataFlow.nodes[preconsultaState.currentNodeId] && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xl mt-2 max-w-sm mx-auto">
            {(() => {
              const node = jsonDataFlow.nodes[preconsultaState.currentNodeId];
              const label = node.text_raw || (node.text_key && preconsultationQuestions?.find(q => q.text_key === node.text_key)?.text) || "Por favor responde:";
              const common = { onNext: goToNextPreconsulta, onSubmit: goToNextPreconsulta, primaryColor };
              
              switch (node.type) {
                case 'text_input': 
                  return <SimpleInput {...common} placeholder="Escribe aquí..." />;
                case 'numeric_input': case 'loop_numeric_input': case 'number_grid': case 'sexarche_picker':
                  return <SimpleInput {...common} placeholder="0" numericOnly />;
                case 'yes_no': 
                  return <YesNoInput {...common} />;
                case 'buttons': case 'loop_buttons':
                  const btnOptions = node.options || PRECONSULTA_OPTIONS[node.keyboard_type] || [];
                  return btnOptions.length > 0 ? <ButtonSelection {...common} options={btnOptions} /> : null;
                case 'dropdown':
                  const dropOptions = node.options || PRECONSULTA_OPTIONS[node.keyboard_type] || [];
                  return dropOptions.length > 0 ? <SelectInput {...common} label={label} options={dropOptions} /> : null;
                case 'checklist': case 'loop_checklist':
                  const checkOptions = node.options || PRECONSULTA_OPTIONS[node.keyboard_type] || [];
                  return checkOptions.length > 0 ? <ChecklistInput {...common} options={checkOptions} keyboardType={node.keyboard_type} /> : null;
                case 'scale':
                  return <ScaleInput {...common} />;
                case 'date': case 'calendar':
                  return <DatePicker {...common} />;
                case 'month_year_picker': case 'month_picker':
                  return <MonthYearPicker {...common} />;
                case 'year_picker':
                  return <YearInput {...common} label={label} />;
                case 'ho_table':
                  return <ObstetricTable {...common} />;
                default:
                  return <div className="text-xs text-red-400">Tipo no soportado: {node.type} <button onClick={() => goToNextPreconsulta('Saltado')} className="underline">Saltar</button></div>;
              }
            })()}
          </div>
        )}

        {step === STEPS.PRECONSULTA_FINISH && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl mt-2 max-w-sm mx-auto text-center animate-fade-in">
             <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <MdCheckCircle size={32} className="text-green-500" />
             </div>
             <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">¡Todo listo!</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
               He recopilado toda la información necesaria. Haz clic abajo para confirmar y agendar tu cita oficial.
             </p>
             <button 
               onClick={() => handleFinalSubmit()}
               style={{ backgroundColor: primaryColor }}
               className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               CONFIRMAR Y AGENDAR CITA
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
