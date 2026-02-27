import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  className?: string;
  availableDates?: string[]; // Array of 'YYYY-MM-DD'
  onMonthChange?: (date: Date) => void;
  disablePast?: boolean; // New prop to control past date disabling
  disableUnavailable?: boolean; // New prop to control whether non-available dates are disabled
}

export function Calendar({
  selectedDate,
  onSelectDate,
  className,
  availableDates = [],
  onMonthChange,
  disablePast = true,
  disableUnavailable = true
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const nextMonth = () => {
      const newDate = addMonths(currentMonth, 1);
      setCurrentMonth(newDate);
      onMonthChange?.(newDate);
  };

  const prevMonth = () => {
      const newDate = subMonths(currentMonth, 1);
      setCurrentMonth(newDate);
      onMonthChange?.(newDate);
  };

  return (
    <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-bold text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isAvailable = availableDates.includes(dateStr);
          const isPast = day < new Date(new Date().setHours(0,0,0,0));

          // Calculate isDisabled based on props
          let isDisabled = !isCurrentMonth; // Always disable days from other months in this view

          if (disablePast && isPast) {
              isDisabled = true;
          }

          // Allow override: If disableUnavailable is false (e.g. Instructor View), ignore isAvailable check
          if (disableUnavailable && availableDates.length > 0 && !isAvailable) {
              isDisabled = true;
          }

          return (
            <button
              key={idx}
              onClick={() => !isDisabled && onSelectDate(day)}
              // Remove disabled attribute for logic, rely on isDisabled for styling/click prevention
              // Actually, keep disabled but ensure props allow overriding behavior
              disabled={isDisabled}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all relative group",
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                  : isToday(day)
                    ? "text-blue-600 font-bold bg-blue-50"
                    : "text-slate-700 hover:bg-slate-50",
                isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300"
              )}
            >
              {format(day, 'd')}

              {/* Availability Dot */}
              {!isSelected && !isDisabled && isAvailable && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full group-hover:scale-125 transition-transform"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
