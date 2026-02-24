import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.tsx';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
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
  const { user, token } = useAuth();

  if (!user || !token) {
    return <LoginPage />;
  }

  if (user.role === 'admin' || user.role === 'superadmin') {
      return <AdminDashboard />;
  }

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

  // Fetch availability when date or instructor changes
  // Logic: Wait for Date AND Instructor to be selected before fetching?
  // Or fetch availability for ALL instructors for a date?
  // Current UI: Select Date -> Select Time -> Select Instructor
  // Wait, the UI flow is Date -> Time -> Instructor.
  // This means "Time Slots" must be general (any instructor available) OR we need to rethink flow.
  // The provided design image shows: Date -> Time -> Instructor.
  // This implies we pick a time slot (e.g. 09:00) and THEN see which instructors are free at 09:00.
  // To do this, we need an endpoint /availability?date=X that returns slots that have AT LEAST ONE instructor free.
  // OR, we simplify and assume we pick Date -> Instructor -> Time?
  // Let's stick to the image flow:
  // 1. Pick Date.
  // 2. See Times. (Calculated by: Are there ANY instructors free at 9:00 on Date X?)
  // 3. Pick Time.
  // 4. See Instructors available at that Time.

  // However, the backend `availability.php` I wrote expects `instructorId`.
  // To match the UI exactly, I should probably fetch ALL instructors, check their slots, and aggregate.
  // For MVP/Demo simplicity, let's keep the mock slots or implement a "check general availability" endpoint later.
  // For now, let's just use the mock slots for the "General Time Selection" step
  // and validate/filter instructors in the next step.

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
