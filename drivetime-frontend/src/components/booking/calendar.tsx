import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function Calendar({ selectedDate, onSelectDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full max-w-sm mx-auto", className)}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">📅</span>
        <h3 className="font-bold text-slate-800 text-lg">Selecciona una fecha</h3>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="text-base font-bold capitalize text-slate-800">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((day) => (
          <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center justify-center">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          // Mock availability logic: Weekends have no classes, some weekdays are full
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const hasClasses = !isWeekend;

          return (
            <button
              key={day.toString()}
              onClick={() => hasClasses && onSelectDate(day)}
              disabled={!isCurrentMonth || !hasClasses}
              className={cn(
                "h-10 w-10 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative mx-auto",
                !isCurrentMonth ? "text-slate-300 opacity-50 cursor-default" :
                !hasClasses ? "text-slate-300 cursor-not-allowed" :
                "hover:bg-blue-50 text-slate-700 cursor-pointer",
                isSelected ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200" : "",
                isToday(day) && !isSelected ? "border border-blue-600 text-blue-600 font-bold" : ""
              )}
            >
              <span>{format(day, 'd')}</span>
              {hasClasses && isCurrentMonth && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-green-500 mt-1"></span>
              )}
              {isSelected && (
                 <span className="w-1 h-1 rounded-full bg-white/50 mt-1"></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Seleccionado</span>
        </div>
         <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span>Sin clases</span>
        </div>
      </div>
    </div>
  );
}
