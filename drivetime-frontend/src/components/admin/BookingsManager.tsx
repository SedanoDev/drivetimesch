import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  student_name: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  instructor_name: string;
}

export function BookingsManager() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/bookings.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setBookings(data))
    .catch(console.error);
  }, [token]);

  const handleStatusChange = async (id: string, newStatus: string) => {
      try {
          const res = await fetch(`${API_URL}/bookings.php`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ id, status: newStatus })
          });

          if (res.ok) {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
          }
      } catch (err) {
          alert('Error updating status');
      }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <h2 className="text-xl font-bold mb-4">Reservas Recientes</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Fecha</th>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Profesor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 rounded-r-lg">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                    {booking.booking_date} {booking.start_time}
                </td>
                <td className="px-4 py-3">{booking.student_name}</td>
                <td className="px-4 py-3 text-slate-500">{booking.instructor_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                    {booking.status !== 'cancelled' && (
                        <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                            Cancelar
                        </button>
                    )}
                     {booking.status === 'pending' && (
                        <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="text-green-500 hover:text-green-700 font-medium text-xs border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                        >
                            Confirmar
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
