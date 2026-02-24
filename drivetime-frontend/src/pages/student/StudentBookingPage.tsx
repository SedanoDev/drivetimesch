import { useState, useEffect } from 'react';
import { Stepper } from '../../components/booking/stepper';
import { Calendar } from '../../components/booking/calendar';
import { TimeSlots } from '../../components/booking/time-slots';
import { InstructorList } from '../../components/booking/instructor-list';
import { BookingSummaryFooter } from '../../components/booking/booking-summary-footer';
import { ConfirmationView } from '../../components/booking/confirmation-view';
import { fetchInstructors, createBooking } from '../../services/api';
import type { Instructor, TimeSlot } from '../../types';
import { INSTRUCTORS as MOCK_INSTRUCTORS, TIME_SLOTS as MOCK_SLOTS } from '../../data/mock-data';

export function StudentBookingPage() {
  // Copied logic from old App.tsx
  const [view, setView] = useState<'selection' | 'confirmation'>('selection');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>(MOCK_INSTRUCTORS);
  const [timeSlots] = useState<TimeSlot[]>(MOCK_SLOTS);

  useEffect(() => {
    fetchInstructors().then(data => {
        if (data && data.length > 0) setInstructors(data);
    });
  }, []);

  const selectedInstructor = instructors.find(i => i.id === selectedInstructorId) || null;

  let currentStepperStep = 1;
  if (selectedDate) currentStepperStep = 2;
  if (selectedTime) currentStepperStep = 3;
  if (selectedInstructorId) currentStepperStep = 3;
  if (view === 'confirmation') currentStepperStep = 4;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (selectedDate && date.getTime() !== selectedDate.getTime()) {
      setSelectedTime(null);
      setSelectedInstructorId(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedTime && time !== selectedTime) setSelectedInstructorId(null);
  };

  const handleNext = async () => {
    if (view === 'selection') {
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsSubmitting(true);
      const success = await createBooking({
          instructor_id: selectedInstructorId!,
          booking_date: selectedDate!.toISOString().split('T')[0],
          start_time: selectedTime!,
      });

      if (success) {
        alert("¡Reserva confirmada!");
        // Reset
        setView('selection');
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedInstructorId(null);
      } else {
         alert("Error al reservar");
      }
      setIsSubmitting(false);
    }
  };

  const canProceed = !!(selectedDate && selectedTime && selectedInstructorId);

  return (
    <div className="mb-24">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Nueva Reserva</h1>

      <Stepper currentStep={currentStepperStep} />

      <div className="mt-8 mb-8">
        {view === 'selection' ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            <div className="w-full lg:w-auto flex-shrink-0">
              <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} className="sticky top-24" />
            </div>
            <div className="flex-1 w-full space-y-8 min-w-0">
              <div className={`transition-all ${selectedDate ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <TimeSlots slots={timeSlots} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={handleTimeSelect} />
              </div>
              <div className={`transition-all ${selectedTime ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <InstructorList instructors={instructors} selectedInstructorId={selectedInstructorId} onSelectInstructor={setSelectedInstructorId} selectedTime={selectedTime || '09:00'} />
              </div>
            </div>
          </div>
        ) : (
          <ConfirmationView selectedDate={selectedDate!} selectedTime={selectedTime!} selectedInstructor={selectedInstructor!} />
        )}
      </div>

      <BookingSummaryFooter
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedInstructor={selectedInstructor}
        currentStep={currentStepperStep}
        onNext={handleNext}
        canProceed={canProceed}
        isSubmitting={isSubmitting}
        buttonText={view === 'selection' ? 'Continuar' : 'Confirmar Reserva'}
      />
    </div>
  );
}
