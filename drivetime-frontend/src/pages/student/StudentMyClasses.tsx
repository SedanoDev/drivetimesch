import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, User, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Booking {
    id: string;
    instructor_name: string;
    booking_date: string;
    start_time: string;
    status: 'confirmed' | 'cancelled' | 'pending' | 'completed';
    has_review: boolean;
}

export function StudentMyClasses() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Review State
  const [showReview, setShowReview] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  const fetchBookings = () => {
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

  const handleCancel = async (id: string) => {
      if (!confirm('¿Seguro que quieres cancelar?')) return;

      const res = await fetch(`${API_URL}/bookings.php`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id, status: 'cancelled' })
      });

      if (res.ok) fetchBookings();
      else alert('Error al cancelar');
  };

  const handleReview = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/reviews.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ ...review, booking_id: selectedBooking })
          });

          if (res.ok) {
              setShowReview(false);
              setReview({ rating: 5, comment: '' });
              fetchBookings();
              alert('¡Gracias por tu valoración!');
          } else {
              const data = await res.json();
              alert(data.error || 'Error al enviar reseña');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  const openReviewModal = (id: string) => {
      setSelectedBooking(id);
      setShowReview(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando reservas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Mis Clases</h1>

        {/* Review Modal */}
        <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Valorar Clase">
            <form onSubmit={handleReview} className="space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setReview({...review, rating: star})}
                            className={`transition-transform hover:scale-110 ${star <= review.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                        >
                            <Star size={32} fill={star <= review.rating ? "currentColor" : "none"} />
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Comentario (Opcional)</label>
                    <textarea
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows={3}
                        value={review.comment}
                        onChange={e => setReview({...review, comment: e.target.value})}
                        placeholder="¿Qué tal fue la clase?"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                    Enviar Reseña
                </button>
            </form>
        </Modal>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
                {bookings.map((booking) => (
                    <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                                <Calendar size={20} className="text-blue-500" />
                                {new Date(booking.booking_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 text-sm">
                                <span className="flex items-center gap-1"><Clock size={16} /> {booking.start_time.substring(0, 5)}</span>
                                <span className="flex items-center gap-1"><User size={16} /> {booking.instructor_name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                                ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                                  booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                  'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                {booking.status === 'completed' ? 'Completada' : booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                            </span>

                            {booking.status === 'confirmed' || booking.status === 'pending' ? (
                                <button
                                    onClick={() => handleCancel(booking.id)}
                                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-bold"
                                >
                                    <XCircle size={18} /> Cancelar
                                </button>
                            ) : null}

                            {booking.status === 'completed' && !booking.has_review && (
                                <button
                                    onClick={() => openReviewModal(booking.id)}
                                    className="flex items-center gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-yellow-200"
                                >
                                    <Star size={16} /> Valorar
                                </button>
                            )}

                            {booking.status === 'completed' && booking.has_review && (
                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold px-3 py-2">
                                    <CheckCircle size={16} /> Valorada
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {bookings.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <p>No tienes reservas.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
