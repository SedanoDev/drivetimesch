import { useAuth } from '../hooks/useAuth';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Car, LayoutDashboard, Users, Calendar, LogOut, Settings } from 'lucide-react';

export function AdminLayout() {
  const { user, logout } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Car className="text-purple-600 w-8 h-8" />
            <span className="font-bold text-xl text-slate-800">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem to="/admin/bookings" icon={<Calendar size={20} />} label="Reservas" />
            <NavItem to="/admin/users" icon={<Users size={20} />} label="Usuarios" />
            <NavItem to="/admin/instructors" icon={<Users size={20} />} label="Profesores" />
            <NavItem to="/admin/config" icon={<Settings size={20} />} label="Configuración" />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium text-sm"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-purple-600'
                }
            `}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}
