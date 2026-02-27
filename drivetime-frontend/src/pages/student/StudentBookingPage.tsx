import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Stepper } from '../../components/booking/stepper';
import { Calendar } from '../../components/booking/calendar';
import { TimeSlots } from '../../components/booking/time-slots';
import { InstructorList } from '../../components/booking/instructor-list';
import { BookingSummaryFooter } from '../../components/booking/booking-summary-footer';
import { ConfirmationView } from '../../components/booking/confirmation-view';
import { fetchInstructors, createBooking } from '../../services/api';
import type { Instructor, TimeSlot } from '../../types';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function StudentBookingPage() {
  const { token } = useAuth();
  const [view, setView] = useState<'selection' | 'confirmation' | 'success'>('selection');

  // Selection States
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]); // New state for monthly dots
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [credits, setCredits] = useState<number | null>(null); // Null means loading

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Instructors & Credits on Load
  useEffect(() => {
    fetchInstructors().then(data => {
        if (data && data.length > 0) {
            setInstructors(data);
        }
    });

    if (token) {
        fetch(`${API_URL}/student_packs.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(console.error);
    }
  }, [token]);

  // Fetch Monthly Availability (Green Dots) when Instructor Selected or Month Changes
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
      if (selectedInstructorId && token) {
          fetch(`${API_URL}/availability.php?mode=month&instructorId=${selectedInstructorId}&month=${viewDate.getMonth()+1}&year=${viewDate.getFullYear()}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              if (Array.isArray(data)) setAvailableDates(data);
          })
          .catch(console.error);
      } else {
          setAvailableDates([]);
      }
  }, [selectedInstructorId, viewDate, token]);

  // Fetch Time Slots when Date Selected
  useEffect(() => {
    if (selectedInstructorId && selectedDate && token) {
        setIsLoadingSlots(true);
        const dateStr = selectedDate.toISOString().split('T')[0];

        fetch(`${API_URL}/availability.php?instructorId=${selectedInstructorId}&date=${dateStr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setAvailableSlots(data);
            } else {
                setAvailableSlots([]);
            }
        })
        .catch(err => {
            console.error("Error fetching slots:", err);
            setAvailableSlots([]);
        })
        .finally(() => setIsLoadingSlots(false));
    } else {
        setAvailableSlots([]);
    }
  }, [selectedInstructorId, selectedDate, token]);

  const selectedInstructor = instructors.find(i => i.id === selectedInstructorId) || null;

  // Stepper Logic
  let currentStepperStep = 1;
  if (selectedInstructorId) currentStepperStep = 2;
  if (selectedDate) currentStepperStep = 3;
  if (selectedTime) currentStepperStep = 3;
  if (view === 'confirmation') currentStepperStep = 4;

  const handleInstructorSelect = (id: string) => {
      setSelectedInstructorId(id);
      setSelectedDate(null);
      setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = async () => {
    if (view === 'selection') {
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsSubmitting(true);
      const result = await createBooking({
          instructor_id: selectedInstructorId!,
          booking_date: selectedDate!.toISOString().split('T')[0],
          start_time: selectedTime!,
      });

      if (result.success) {
        setView('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
         alert(`Error al reservar: ${result.error || 'Verifica que tengas créditos disponibles.'}`);
      }
      // Re-fetch credits in case they changed (e.g., race condition or refresh needed)
      if (token) {
        fetch(`${API_URL}/student_packs.php`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.credits !== undefined) setCredits(data.credits); });
      }
      setIsSubmitting(false);
    }
  };

  const canProceed = !!(selectedDate && selectedTime && selectedInstructorId);

  // Convert availableSlots (strings) to TimeSlot objects for UI
  const timeSlotObjects: TimeSlot[] = availableSlots.map(time => ({
      id: time,
      time: time,
      available: true
  }));

  if (view === 'success') {
      return (
          <div className="max-w-xl mx-auto py-12 px-4 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</h2>
              <p className="text-slate-600 mb-8">
                  Tu reserva ha sido registrada y está pendiente de confirmación por parte del instructor. Te notificaremos cuando sea aceptada.
              </p>
              <div className="flex flex-col gap-3">
                  <Link to="/student/classes" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                      Ver Mis Clases
                  </Link>
                  <Link to="/student" className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                      Volver al Inicio
                  </Link>
              </div>
          </div>
      );
  }

  // Check credits before rendering normal flow
  if (credits === 0) {
      return (
          <div className="max-w-xl mx-auto py-12 px-4 text-center">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={48} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Sin Créditos!</h2>
              <p className="text-slate-600 mb-8">
                  No tienes clases disponibles en tu saldo. Necesitas comprar un pack de clases para poder reservar.
              </p>
              <Link to="/student/payments" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Comprar Clases
              </Link>
          </div>
      );
  }

  return (
    <div className="mb-24">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Nueva Reserva</h1>

      <Stepper currentStep={currentStepperStep} />

      <div className="mt-8 mb-8 space-y-8">
        {view === 'selection' ? (
          <>
            {/* Step 1: Select Instructor */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 px-4 lg:px-0">1. Selecciona Instructor</h3>
                <InstructorList
                    instructors={instructors}
                    selectedInstructorId={selectedInstructorId}
                    onSelectInstructor={handleInstructorSelect}
                    selectedTime={selectedTime || ''}
                />
            </div>

            {/* Step 2: Select Date (Visible only if Instructor selected) */}
            <div className={`transition-all duration-500 ${selectedInstructorId ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                 <h3 className="text-lg font-bold text-slate-800 mb-4 px-4 lg:px-0">2. Selecciona Fecha</h3>
                 <div className="flex justify-center">
                    <Calendar
                        selectedDate={selectedDate}
                        onSelectDate={handleDateSelect}
                        availableDates={availableDates}
                        onMonthChange={setViewDate}
                    />
                 </div>
            </div>

            {/* Step 3: Select Time (Visible only if Date selected) */}
            <div className={`transition-all duration-500 ${selectedDate ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <h3 className="text-lg font-bold text-slate-800 mb-4 px-4 lg:px-0">3. Selecciona Hora</h3>
                 {isLoadingSlots ? (
                     <div className="text-center py-8 text-slate-500">Cargando horarios disponibles...</div>
                 ) : availableSlots.length > 0 ? (
                     <TimeSlots slots={timeSlotObjects} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={handleTimeSelect} />
                 ) : (
                     <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        {selectedDate ? 'No hay horarios disponibles para esta fecha.' : 'Selecciona una fecha primero.'}
                     </div>
                 )}
            </div>
          </>
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
