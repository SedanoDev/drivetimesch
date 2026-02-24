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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function StudentBookingPage() {
  const { token } = useAuth();
  const [view, setView] = useState<'selection' | 'confirmation'>('selection');

  // Selection States
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Instructors on Load
  useEffect(() => {
    fetchInstructors().then(data => {
        if (data && data.length > 0) {
            setInstructors(data);
            // Optional: Auto-select first instructor
            // setSelectedInstructorId(data[0].id);
        }
    });
  }, []);

  // Fetch Availability when Instructor & Date are selected
  useEffect(() => {
    if (selectedInstructorId && selectedDate && token) {
        setIsLoadingSlots(true);
        const dateStr = selectedDate.toISOString().split('T')[0];

        fetch(`${API_URL}/availability.php?instructorId=${selectedInstructorId}&date=${dateStr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            // API returns array of strings: ['09:00', '10:00']
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
      const success = await createBooking({
          instructor_id: selectedInstructorId!,
          booking_date: selectedDate!.toISOString().split('T')[0],
          start_time: selectedTime!,
      });

      if (success) {
        alert("¡Reserva confirmada!");
        // Reset
        setView('selection');
        setSelectedInstructorId(null);
        setSelectedDate(null);
        setSelectedTime(null);
      } else {
         alert("Error al reservar");
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
                <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="space-y-3">
                        {instructors.map((inst) => (
                             <div
                                key={inst.id}
                                onClick={() => handleInstructorSelect(inst.id)}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedInstructorId === inst.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                             >
                                <img src={inst.image_url} alt={inst.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <div className="font-bold text-slate-800">{inst.name}</div>
                                    <div className="text-xs text-slate-500">{inst.vehicle_type}</div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step 2: Select Date (Visible only if Instructor selected) */}
            <div className={`transition-all duration-500 ${selectedInstructorId ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                 <h3 className="text-lg font-bold text-slate-800 mb-4 px-4 lg:px-0">2. Selecciona Fecha</h3>
                 <div className="flex justify-center">
                    <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />
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
