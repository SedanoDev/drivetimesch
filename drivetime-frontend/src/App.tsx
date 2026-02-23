import { useState } from 'react';
import { MainLayout } from './layouts/main-layout';
import { Stepper } from './components/booking/stepper';
import { Calendar } from './components/booking/calendar';
import { TimeSlots } from './components/booking/time-slots';
import { InstructorList } from './components/booking/instructor-list';
import { BookingSummaryFooter } from './components/booking/booking-summary-footer';
import { ConfirmationView } from './components/booking/confirmation-view';
import { INSTRUCTORS, TIME_SLOTS } from './data/mock-data';

function App() {
  // Step 1..3 are on the main page. Step 4 is Confirmation View.
  const [view, setView] = useState<'selection' | 'confirmation'>('selection');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInstructor = INSTRUCTORS.find(i => i.id === selectedInstructorId) || null;

  // Calculate current progress for Stepper
  let currentStepperStep = 1;
  if (selectedDate) currentStepperStep = 2;
  if (selectedTime) currentStepperStep = 3;
  if (selectedInstructorId) currentStepperStep = 3;
  if (view === 'confirmation') currentStepperStep = 4;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Reset subsequent selections if date changes
    if (selectedDate && date.getTime() !== selectedDate.getTime()) {
      setSelectedTime(null);
      setSelectedInstructorId(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // Reset subsequent selections if time changes
    if (selectedTime && time !== selectedTime) {
      setSelectedInstructorId(null);
    }
  };

  const handleInstructorSelect = (id: string) => {
    setSelectedInstructorId(id);
  };

  const handleNext = () => {
    if (view === 'selection') {
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Submit logic
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        alert("¡Reserva confirmada con éxito! Revisa tu correo electrónico.");
        // Reset flow
        setView('selection');
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedInstructorId(null);
      }, 2000);
    }
  };

  const canProceed = !!(selectedDate && selectedTime && selectedInstructorId);

  return (
    <MainLayout>
      <Stepper
        currentStep={currentStepperStep}
        onStepClick={(stepId) => {
          // Allow going back
          if (stepId < currentStepperStep) {
            if (stepId <= 3) setView('selection');
            // Logic to reset selections if jumping back? Maybe just view.
          }
        }}
      />

      <div className="mt-8 mb-32">
        {view === 'selection' ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Left Column: Calendar */}
            <div className="w-full lg:w-auto flex-shrink-0 animate-in fade-in duration-500">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                className="sticky top-24"
              />
            </div>

            {/* Right Column: Time & Instructors */}
            <div className="flex-1 w-full space-y-8 min-w-0">
              {/* Time Slots */}
              <div className={`transition-all duration-500 ${selectedDate ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none grayscale'}`}>
                 <TimeSlots
                    slots={TIME_SLOTS}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={handleTimeSelect}
                 />
              </div>

              {/* Instructors */}
              <div className={`transition-all duration-500 delay-100 ${selectedTime ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none grayscale'}`}>
                {/* Always render distinct space to avoid layout shift, or just show when ready */}
                 <InstructorList
                    instructors={INSTRUCTORS}
                    selectedInstructorId={selectedInstructorId}
                    onSelectInstructor={handleInstructorSelect}
                    selectedTime={selectedTime || '09:00'}
                  />
              </div>
            </div>
          </div>
        ) : (
          <ConfirmationView
             selectedDate={selectedDate!}
             selectedTime={selectedTime!}
             selectedInstructor={selectedInstructor!}
          />
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
    </MainLayout>
  );
}

export default App;
