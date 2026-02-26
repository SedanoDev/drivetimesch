import { Heart, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Sobre DriveTime</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Somos un equipo apasionado por la tecnología y la educación vial. Nuestra misión es
            eliminar el papel y las llamadas telefónicas de la gestión de autoescuelas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="bg-slate-100 rounded-3xl p-12 h-full flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-4">Nuestra Historia</h2>
                <p className="text-lg text-slate-600 mb-6">
                    DriveTime nació en 2024 cuando nos dimos cuenta de que reservar una clase de conducir
                    seguía siendo tan difícil como en los años 90. Decidimos crear una plataforma
                    SaaS moderna, rápida y fiable.
                </p>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center flex-1">
                        <span className="block text-3xl font-bold text-blue-600">500+</span>
                        <span className="text-sm text-slate-500">Autoescuelas</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center flex-1">
                        <span className="block text-3xl font-bold text-purple-600">1M+</span>
                        <span className="text-sm text-slate-500">Reservas</span>
                    </div>
                </div>
            </div>
            <div className="grid gap-6">
                <ValueCard
                    icon={<Heart className="text-red-500" />}
                    title="Pasión por el Cliente"
                    desc="Escuchamos a cada profesor y alumno para mejorar la app cada semana."
                />
                <ValueCard
                    icon={<Zap className="text-yellow-500" />}
                    title="Velocidad ante todo"
                    desc="Nadie quiere esperar. Nuestra infraestructura está optimizada para ser instantánea."
                />
                <ValueCard
                    icon={<Globe className="text-blue-500" />}
                    title="Global pero Local"
                    desc="Diseñado para escalar, pero adaptado a la normativa de tu ciudad."
                />
            </div>
        </div>

        <div className="text-center bg-blue-600 text-white rounded-3xl p-16">
            <h2 className="text-3xl font-bold mb-4">¿Listo para unirte?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                Empieza hoy mismo y digitaliza tu autoescuela en menos de 5 minutos.
            </p>
            <Link to="/register-school" className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                Crear Cuenta Gratis
            </Link>
        </div>
      </main>
    </div>
  );
}

function ValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4 p-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-slate-50 p-3 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <p className="text-slate-500 text-sm mt-1">{desc}</p>
            </div>
        </div>
    )
}
