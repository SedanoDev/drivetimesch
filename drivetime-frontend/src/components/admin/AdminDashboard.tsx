import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BookingsManager } from './BookingsManager';
import { InstructorsManager } from './InstructorsManager';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface DashboardStats {
  bookings_today: number;
  bookings_pending: number;
  top_instructor: string;
  total_revenue: number;
}

export function AdminDashboard() {
  const { token, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'dashboard' | 'bookings' | 'instructors'>('dashboard');

  useEffect(() => {
    fetch(`${API_URL}/dashboard.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setStats(data))
    .catch(console.error);
  }, [token]);

  if (!stats) return <div className="p-8">Cargando estadísticas...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800">Panel de Administración</h1>
            <nav className="flex gap-2 ml-8">
                <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded-lg text-sm font-bold ${view === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Dashboard</button>
                <button onClick={() => setView('bookings')} className={`px-3 py-1 rounded-lg text-sm font-bold ${view === 'bookings' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Reservas</button>
                <button onClick={() => setView('instructors')} className={`px-3 py-1 rounded-lg text-sm font-bold ${view === 'instructors' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Profesores</button>
            </nav>
        </div>
        <button onClick={logout} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors">
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Reservas Hoy" value={stats.bookings_today} icon="📅" color="blue" />
        <StatsCard title="Pendientes" value={stats.bookings_pending} icon="⏳" color="orange" />
        <StatsCard title="Instructor Top" value={stats.top_instructor} icon="🏆" color="green" />
        <StatsCard title="Ingresos Totales" value={`${stats.total_revenue} €`} icon="💰" color="purple" />
      </div>

      {view === 'bookings' && <BookingsManager />}
      {view === 'instructors' && <InstructorsManager />}
      {view === 'dashboard' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-4xl mb-4">👋</span>
              <p>Selecciona una pestaña para comenzar a gestionar.</p>
          </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center gap-4 shadow-sm`}>
            <div className="text-3xl">{icon}</div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
