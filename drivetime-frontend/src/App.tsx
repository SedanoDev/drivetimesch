import { useState, useEffect } from 'react';
import { MainLayout } from './layouts/main-layout';
import { Stepper } from './components/booking/stepper';
import { Calendar } from './components/booking/calendar';
import { TimeSlots } from './components/booking/time-slots';
import { InstructorList } from './components/booking/instructor-list';
import { BookingSummaryFooter } from './components/booking/booking-summary-footer';
import { ConfirmationView } from './components/booking/confirmation-view';
import { fetchInstructors, createBooking } from './services/api';
import type { Instructor, TimeSlot } from './types';
import { INSTRUCTORS as MOCK_INSTRUCTORS, TIME_SLOTS as MOCK_SLOTS } from './data/mock-data';

function App() {
  // Step 1..3 are on the main page. Step 4 is Confirmation View.
  const [view, setView] = useState<'selection' | 'confirmation'>('selection');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for data fetched from API
  const [instructors, setInstructors] = useState<Instructor[]>(MOCK_INSTRUCTORS);
  const [timeSlots] = useState<TimeSlot[]>(MOCK_SLOTS);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      // Try to fetch from API, if fail (e.g. no PHP server), fallback to mocks is already initial state
      try {
          const apiInstructors = await fetchInstructors();
          if (apiInstructors && apiInstructors.length > 0) {
            setInstructors(apiInstructors);
          }
      } catch (e) {
          console.log("Using mock data", e);
      } finally {
          setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Fetch availability when date changes (mock logic for now)
  useEffect(() => {
      if (selectedDate) {
          // In real app: fetchAvailability(format(selectedDate, 'yyyy-MM-dd'), selectedInstructorId);
          // For now, just randomization or static
      }
  }, [selectedDate]);

  if (loadingData) {
      // Optional: loading spinner, or just render with initial mocks
  }


  const selectedInstructor = instructors.find(i => i.id === selectedInstructorId) || null;

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

  const handleNext = async () => {
    if (view === 'selection') {
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Submit logic
      setIsSubmitting(true);

      // Attempt API call
      const success = await createBooking({
          instructor_id: selectedInstructorId!,
          student_name: "Usuario Demo", // In a real app, you'd have a form input for this
          booking_date: selectedDate!.toISOString().split('T')[0],
          start_time: selectedTime!,
      });

      if (success) {
        alert("¡Reserva confirmada con éxito! Revisa tu correo electrónico.");
      } else {
         alert("Hubo un error al confirmar la reserva (API). Usando fallback para demo.");
      }

      setIsSubmitting(false);
      // Reset flow
      setView('selection');
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedInstructorId(null);
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
                    slots={timeSlots}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={handleTimeSelect}
                 />
              </div>

              {/* Instructors */}
              <div className={`transition-all duration-500 delay-100 ${selectedTime ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none grayscale'}`}>
                {/* Always render distinct space to avoid layout shift, or just show when ready */}
                 <InstructorList
                    instructors={instructors}
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
