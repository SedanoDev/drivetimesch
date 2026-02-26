import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <Car /> DriveTime
          </div>
          <p className="text-sm">Digitalizando el futuro de la enseñanza vial.</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Producto</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/features" className="hover:text-white">Características</Link></li>
            <li><a href="/#pricing" className="hover:text-white">Precios</a></li>
            <li><Link to="/privacy" className="hover:text-white">Seguridad</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Compañía</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">Sobre nosotros</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-white">Privacidad</Link></li>
            <li><Link to="/terms" className="hover:text-white">Términos</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-sm">
        &copy; {new Date().getFullYear()} DriveTime. Todos los derechos reservados.
      </div>
    </footer>
  );
}
