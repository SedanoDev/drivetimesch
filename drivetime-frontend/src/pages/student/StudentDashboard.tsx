import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Booking {
    id: string;
    instructor_name: string;
    booking_date: string;
    start_time: string;
    status: string;
}

export function StudentDashboard() {
  const { user, token } = useAuth();
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const credits = 0; // Placeholder until backend support
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
        // Fetch bookings to find next one
        fetch(`${API_URL}/bookings.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Filter upcoming and sort
                const upcoming = data
                    .filter((b: Booking) => new Date(`${b.booking_date}T${b.start_time}`) > new Date() && b.status !== 'cancelled')
                    .sort((a, b) => new Date(`${a.booking_date}T${a.start_time}`).getTime() - new Date(`${b.booking_date}T${b.start_time}`).getTime());

                if (upcoming.length > 0) {
                    setNextBooking(upcoming[0]);
                }
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Hola, {user?.name.split(' ')[0]} 👋</h1>
            <p className="text-slate-500">Aquí tienes un resumen de tu progreso.</p>
        </div>
        <Link to="/student/book" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Reservar Clase
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          {/* Next Class Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-2">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={20} /> Tu Próxima Clase
              </h2>

              {loading ? (
                  <div className="animate-pulse h-24 bg-slate-100 rounded-xl"></div>
              ) : nextBooking ? (
                  <div className="flex items-center gap-6">
                      <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center min-w-[80px]">
                          <span className="block text-2xl font-bold">{format(new Date(nextBooking.booking_date), 'd')}</span>
                          <span className="text-xs uppercase font-bold">{format(new Date(nextBooking.booking_date), 'MMM', { locale: es })}</span>
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 capitalize">
                              {format(new Date(nextBooking.booking_date), 'EEEE, d MMMM', { locale: es })}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1"><Clock size={16} /> {nextBooking.start_time.substring(0,5)}</span>
                              <span className="flex items-center gap-1"><MapPin size={16} /> Con {nextBooking.instructor_name}</span>
                          </div>
                          <p className="mt-2 text-xs text-blue-600 font-bold bg-blue-50 inline-block px-2 py-1 rounded">
                              Faltan {differenceInDays(new Date(nextBooking.booking_date), new Date())} días
                          </p>
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium mb-2">No tienes clases programadas.</p>
                      <Link to="/student/book" className="text-blue-600 font-bold hover:underline text-sm">Reserva tu primera clase ahora &rarr;</Link>
                  </div>
              )}
          </div>

          {/* Credits / Pack Status */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                          <CreditCard size={20} className="text-blue-400" /> Tus Créditos
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">Saldo disponible</p>
                  </div>
                  <Link to="/student/payments" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors">
                      <ChevronRight size={20} />
                  </Link>
              </div>

              <div className="mb-6">
                  <span className="text-4xl font-bold">{credits}</span>
                  <span className="text-slate-400 text-sm ml-2">clases restantes</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
              <p className="text-xs text-slate-400 text-right">Pack Básico (5 clases)</p>

              <Link to="/student/payments" className="block w-full text-center mt-6 bg-white text-slate-900 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors text-sm">
                  Comprar más clases
              </Link>
          </div>
      </div>

      {/* Quick Actions / Tips */}
      <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-2">💡 Consejo del día</h3>
              <p className="text-orange-700 text-sm">Recuerda ajustar los espejos antes de arrancar. Una buena visibilidad es clave para la seguridad.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                  <h3 className="font-bold text-blue-800 mb-1">Invita a un amigo</h3>
                  <p className="text-blue-600 text-sm">Gana 1 clase gratis por cada amigo que se apunte.</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Invitar</button>
          </div>
      </div>
    </div>
  );
}
