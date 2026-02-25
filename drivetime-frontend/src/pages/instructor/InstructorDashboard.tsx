import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, CheckCircle, Save } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

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
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');

  const fetchBookings = () => {
      setLoading(true);
      fetch(`${API_URL}/bookings.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setBookings(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchBookings();
  }, [token]);

  // Week Calendar Logic
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const handleBookingClick = (booking: Booking) => {
      setSelectedBooking(booking);
      setNotes(booking.notes || '');
  };

  const updateBooking = async (status?: string) => {
      if (!selectedBooking) return;

      const payload: any = { id: selectedBooking.id };
      if (status) payload.status = status;
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
              setSelectedBooking(null);
              fetchBookings();
          } else {
              alert('Error al actualizar');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando agenda...</div>;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Mi Agenda</h1>
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button>
                <span className="px-4 font-bold text-slate-700 capitalize">
                    {format(startOfCurrentWeek, 'MMMM yyyy', { locale: es })}
                </span>
                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20} /></button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                {weekDays.map(day => (
                    <div key={day.toISOString()} className={`p-4 text-center ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">{format(day, 'EEEE', { locale: es })}</div>
                        <div className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-slate-800'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-5 divide-x divide-slate-100 min-h-[400px]">
                {weekDays.map(day => {
                    const dayBookings = bookings.filter(b =>
                        b.booking_date === format(day, 'yyyy-MM-dd') && b.status !== 'cancelled'
                    );

                    return (
                        <div key={day.toISOString()} className="p-2 space-y-2">
                            {dayBookings.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBookingClick(b)}
                                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all hover:shadow-md
                                        ${b.status === 'completed'
                                            ? 'bg-slate-50 border-slate-200 opacity-75'
                                            : 'bg-white border-blue-100 shadow-sm border-l-4 border-l-blue-500'}`}
                                >
                                    <div className="font-bold text-slate-800 mb-1">{b.start_time.substring(0,5)}</div>
                                    <div className="truncate font-medium text-slate-600">{b.student_name}</div>
                                    {b.status === 'completed' && <div className="text-xs text-green-600 font-bold mt-1">✓ Completada</div>}
                                </button>
                            ))}
                            {dayBookings.length === 0 && (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Detail Modal */}
        {selectedBooking && (
            <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Detalle de Clase">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                            {selectedBooking.student_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{selectedBooking.student_name}</h3>
                            <p className="text-slate-500">{selectedBooking.student_email}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm font-medium text-slate-600">
                                <span className="flex items-center gap-1"><Clock size={16} /> {selectedBooking.start_time.substring(0,5)}</span>
                                <span className="flex items-center gap-1 capitalize"><MapPin size={16} /> Práctica</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas del Instructor</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={4}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Progreso del alumno, errores a corregir..."
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => updateBooking()}
                            className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            <Save size={18} /> Guardar Notas
                        </button>

                        {selectedBooking.status !== 'completed' && (
                            <button
                                onClick={() => updateBooking('completed')}
                                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                            >
                                <CheckCircle size={18} /> Marcar como Completada
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
}
