import type { Instructor } from '../../types';
import { InstructorCard } from './instructor-card';

interface InstructorListProps {
  instructors: Instructor[];
  selectedInstructorId: string | null;
  onSelectInstructor: (id: string) => void;
  selectedTime: string;
}

export function InstructorList({ instructors, selectedInstructorId, onSelectInstructor, selectedTime }: InstructorListProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl text-orange-500">👨‍🏫</span>
        <h3 className="font-bold text-slate-800 text-lg">Selecciona profesor</h3>
      </div>

      <div className="space-y-3">
        {instructors.map((instructor) => {
             // Mock availability: Javier Ruiz is unavailable for demo purposes
             const isAvailable = !instructor.name.includes("Javier");

             return (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                isSelected={selectedInstructorId === instructor.id}
                isAvailable={isAvailable}
                onSelect={() => onSelectInstructor(instructor.id)}
                selectedTime={selectedTime}
              />
            );
        })}
      </div>
    </div>
  );
}
