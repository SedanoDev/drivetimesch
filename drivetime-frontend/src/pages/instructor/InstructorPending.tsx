import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';

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

export function InstructorPending() {
    const { token } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Reject/Cancel Modal State
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_URL}/bookings.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter only pending bookings
                const pending = data.filter((b: Booking) => b.status === 'pending');
                setBookings(pending);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (id: string, newStatus: string, notes?: string) => {
        const payload: any = { id, status: newStatus };
        if (notes !== undefined) {
            payload.notes = notes;
        }

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
                // Remove from pending list
                setBookings(prev => prev.filter(b => b.id !== id));
                return true;
            } else {
                alert('Error al actualizar la reserva');
                return false;
            }
        } catch (error) {
            console.error("Error updating booking:", error);
            alert('Error al actualizar la reserva');
            return false;
        }
    };

    const handleAccept = (id: string) => {
        if (confirm('¿Estás seguro de que quieres aceptar esta clase?')) {
            updateBookingStatus(id, 'confirmed');
        }
    };

    const handleComplete = (id: string) => {
        if (confirm('¿Marcar esta clase como completada?')) {
            updateBookingStatus(id, 'completed');
        }
    };

    const openCancelModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelReason(booking.notes || '');
    };

    const handleReject = async () => {
        if (!selectedBooking) return;
        setIsCancelling(true);

        const success = await updateBookingStatus(selectedBooking.id, 'cancelled', cancelReason);

        if (success) {
            setSelectedBooking(null);
            setCancelReason('');
        }
        setIsCancelling(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando reservas pendientes...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle className="text-amber-500" />
                        Reservas Pendientes
                    </h1>
                    <p className="text-slate-500 mt-1">Gestiona las solicitudes de clases de tus alumnos.</p>
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No hay reservas pendientes</h3>
                    <p className="text-slate-500 mt-2 max-w-md">
                        Todas las solicitudes han sido gestionadas. Buen trabajo.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-xl font-bold uppercase border border-amber-100">
                                        {booking.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{booking.student_name}</h3>
                                        <p className="text-sm text-slate-500">{booking.student_email}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wide border border-amber-100">
                                    Pendiente
                                </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Clock size={16} className="text-blue-500" />
                                    {format(parseISO(booking.booking_date), "EEEE, d 'de' MMMM", { locale: es })}
                                    <span className="text-slate-400 mx-1">•</span>
                                    {booking.start_time.substring(0, 5)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={16} className="text-slate-400" />
                                    Clase Práctica
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleAccept(booking.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={18} />
                                    Aceptar
                                </button>
                                <button
                                    onClick={() => handleComplete(booking.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={18} />
                                    Completar
                                </button>
                                <button
                                    onClick={() => openCancelModal(booking)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-medium hover:bg-red-50 transition-colors"
                                >
                                    <XCircle size={18} />
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel/Reject Modal */}
            {selectedBooking && (
                <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Rechazar Reserva">
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p>
                                Al rechazar esta reserva, el crédito será devuelto automáticamente al paquete del alumno.
                                Puedes dejar un mensaje opcional para el alumno explicando el motivo.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <MessageSquare size={16} />
                                Motivo / Mensaje al alumno (Opcional)
                            </label>
                            <textarea
                                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-700 bg-white"
                                rows={4}
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Ej: Lo siento, me surgió un imprevisto. Por favor, reserva en otro horario."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isCancelling}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {isCancelling ? 'Rechazando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
