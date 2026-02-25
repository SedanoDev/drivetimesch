import { Car, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsPage() {
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
          <FileText className="w-8 h-8 text-orange-500" />
          Términos y Condiciones
        </h1>
        <p className="mb-6">Última actualización: 01 de Enero de 2026</p>

        <div className="space-y-8">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Aceptación de los Términos</h2>
            <p>
                Al acceder o utilizar nuestro sitio web y servicios, usted acepta estar sujeto a estos 
                Términos y Condiciones y a nuestra Política de Privacidad. Si no está de acuerdo, 
                por favor no utilice nuestros servicios.
            </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Descripción del Servicio</h2>
            <p>
                DriveTime proporciona una plataforma SaaS para la gestión de reservas y operaciones 
                de autoescuelas. Nos reservamos el derecho de modificar o discontinuar el servicio 
                en cualquier momento sin previo aviso.
            </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Cuentas de Usuario</h2>
            <p>
                Usted es responsable de mantener la confidencialidad de su contraseña y cuenta, 
                y es totalmente responsable de todas las actividades que ocurran bajo su contraseña o cuenta.
            </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Propiedad Intelectual</h2>
            <p>
                Todo el contenido y materiales disponibles en DriveTime, incluyendo pero no limitado a 
                texto, gráficos, nombre del sitio web, código, imágenes y logotipos son propiedad intelectual 
                de DriveTime y están protegidos por las leyes de derechos de autor y marcas registradas aplicables.
            </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Limitación de Responsabilidad</h2>
            <p>
                En ningún caso DriveTime será responsable por daños directos, indirectos, incidentales, 
                especiales o consecuentes que resulten del uso o la imposibilidad de usar el servicio.
            </p>
            </section>
        </div>

      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>&copy; {new Date().getFullYear()} DriveTime SaaS.</p>
      </footer>
    </div>
  );
}
