import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepperProps {
  currentStep: number;
  className?: string;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, label: 'Fecha' },
  { id: 2, label: 'Horario' },
  { id: 3, label: 'Profesor' },
  { id: 4, label: 'Confirmar' },
];

export function Stepper({ currentStep, className, onStepClick }: StepperProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto py-8 px-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex-1 flex flex-col items-center relative group">
               {/* Line to the left (if not first) */}
               {index > 0 && (
                <div className={cn(
                  "absolute top-5 right-1/2 w-1/2 h-1 -translate-y-1/2 -z-10",
                   isCompleted || isCurrent ? "bg-green-500" : "bg-gray-200"
                )} />
               )}

               {/* Line to the right (if not last) */}
               {index < steps.length - 1 && (
                <div className={cn(
                  "absolute top-5 left-1/2 w-1/2 h-1 -translate-y-1/2 -z-10",
                   isCompleted ? "bg-green-500" : "bg-gray-200"
                )} />
               )}

              <div 
                onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 shadow-sm z-10 bg-white",
                  isCompleted ? "bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600" :
                  isCurrent ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-md ring-4 ring-blue-50" :
                  "border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : step.id}
              </div>
              <span 
                className={cn(
                  "mt-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                  isCompleted ? "text-green-600" :
                  isCurrent ? "text-blue-600" :
                  "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
