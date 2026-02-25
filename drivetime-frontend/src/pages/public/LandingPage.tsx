import { Link } from 'react-router-dom';
import { Car, Check, ChevronRight, Star, Shield, Smartphone } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">DriveTime SaaS</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <Link to="/features" className="hover:text-blue-600 transition-colors">Características</Link>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Precios</a>
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

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Nueva versión 2.0 disponible
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
            Gestiona tu Autoescuela <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">sin complicaciones</span>.
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            La plataforma todo en uno para digitalizar tus reservas, gestionar instructores y ofrecer la mejor experiencia a tus alumnos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register-school"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
            >
              Empezar Prueba Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login/demo"
              className="flex items-center justify-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Deja atrás el papel y las hojas de cálculo. DriveTime centraliza tu negocio.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Smartphone className="w-8 h-8 text-blue-600" />}
              title="App para Alumnos"
              desc="Tus alumnos reservan clases desde su móvil en segundos. Menos llamadas, más clases."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-purple-600" />}
              title="Gestión de Instructores"
              desc="Controla horarios, asignaciones y rendimiento de tus profesores en tiempo real."
            />
            <FeatureCard
              icon={<Star className="w-8 h-8 text-orange-500" />}
              title="Pagos y Facturación"
              desc="Automatiza el cobro de clases y mantén tus cuentas claras sin esfuerzo."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Planes flexibles</h2>
            <p className="text-slate-500">Elige el plan que mejor se adapte al tamaño de tu autoescuela.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Básico"
              price="29€"
              features={['Hasta 50 alumnos', '1 Profesor', 'Reservas ilimitadas', 'Soporte por email']}
            />
            <PricingCard
              title="Pro"
              price="79€"
              isPopular
              features={['Hasta 200 alumnos', '5 Profesores', 'Panel avanzado', 'Soporte prioritario', 'Personalización de marca']}
            />
            <PricingCard
              title="Enterprise"
              price="Consultar"
              features={['Alumnos ilimitados', 'Profesores ilimitados', 'API Access', 'Gestor dedicado', 'Marca blanca total']}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
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
              <li><a href="#pricing" className="hover:text-white">Precios</a></li>
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
          &copy; {new Date().getFullYear()} DriveTime SaaS. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingCard({ title, price, features, isPopular }: { title: string, price: string, features: string[], isPopular?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border ${isPopular ? 'border-blue-600 bg-blue-50 relative' : 'border-slate-200 bg-white'}`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          Más popular
        </span>
      )}
      <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-extrabold text-slate-900">{price}</span>
        {price !== 'Consultar' && <span className="text-slate-500">/mes</span>}
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-xl font-bold transition-colors ${isPopular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
        Seleccionar
      </button>
    </div>
  );
}
