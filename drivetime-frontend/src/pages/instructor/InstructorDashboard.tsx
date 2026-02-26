import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, MapPin, CheckCircle, Save, Calendar as CalendarIcon, List as ListIcon, User } from 'lucide-react';
import { format, isSameDay, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';
import { Calendar } from '../../components/booking/calendar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Booking {
    id: string;
    student_name: string;
    student_email: string;
    booking_date: string;
    start_time: string;
    status: string;
    notes: string | null;
}

export function InstructorDashboard() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Available dates for dots in calendar (derived from bookings)
  const [bookingDates, setBookingDates] = useState<string[]>([]);

  const fetchBookings = () => {
      setLoading(true);
      fetch(`${API_URL}/bookings.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              setBookings(data);
              // Extract unique dates for calendar dots
              const dates = Array.from(new Set(data.filter((b: Booking) => b.status !== 'cancelled').map((b: Booking) => b.booking_date))) as string[];
              setBookingDates(dates);
          }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchBookings();
  }, [token]);

  const handleBookingClick = (booking: Booking) => {
      setSelectedBooking(booking);
      setNotes(booking.notes || '');
  };

  const updateBooking = async (status?: string) => {
      if (!selectedBooking) return;

      setSavingNotes(true);

      const payload: any = { id: selectedBooking.id };
      if (status) payload.status = status;
      // Always send notes if they changed, or just send them if we are saving notes
      if (notes !== selectedBooking.notes) payload.notes = notes;

      try {
          const res = await fetch(`${API_URL}/bookings.php`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              // Update local state to reflect changes immediately
              setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: status || b.status, notes: notes } : b));

              if (status === 'completed') {
                  setSelectedBooking(prev => prev ? { ...prev, status: 'completed', notes: notes } : null);
                  // Optional: Close modal after completion? Or let user see updated status.
                  // setSelectedBooking(null);
              } else {
                  // If just saving notes
                  alert('Notas guardadas correctamente');
                  setSelectedBooking(prev => prev ? { ...prev, notes: notes } : null);
              }
          } else {
              alert('Error al actualizar');
          }
      } catch (err) {
          alert('Error de conexión');
      } finally {
          setSavingNotes(false);
      }
  };

  // Filtering Logic
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // List View: Today's Classes
  const todaysClasses = bookings.filter(b => b.booking_date === todayStr && b.status !== 'cancelled').sort((a,b) => a.start_time.localeCompare(b.start_time));

  // List View: Upcoming Classes (Tomorrow onwards)
  const upcomingClasses = bookings.filter(b => b.booking_date > todayStr && b.status !== 'cancelled').sort((a,b) => {
      if (a.booking_date === b.booking_date) return a.start_time.localeCompare(b.start_time);
      return a.booking_date.localeCompare(b.booking_date);
  });

  // Calendar View: Selected Date Classes
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateClasses = bookings.filter(b => b.booking_date === selectedDateStr && b.status !== 'cancelled').sort((a,b) => a.start_time.localeCompare(b.start_time));

  if (loading) return <div className="p-12 text-center text-slate-500">Cargando agenda...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Mi Agenda</h1>
                <p className="text-slate-500">Gestiona tus clases y alumnos</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ListIcon size={18} /> Lista
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarIcon size={18} /> Calendario
                </button>
            </div>
        </div>

        {viewMode === 'list' ? (
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Today's Schedule */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                        Clases de Hoy
                    </h2>

                    {todaysClasses.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                            <p>No tienes clases programadas para hoy.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todaysClasses.map(booking => (
                                <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Schedule */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-slate-300 rounded-full"></span>
                        Próximas Clases
                    </h2>

                    {upcomingClasses.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                            <p>No hay clases futuras programadas.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingClasses.slice(0, 5).map(booking => ( // Limit to 5 for cleanliness
                                <BookingCard key={booking.id} booking={booking} showDate onClick={() => handleBookingClick(booking)} />
                            ))}
                            {upcomingClasses.length > 5 && (
                                <button onClick={() => setViewMode('calendar')} className="w-full py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors">
                                    Ver {upcomingClasses.length - 5} más...
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="grid lg:grid-cols-12 gap-8">
                {/* Calendar Side */}
                <div className="lg:col-span-4">
                    <Calendar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        availableDates={bookingDates} // Show dots on days with bookings
                        disablePast={false} // Allow browsing past days in dashboard
                        disableUnavailable={false} // Allow clicking any day to see history
                        className="w-full"
                    />
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> Días con clases
                    </div>
                </div>

                {/* Day Details Side */}
                <div className="lg:col-span-8 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 capitalize border-b border-slate-100 pb-4">
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                    </h2>

                    {selectedDateClasses.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            No hay clases para este día.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateClasses.map(booking => (
                                <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Detail Modal */}
        {selectedBooking && (
            <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Detalle de Clase">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border border-slate-100 uppercase">
                            {selectedBooking.student_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{selectedBooking.student_name}</h3>
                            <p className="text-sm text-slate-500">{selectedBooking.student_email}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm font-medium text-slate-700">
                                <span className="flex items-center gap-1"><Clock size={16} className="text-blue-500" /> {selectedBooking.start_time.substring(0,5)}</span>
                                <span className="flex items-center gap-1 capitalize"><MapPin size={16} className="text-blue-500" /> Práctica</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas del Instructor (Privadas)</label>
                        <textarea
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 bg-white"
                            rows={4}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Anota el progreso, errores a corregir, o detalles importantes de la clase..."
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => updateBooking()}
                            disabled={savingNotes}
                            className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} /> {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                        </button>

                        {selectedBooking.status !== 'completed' ? (
                            <button
                                onClick={() => updateBooking('completed')}
                                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                            >
                                <CheckCircle size={18} /> Completar Clase
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold text-center border border-green-100 flex items-center justify-center gap-2">
                                <CheckCircle size={18} /> Clase Completada
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
}

// Sub-component for individual booking cards
function BookingCard({ booking, showDate = false, onClick }: { booking: Booking, showDate?: boolean, onClick: () => void }) {
    const isCompleted = booking.status === 'completed';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md flex items-center justify-between group
                ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold
                    ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'}`}>
                    <span>{booking.start_time.substring(0,5)}</span>
                </div>
                <div>
                    <h3 className={`font-bold ${isCompleted ? 'text-slate-600' : 'text-slate-800'}`}>{booking.student_name}</h3>
                    {showDate && (
                        <p className="text-xs text-slate-500 capitalize">
                            {format(parseISO(booking.booking_date), "EEEE d 'de' MMM", { locale: es })}
                        </p>
                    )}
                </div>
            </div>

            {isCompleted ? (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Completada</span>
            ) : (
                <div className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                    <User size={20} />
                </div>
            )}
        </button>
    );
}
