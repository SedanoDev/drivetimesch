import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import type { TimeSlot } from '../../types';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  selectedDate: Date | null;
  onSelectTime: (time: string) => void;
  className?: string;
}

export function TimeSlots({ slots, selectedTime, selectedDate, onSelectTime, className }: TimeSlotsProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl text-orange-500">⏰</span>
          <h3 className="font-bold text-slate-800 text-lg">Elige tu hora</h3>
        </div>
        {selectedDate && (
          <span className="text-sm font-medium text-slate-500 capitalize bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {slots.map((slot) => {
           const isSelected = selectedTime === slot.time;
           
           return (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => onSelectTime(slot.time)}
              className={cn(
                "relative group flex items-center justify-center py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-200",
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-105 z-10"
                  : slot.available
                  ? "bg-white border-slate-100 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                  : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed decoration-slate-300"
              )}
            >
              <span className={cn(!slot.available && "line-through decoration-2 decoration-slate-200")}>
                {slot.time}
              </span>
              
              {!slot.available && (
                <span className="absolute -top-2.5 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold shadow-sm z-20 transform scale-90 tracking-wide uppercase">
                  Ocupado
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {slots.length === 0 && (
         <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No hay horarios disponibles para esta fecha.
         </div>
      )}
    </div>
  );
}
