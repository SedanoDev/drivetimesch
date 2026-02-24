import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function StudentMyClasses() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/bookings.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setBookings(data))
    .catch(console.error);
  }, [token]);

  const handleCancel = async (id: string) => {
      if(!confirm('¿Estás seguro de cancelar esta clase?')) return;

      const res = await fetch(`${API_URL}/bookings.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, status: 'cancelled' })
      });

      if(res.ok) {
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Mis Clases</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 font-bold uppercase text-xs text-slate-500">
                  <tr>
                      <th className="px-6 py-4">Fecha y Hora</th>
                      <th className="px-6 py-4">Profesor</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium">{b.booking_date} {b.start_time}</td>
                          <td className="px-6 py-4">{b.instructor_name}</td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {b.status}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              {b.status !== 'cancelled' && (
                                  <button onClick={() => handleCancel(b.id)} className="text-red-600 hover:underline">Cancelar</button>
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
