import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Check, ChevronRight, Star, Shield, Smartphone, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <section className="pt-16 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">

          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-blue-100 to-cyan-50 rounded-full blur-3xl -z-10 opacity-60"></div>

          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-8 animate-fade-in-up border border-blue-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Nueva versión 2.0 disponible
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-5xl mx-auto leading-tight">
            Gestiona tu Autoescuela <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">sin complicaciones</span>.
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            La plataforma todo en uno para digitalizar tus reservas, gestionar instructores y ofrecer la mejor experiencia a tus alumnos. Olvídate del papel y las hojas de cálculo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              to="/register-school"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1"
            >
              Empezar Prueba Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login/demo"
              className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 hover:border-slate-300"
            >
              Ver Demo
            </Link>
          </div>

          {/* Dashboard Preview / Abstract Representation */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 z-10 rounded-2xl pointer-events-none"></div>
             <div className="bg-slate-50 rounded-xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
                 {/* Abstract UI representation */}
                 <div className="absolute top-4 left-4 right-4 h-12 bg-white rounded-lg shadow-sm flex items-center px-4 gap-4">
                    <div className="w-32 h-4 bg-slate-100 rounded"></div>
                    <div className="flex-1"></div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                 </div>
                 <div className="absolute top-20 left-4 w-64 bottom-4 bg-white rounded-lg shadow-sm p-4 space-y-4">
                    <div className="w-full h-8 bg-slate-100 rounded mb-4"></div>
                    <div className="w-full h-4 bg-slate-50 rounded"></div>
                    <div className="w-full h-4 bg-slate-50 rounded"></div>
                    <div className="w-3/4 h-4 bg-slate-50 rounded"></div>
                 </div>
                 <div className="absolute top-20 left-72 right-4 bottom-4 bg-white rounded-lg shadow-sm p-6 grid grid-cols-3 gap-4">
                    <div className="col-span-3 h-32 bg-blue-50/50 rounded border border-blue-100 flex items-center justify-center text-blue-200 font-bold text-4xl">Chart Area</div>
                    <div className="h-24 bg-slate-50 rounded"></div>
                    <div className="h-24 bg-slate-50 rounded"></div>
                    <div className="h-24 bg-slate-50 rounded"></div>
                 </div>
                 <div className="text-slate-300 font-bold text-2xl z-0">Dashboard Preview</div>
             </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
           <div>
              <p className="text-slate-500 font-medium mb-1">Confían en nosotros</p>
              <div className="flex gap-1 text-yellow-400 justify-center md:justify-start">
                 <Star fill="currentColor" size={20} />
                 <Star fill="currentColor" size={20} />
                 <Star fill="currentColor" size={20} />
                 <Star fill="currentColor" size={20} />
                 <Star fill="currentColor" size={20} />
              </div>
           </div>
           <div className="flex gap-12 opacity-50 grayscale mix-blend-multiply">
              <span className="text-2xl font-bold text-slate-800">AutoExpress</span>
              <span className="text-2xl font-bold text-slate-800">VialMaster</span>
              <span className="text-2xl font-bold text-slate-800">DriveGo</span>
              <span className="text-2xl font-bold text-slate-800 hidden md:block">CityCar</span>
           </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Todo lo que necesitas</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Deja atrás el papel y las hojas de cálculo. DriveTime centraliza tu negocio en una sola plataforma.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Smartphone className="w-8 h-8 text-blue-600" />}
              title="App para Alumnos"
              desc="Tus alumnos reservan clases desde su móvil en segundos. Menos llamadas, más clases. Disponible 24/7."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-purple-600" />}
              title="Gestión de Instructores"
              desc="Controla horarios, asignaciones y rendimiento de tus profesores en tiempo real. Optimiza tu flota."
            />
            <FeatureCard
              icon={<Star className="w-8 h-8 text-orange-500" />}
              title="Pagos y Facturación"
              desc="Automatiza el cobro de clases y mantén tus cuentas claras sin esfuerzo. Generación de facturas automática."
            />
             <FeatureCard
              icon={<Car className="w-8 h-8 text-green-600" />}
              title="Control de Vehículos"
              desc="Gestiona mantenimientos, ITV y asignación de vehículos a instructores de forma sencilla."
            />
             <FeatureCard
              icon={<Check className="w-8 h-8 text-cyan-600" />}
              title="Recordatorios Automáticos"
              desc="Reduce el ausentismo con recordatorios por email y notificaciones push para las clases."
            />
             <FeatureCard
              icon={<HelpCircle className="w-8 h-8 text-red-500" />}
              title="Soporte Dedicado"
              desc="Un equipo de expertos listo para ayudarte a configurar y sacar el máximo partido a la plataforma."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Lo que dicen nuestros clientes</h2>
               <p className="text-xl text-slate-500 max-w-2xl mx-auto">Autoescuelas de toda España ya están ahorrando tiempo y dinero.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <TestimonialCard
                  quote="Desde que usamos DriveTime, hemos reducido las llamadas administrativas un 80%. Los alumnos están encantados."
                  author="María González"
                  role="Directora, Autoescuela Norte"
                  rating={5}
               />
               <TestimonialCard
                  quote="La gestión de horarios de los profesores era un caos. Ahora todo es automático y transparente. Imprescindible."
                  author="Carlos Ruiz"
                  role="Gerente, Vial Express"
                  rating={5}
               />
               <TestimonialCard
                  quote="El soporte técnico es excelente y la plataforma no para de mejorar. Se nota que escuchan a las autoescuelas."
                  author="Laura M."
                  role="Administradora, Autoescuela Centro"
                  rating={4}
               />
            </div>
         </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Planes flexibles</h2>
            <p className="text-xl text-slate-500">Elige el plan que mejor se adapte al tamaño de tu autoescuela. Sin permanencia.</p>
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

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Preguntas Frecuentes</h2>
            </div>
            <div className="space-y-4">
               <FAQItem
                  question="¿Necesito instalar algún software?"
                  answer="No, DriveTime es 100% en la nube. Puedes acceder desde cualquier ordenador, tablet o móvil con conexión a internet."
               />
               <FAQItem
                  question="¿Puedo importar los datos de mis alumnos actuales?"
                  answer="Sí, ofrecemos herramientas de importación fácil para traer tus datos desde Excel u otros sistemas. Nuestro equipo te ayuda en el proceso."
               />
               <FAQItem
                  question="¿Hay compromiso de permanencia?"
                  answer="No, puedes cancelar tu suscripción en cualquier momento. Creemos que te quedarás por el valor que aportamos, no por un contrato."
               />
               <FAQItem
                  question="¿Cómo funciona el soporte técnico?"
                  answer="Ofrecemos soporte por email para todos los planes y soporte prioritario por chat/teléfono para los planes Pro y Enterprise."
               />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
         <div className="max-w-7xl mx-auto bg-blue-600 rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
             {/* Decorational circles */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

             <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 relative z-10">¿Listo para modernizar tu autoescuela?</h2>
             <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12 relative z-10">
                Únete a las autoescuelas que ya están transformando su gestión. Prueba gratis 14 días, sin tarjeta de crédito.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
               <Link
                 to="/register-school"
                 className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
               >
                 Comenzar Ahora
               </Link>
               <Link
                 to="/contact"
                 className="bg-blue-700 text-white border border-blue-500 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition-all"
               >
                 Contactar Ventas
               </Link>
             </div>
         </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
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
    <div className={`p-8 rounded-3xl border ${isPopular ? 'border-blue-600 bg-blue-50 relative shadow-xl scale-105 z-10' : 'border-slate-200 bg-white hover:border-blue-200 transition-colors'}`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
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
      <button className={`w-full py-3 rounded-xl font-bold transition-colors ${isPopular ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
        Seleccionar
      </button>
    </div>
  );
}

function TestimonialCard({ quote, author, role, rating }: { quote: string, author: string, role: string, rating: number }) {
   return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
         <div className="flex gap-1 text-yellow-400 mb-6">
            {[...Array(5)].map((_, i) => (
               <Star key={i} size={16} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-slate-300"} />
            ))}
         </div>
         <p className="text-slate-600 italic mb-6 flex-1">"{quote}"</p>
         <div className="flex items-center gap-4 mt-auto">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
               {author.charAt(0)}
            </div>
            <div>
               <p className="font-bold text-slate-900 text-sm">{author}</p>
               <p className="text-slate-500 text-xs">{role}</p>
            </div>
         </div>
      </div>
   );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
         >
            <span className="font-bold text-slate-800">{question}</span>
            {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
         </button>
         {isOpen && (
            <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
               {answer}
            </div>
         )}
      </div>
   );
}
