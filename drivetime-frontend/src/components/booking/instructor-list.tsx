import { useState } from 'react';
import type { Instructor } from '../../types';
import { InstructorCard } from './instructor-card';
import { InstructorReviews } from './InstructorReviews';

interface InstructorListProps {
  instructors: Instructor[];
  selectedInstructorId: string | null;
  onSelectInstructor: (id: string) => void;
  selectedTime: string;
}

export function InstructorList({ instructors, selectedInstructorId, onSelectInstructor, selectedTime }: InstructorListProps) {
  const [reviewInstructor, setReviewInstructor] = useState<{id: string, name: string} | null>(null);

  return (
    <>
      {reviewInstructor && (
        <InstructorReviews
          instructorId={reviewInstructor.id}
          instructorName={reviewInstructor.name}
          onClose={() => setReviewInstructor(null)}
        />
      )}

      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl text-orange-500">👨‍🏫</span>
          <h3 className="font-bold text-slate-800 text-lg">Selecciona profesor</h3>
        </div>

        <div className="space-y-3">
          {instructors.map((instructor) => {
              // Real availability is checked in next step (Calendar), here we just show list
              // Assuming all active instructors are selectable initially
              const isAvailable = true;

              return (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  isSelected={selectedInstructorId === instructor.id}
                  isAvailable={isAvailable}
                  onSelect={() => onSelectInstructor(instructor.id)}
                  selectedTime={selectedTime}
                  onViewReviews={() => setReviewInstructor({ id: instructor.id, name: instructor.name })}
                />
              );
          })}
        </div>
      </div>
    </>
  );
}
