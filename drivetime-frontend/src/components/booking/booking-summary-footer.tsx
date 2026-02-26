import { ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import type { Instructor } from '../../types';

interface BookingSummaryFooterProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedInstructor: Instructor | null;
  currentStep: number;
  onNext: () => void;
  canProceed: boolean;
  isSubmitting?: boolean;
  buttonText?: string;
}

export function BookingSummaryFooter({
  selectedDate,
  selectedTime,
  selectedInstructor,
  currentStep,
  onNext,
  canProceed,
  isSubmitting,
  buttonText
}: BookingSummaryFooterProps) {

  // Only show footer if at least date is selected
  if (!selectedDate) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-blue-600 text-white py-6 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 border-t border-blue-500">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left: Summary Text */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-lg mb-1">Resumen de reserva</h3>
          <p className="text-blue-100 text-xs font-medium">Clase práctica · 45 min · Ciudad Lineal, Madrid</p>
        </div>

        {/* Middle: Details Grid */}
        <div className="flex gap-8 text-sm border-l border-blue-500 pl-8 md:pl-0 md:border-none">
          <div className="flex flex-col">
            <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Fecha</span>
            <span className="font-bold capitalize text-white">
              {format(selectedDate, 'EEE, d MMM', { locale: es })}
            </span>
          </div>

          <div className={cn("flex flex-col transition-opacity duration-300", !selectedTime && "opacity-30")}>
            <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Hora</span>
            <span className="font-bold text-white">{selectedTime || '--:--'}</span>
          </div>

          <div className={cn("flex flex-col transition-opacity duration-300", !selectedInstructor && "opacity-30")}>
            <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Profesor</span>
            <span className="font-bold text-white truncate max-w-[100px]">
              {selectedInstructor ? selectedInstructor.name.split(' ')[0] : '---'}
            </span>
          </div>
        </div>

        {/* Right: Action Button */}
        <button
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed || isSubmitting}
          className={cn(
            "flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-bold transition-all shadow-lg min-w-[160px] justify-center",
            canProceed
              ? "hover:bg-blue-50 hover:scale-105 active:scale-95 cursor-pointer"
              : "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isSubmitting ? (
             <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
             <>
               {buttonText || (currentStep === 4 ? 'Confirmar' : 'Siguiente')}
               <ArrowRight className="w-5 h-5" />
             </>
          )}
        </button>
      </div>
    </div>
  );
}
