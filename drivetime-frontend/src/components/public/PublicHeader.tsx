import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export function PublicHeader() {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">DriveTime</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <Link to="/features" className="hover:text-blue-600 transition-colors">Características</Link>
          <a href="/#pricing" className="hover:text-blue-600 transition-colors">Precios</a>
          <Link to="/find-school" className="hover:text-blue-600 transition-colors">Soy Alumno</Link>
        </nav>
        <div className="flex gap-4">
          <Link to="/find-school" className="hidden md:flex items-center text-slate-600 font-medium hover:text-blue-600">
            Acceso / Login
          </Link>
          <Link
            to="/register-school"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Registrar Autoescuela
          </Link>
        </div>
      </div>
    </header>
  );
}
