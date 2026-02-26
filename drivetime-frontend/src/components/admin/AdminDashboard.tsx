import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, User, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface DashboardStats {
  bookings_today: number;
  bookings_pending: number;
  top_instructor: string;
  total_revenue: number;
}

interface Booking {
    id: string;
    student_name: string;
    instructor_name: string;
    booking_date: string;
    start_time: string;
    status: string;
}

export function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
        // Fetch Stats
        fetch(`${API_URL}/dashboard.php`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(console.error);

        // Fetch Recent Bookings
        fetch(`${API_URL}/bookings.php`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Sort by date desc and take top 5
                const recent = data
                    .sort((a, b) => new Date(`${b.booking_date}T${b.start_time}`).getTime() - new Date(`${a.booking_date}T${a.start_time}`).getTime())
                    .slice(0, 5);
                setRecentBookings(recent);
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando panel...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1>
        <p className="text-slate-500">Bienvenido de nuevo, {user?.name}</p>
      </div>

      {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Reservas Hoy" value={stats.bookings_today} icon={<Calendar size={24} />} color="blue" />
            <StatsCard title="Pendientes" value={stats.bookings_pending} icon={<Clock size={24} />} color="orange" />
            <StatsCard title="Instructor Top" value={stats.top_instructor || 'N/A'} icon={<TrendingUp size={24} />} color="green" />
            <StatsCard title="Ingresos (Est.)" value={`${stats.total_revenue} €`} icon={<DollarSign size={24} />} color="purple" />
          </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Actividad Reciente</h2>
                  <Link to="/admin/bookings" className="text-sm text-blue-600 font-bold hover:underline">Ver todas</Link>
              </div>

              <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No hay reservas recientes.</p>
                  ) : (
                      recentBookings.map(booking => (
                          <div key={booking.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                      ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {booking.student_name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm">{booking.student_name}</p>
                                      <p className="text-xs text-slate-500">con {booking.instructor_name}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-slate-700 text-sm">
                                      {format(new Date(booking.booking_date), 'd MMM', { locale: es })}
                                  </p>
                                  <p className="text-xs text-slate-400">{booking.start_time.substring(0,5)}</p>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <h3 className="font-bold text-lg mb-2">Nuevo Alumno</h3>
                  <p className="text-blue-100 text-sm mb-4">Registra manualmente un alumno o instructor.</p>
                  <Link to="/admin/users" className="block w-full text-center bg-white text-blue-600 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors text-sm">
                      Ir a Usuarios
                  </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Accesos Rápidos</h3>
                  <div className="space-y-2">
                      <Link to="/admin/bookings" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-blue-600 transition-colors">
                          <Calendar size={18} /> Gestionar Agenda
                      </Link>
                      <Link to="/admin/packs" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-blue-600 transition-colors">
                          <DollarSign size={18} /> Configurar Packs
                      </Link>
                      <Link to="/admin/instructors" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-blue-600 transition-colors">
                          <User size={18} /> Ver Profesores
                      </Link>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center gap-4 shadow-sm`}>
            <div className="p-3 bg-white rounded-xl shadow-sm bg-opacity-50 backdrop-blur-sm">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
