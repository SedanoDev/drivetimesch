import { useAuth } from '../hooks/useAuth';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Car, LayoutDashboard, Users, Calendar, LogOut, FileText } from 'lucide-react';

export function InstructorLayout() {
  const { user, logout } = useAuth();

  if (user?.role !== 'instructor') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Car className="text-orange-600 w-8 h-8" />
            <span className="font-bold text-xl text-slate-800">DriveTime</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/instructor/dashboard" icon={<LayoutDashboard size={20} />} label="Agenda" />
            <NavItem to="/instructor/students" icon={<Users size={20} />} label="Mis Alumnos" />
            <NavItem to="/instructor/availability" icon={<Calendar size={20} />} label="Disponibilidad" />
            <NavItem to="/instructor/evaluations" icon={<FileText size={20} />} label="Evaluaciones" />
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
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                }
            `}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}
