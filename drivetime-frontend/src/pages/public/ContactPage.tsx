import { Mail, Phone, MapPin, Send } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Estamos para ayudarte</h1>
            <p className="text-xl text-slate-500 max-w-lg mb-12 leading-relaxed">
              ¿Tienes dudas sobre cómo empezar con DriveTime? Nuestro equipo de soporte está listo para ti.
            </p>

            <div className="space-y-6">
              <ContactItem
                icon={<Mail className="w-6 h-6 text-blue-600" />}
                title="Email"
                detail="soporte@drivetime.com"
              />
              <ContactItem
                icon={<Phone className="w-6 h-6 text-green-600" />}
                title="Teléfono"
                detail="+34 91 123 45 67"
              />
              <ContactItem
                icon={<MapPin className="w-6 h-6 text-red-500" />}
                title="Oficinas"
                detail="Calle Gran Vía 22, Madrid"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

            <h2 className="text-2xl font-bold mb-6 text-slate-800 relative z-10">Envíanos un mensaje</h2>
            <form className="space-y-4 relative z-10">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="juan@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mensaje</label>
                <textarea rows={4} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="¿Cómo podemos ayudarte?"></textarea>
              </div>

              <button type="button" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:shadow-blue-200">
                <Send size={18} /> Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function ContactItem({ icon, title, detail }: { icon: React.ReactNode, title: string, detail: string }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 transition-colors">{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{detail}</p>
      </div>
    </div>
  )
}
