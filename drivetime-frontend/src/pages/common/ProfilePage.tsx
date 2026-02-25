import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Lock, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({
      full_name: '',
      email: '',
      role: '',
      password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/profile.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.email) {
                setProfile({ ...data, password: '' });
            }
        })
        .catch(err => console.error("Error fetching profile", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setMessage('');

      try {
          const res = await fetch(`${API_URL}/profile.php`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  full_name: profile.full_name,
                  password: profile.password || undefined // Only send if changed
              })
          });

          if (res.ok) {
              setMessage('Perfil actualizado correctamente.');
              setProfile(p => ({ ...p, password: '' }));
          } else {
              setMessage('Error al actualizar.');
          }
      } catch (err) {
          setMessage('Error de conexión.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Mi Perfil</h1>

        {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
            </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl font-bold uppercase">
                    {profile.full_name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{profile.full_name}</h2>
                    <p className="text-slate-500 capitalize">{profile.role}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input
                        disabled
                        value={profile.email}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">El email no se puede cambiar.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
                        <input
                            required
                            value={profile.full_name}
                            onChange={e => setProfile({...profile, full_name: e.target.value})}
                            className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña (Opcional)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                        <input
                            type="password"
                            placeholder="Dejar en blanco para no cambiar"
                            value={profile.password}
                            onChange={e => setProfile({...profile, password: e.target.value})}
                            className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            minLength={6}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}
