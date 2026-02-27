import { useAuth } from '../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, User, AlertCircle } from 'lucide-react';
import { SidebarLayout } from './SidebarLayout';

export function InstructorLayout() {
  const { user, logout } = useAuth();

  if (user?.role !== 'instructor') {
    return <Navigate to="/" replace />;
  }

  const links = [
      { to: "/instructor/dashboard", icon: <LayoutDashboard size={20} />, label: "Agenda" },
      { to: "/instructor/pendientes", icon: <AlertCircle size={20} />, label: "Pendientes" },
      { to: "/instructor/students", icon: <Users size={20} />, label: "Mis Alumnos" },
      { to: "/instructor/availability", icon: <Calendar size={20} />, label: "Disponibilidad" },
      { to: "/instructor/profile", icon: <User size={20} />, label: "Mi Perfil" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <SidebarLayout
        title="Instructor"
        links={links}
        logout={logout}
        colorClass="text-blue-600"
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
