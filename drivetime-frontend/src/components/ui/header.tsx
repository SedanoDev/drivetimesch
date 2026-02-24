import { Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-blue-600 text-white py-4 px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <span>🚗 DriveTime</span>
      </div>

      <nav className="hidden md:flex gap-8 text-sm font-medium">
        <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Inicio</a>
        <a href="#" className="opacity-100 font-bold border-b-2 border-white pb-1">Reservar</a>
        <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Mis clases</a>
        <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Progreso</a>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-blue-700 p-1 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-xs font-bold border border-blue-300 shadow-sm">
            LS
          </div>
          <span className="text-sm font-medium hidden sm:block">Luis S.</span>
        </div>
        <button className="md:hidden p-2 hover:bg-blue-700 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
