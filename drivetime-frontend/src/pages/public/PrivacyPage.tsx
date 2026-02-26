import { Lock } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
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
    </div>
  );
}
