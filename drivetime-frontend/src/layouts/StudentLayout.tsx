import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Menu, X, Car, LayoutDashboard, Calendar, GraduationCap, Settings, LogOut } from 'lucide-react';

export function StudentLayout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (user?.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Car className="text-blue-600 w-8 h-8" />
            <span className="font-bold text-xl text-slate-800">DriveTime</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/student/dashboard" icon={<LayoutDashboard size={20} />} label="Inicio" />
            <NavItem to="/student/bookings" icon={<Calendar size={20} />} label="Mis Clases" />
            <NavItem to="/student/progress" icon={<GraduationCap size={20} />} label="Progreso" />
            <NavItem to="/student/profile" icon={<Settings size={20} />} label="Perfil" />
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

      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Car className="text-blue-600 w-6 h-6" />
            <span className="font-bold text-lg text-slate-800">DriveTime</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-40 pt-20 px-6 space-y-4">
            <NavItem to="/student/dashboard" icon={<LayoutDashboard size={20} />} label="Inicio" onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem to="/student/bookings" icon={<Calendar size={20} />} label="Mis Clases" onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem to="/student/progress" icon={<GraduationCap size={20} />} label="Progreso" onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem to="/student/profile" icon={<Settings size={20} />} label="Perfil" onClick={() => setIsMobileMenuOpen(false)} />
            <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 w-full text-red-600 bg-red-50 rounded-xl font-medium mt-8"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </button>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
           <Outlet />
        </div>
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }
            `}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}
