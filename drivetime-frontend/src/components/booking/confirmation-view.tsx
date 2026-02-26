import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Instructor } from '../../types';
import { InstructorCard } from './instructor-card';

interface ConfirmationViewProps {
  selectedDate: Date;
  selectedTime: string;
  selectedInstructor: Instructor;
}

export function ConfirmationView({ selectedDate, selectedTime, selectedInstructor }: ConfirmationViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Confirma tu reserva</h2>
        <p className="text-slate-500">Revisa los detalles antes de finalizar.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 border-dashed">
          <span className="text-slate-500 font-medium text-sm uppercase tracking-wide">Fecha</span>
          <span className="text-slate-800 font-bold capitalize text-lg">
            {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-4 border-dashed">
          <span className="text-slate-500 font-medium text-sm uppercase tracking-wide">Horario</span>
          <span className="text-slate-800 font-bold text-lg">{selectedTime} - {parseInt(selectedTime.split(':')[0]) + 1}:00</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-4 border-dashed">
           <span className="text-slate-500 font-medium text-sm uppercase tracking-wide">Ubicación</span>
           <span className="text-slate-800 font-bold text-lg">Ciudad Lineal, Madrid</span>
        </div>
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 border-dashed">
           <span className="text-slate-500 font-medium text-sm uppercase tracking-wide">Precio</span>
           <span className="text-slate-800 font-bold text-lg">25,00 €</span>
        </div>

        <div className="pt-2">
          <span className="text-slate-500 font-medium block mb-4 text-sm uppercase tracking-wide">Profesor seleccionado</span>
          <InstructorCard 
            instructor={selectedInstructor} 
            isSelected={true} 
            isAvailable={true} 
            onSelect={() => {}} 
            selectedTime={selectedTime}
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 flex gap-3 items-start border border-blue-100">
        <span className="text-lg">ℹ️</span>
        <p>
          Recibirás un correo de confirmación con los detalles.
          La cancelación es gratuita hasta 24 horas antes de la clase.
        </p>
      </div>
    </div>
  );
}
