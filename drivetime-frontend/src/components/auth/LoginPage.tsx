import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function LoginPage() {
  const { slug } = useParams(); // Get tenant slug from URL
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantName, setTenantName] = useState(slug ? 'Cargando...' : 'DriveTime');

  useEffect(() => {
      if (slug) {
          // Fetch tenant info
          fetch(`${API_URL}/public/tenants.php?slug=${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.name) setTenantName(data.name);
                else setTenantName('Autoescuela no encontrada');
            })
            .catch(() => setTenantName('Error cargando datos'));
      }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug }), // Send slug to backend to validate tenant context
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{tenantName}</h1>
            {slug && <p className="text-sm text-slate-400 mt-1">Acceso Alumnos e Instructores</p>}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-xs text-center mt-6 text-slate-400">
          Usa <strong>alumno@demo.com</strong> / <strong>123456</strong> para probar.
        </p>

        {!slug && (
            <div className="mt-6 text-center pt-6 border-t border-slate-100">
                <Link to="/find-school" className="text-sm text-blue-600 font-bold hover:underline">
                    ¿No encuentras tu autoescuela? Búscala aquí.
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
