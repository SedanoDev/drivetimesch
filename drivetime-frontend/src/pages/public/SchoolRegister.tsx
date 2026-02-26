import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function SchoolRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: '',
    slug: '',
    adminName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await fetch(`${API_URL}/public/register_tenant.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (res.ok) {
            setStep(2); // Success view
        } else {
            setError(data.error || 'Error al registrar');
        }
    } catch (err) {
        setError('Error de conexión');
    } finally {
        setLoading(false);
    }
  };

  if (step === 2) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Registro Completado!</h2>
                  <p className="text-slate-500 mb-8">Tu autoescuela <strong>{formData.schoolName}</strong> ya está lista.</p>

                  <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-200">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-2">Tu enlace de acceso:</p>
                      <p className="font-mono text-blue-600 break-all">drivetime.com/login/{formData.slug}</p>
                  </div>

                  <Link to={`/login/${formData.slug}`} className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                      Ir al Login
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left: Info */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-blue-600 text-white p-12">
        <div>
            <div className="flex items-center gap-2 font-bold text-2xl mb-12">
                <Car className="w-8 h-8" /> DriveTime
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Empieza a digitalizar tu autoescuela hoy.</h1>
            <p className="text-blue-100 text-lg max-w-md">Únete a más de 500 autoescuelas que ya gestionan sus reservas de forma inteligente.</p>
        </div>
        <div className="text-sm text-blue-200">
            &copy; 2026 DriveTime SaaS.
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Crear cuenta</h2>
            <p className="text-slate-500 mb-8">Prueba gratis por 14 días. Sin tarjeta de crédito.</p>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Autoescuela</label>
                    <input
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej: Autoescuela Veloz"
                        value={formData.schoolName}
                        onChange={e => setFormData({...formData, schoolName: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">URL Personalizada (Slug)</label>
                    <div className="flex items-center">
                        <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 p-3 rounded-l-xl text-sm">drivetime.com/</span>
                        <input
                            required
                            className="w-full p-3 rounded-r-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.slug}
                            onChange={e => setFormData({...formData, slug: e.target.value})}
                        />
                    </div>
                </div>
                <div className="h-px bg-slate-100 my-6"></div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Administrador</label>
                    <input
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.adminName}
                        onChange={e => setFormData({...formData, adminName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                    <input
                        required
                        type="email"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                    <input
                        required
                        type="password"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4"
                >
                    {loading ? 'Creando cuenta...' : 'Registrar Autoescuela'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
