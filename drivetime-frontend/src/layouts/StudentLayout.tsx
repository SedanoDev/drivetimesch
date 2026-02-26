import { useAuth } from '../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, TrendingUp, User } from 'lucide-react';
import { SidebarLayout } from './SidebarLayout';

export function StudentLayout() {
  const { user, logout } = useAuth();

  if (user?.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  const links = [
      { to: "/student/dashboard", icon: <LayoutDashboard size={20} />, label: "Reservar Clase" },
      { to: "/student/bookings", icon: <Calendar size={20} />, label: "Mis Clases" },
      { to: "/student/progress", icon: <TrendingUp size={20} />, label: "Mi Progreso" },
      { to: "/student/profile", icon: <User size={20} />, label: "Mi Perfil" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <SidebarLayout
        title="Alumno"
        links={links}
        logout={logout}
        colorClass="text-green-600"
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
