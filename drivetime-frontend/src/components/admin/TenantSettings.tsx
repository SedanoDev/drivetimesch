import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Settings, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function TenantSettings() {
  const { token } = useAuth();
  const [tenant, setTenant] = useState({ name: '', slug: '', created_at: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/tenant_settings.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.name) setTenant(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setMessage('');

      try {
          const res = await fetch(`${API_URL}/tenant_settings.php`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ name: tenant.name })
          });

          if (res.ok) {
              setMessage('Configuración guardada.');
          } else {
              setMessage('Error al guardar.');
          }
      } catch (err) {
          setMessage('Error de conexión.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

  return (
    <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Configuración de la Escuela</h1>

        {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
            </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Autoescuela</label>
                    <div className="relative">
                        <Settings className="absolute left-3 top-3.5 text-slate-400" size={20} />
                        <input
                            required
                            value={tenant.name}
                            onChange={e => setTenant({...tenant, name: e.target.value})}
                            className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">URL Personalizada (Slug)</label>
                    <div className="flex items-center">
                        <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 p-3 rounded-l-xl text-sm font-mono">drivetime.com/login/</span>
                        <input
                            disabled
                            value={tenant.slug}
                            className="w-full p-3 rounded-r-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">La URL no se puede cambiar para evitar enlaces rotos.</p>
                </div>

                <div className="pt-4 border-t border-slate-50 mt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}
