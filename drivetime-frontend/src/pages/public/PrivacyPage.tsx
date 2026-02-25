import { Car, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">DriveTime</span>
          </Link>
          <div className="flex gap-4">
             <Link to="/" className="text-slate-500 font-medium hover:text-blue-600">Volver</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 text-slate-700 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
          <Lock className="w-8 h-8 text-green-600" />
          Política de Privacidad
        </h1>
        <p className="mb-6">Última actualización: 01 de Enero de 2026</p>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Recopilación de Información</h2>
          <p className="mb-4">
            Recopilamos información personal que usted nos proporciona voluntariamente al registrarse,
            como nombre, dirección de correo electrónico y número de teléfono.
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Uso de la Información</h2>
          <p className="mb-4">
            Utilizamos su información para proporcionar y mejorar nuestros servicios, procesar sus transacciones
            y comunicarnos con usted sobre actualizaciones o problemas técnicos.
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Compartir Información</h2>
          <p className="mb-4">
            No vendemos ni alquilamos su información personal a terceros. Podemos compartir información con
            proveedores de servicios que nos ayudan a operar nuestro negocio (por ejemplo, procesamiento de pagos).
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Seguridad</h2>
          <p className="mb-4">
            Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra el acceso,
            la alteración o la divulgación no autorizados.
          </p>
        </section>

      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>&copy; {new Date().getFullYear()} DriveTime SaaS.</p>
      </footer>
    </div>
  );
}
