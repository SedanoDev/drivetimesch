import { Car, Shield, Smartphone, Calendar, UserCheck, TrendingUp } from 'lucide-react';

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Todas las herramientas que necesitas</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Desde la reserva hasta la facturación, DriveTime automatiza tu autoescuela.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            title="Calendario Inteligente"
            desc="Sincronización en tiempo real. Evita conflictos de horarios y permite que los alumnos reserven 24/7."
          />
          <FeatureCard
            icon={<UserCheck className="w-8 h-8 text-green-600" />}
            title="Perfiles de Usuario"
            desc="Instructores, alumnos y administradores tienen paneles personalizados con la información que necesitan."
          />
          <FeatureCard
            icon={<Smartphone className="w-8 h-8 text-purple-600" />}
            title="Experiencia Móvil"
            desc="Tus alumnos viven pegados al móvil. Dales una app web rápida y sencilla para gestionar sus clases."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-orange-500" />}
            title="Seguridad de Datos"
            desc="Copias de seguridad diarias, encriptación SSL y cumplimiento estricto de la normativa GDPR."
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-pink-500" />}
            title="Analíticas y Reportes"
            desc="Visualiza el rendimiento de tus profesores, horas más demandadas e ingresos mensuales."
          />
          <FeatureCard
            icon={<Car className="w-8 h-8 text-cyan-500" />}
            title="Gestión de Flota"
            desc="Controla qué vehículo usa cada profesor y gestiona mantenimientos (Próximamente)."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
