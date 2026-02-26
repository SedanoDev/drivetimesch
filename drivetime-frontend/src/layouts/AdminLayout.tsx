import { useAuth } from '../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, Car, Package } from 'lucide-react';
import { SidebarLayout } from './SidebarLayout';

export function AdminLayout() {
  const { user, logout } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  const links = [
      { to: "/admin/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
      { to: "/admin/bookings", icon: <Calendar size={20} />, label: "Reservas" },
      { to: "/admin/users", icon: <Users size={20} />, label: "Usuarios" },
      { to: "/admin/instructors", icon: <Users size={20} />, label: "Profesores" },
      { to: "/admin/vehicles", icon: <Car size={20} />, label: "Vehículos" },
      { to: "/admin/packs", icon: <Package size={20} />, label: "Bonos" },
      { to: "/admin/config", icon: <Settings size={20} />, label: "Configuración" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <SidebarLayout 
        title="Admin Panel" 
        links={links} 
        logout={logout} 
        colorClass="text-purple-600"
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
