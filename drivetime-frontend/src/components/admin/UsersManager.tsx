import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Trash2, UserPlus, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'instructor' | 'student';
  created_at: string;
}

export function UsersManager() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New User Form
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
      full_name: '',
      email: '',
      role: 'student' as 'admin' | 'instructor' | 'student'
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API_URL}/users.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setError('Error cargando usuarios');
    })
    .catch(() => setError('Error de conexión'))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/users.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(newUser)
          });

          if (res.ok) {
              setShowForm(false);
              setNewUser({ full_name: '', email: '', role: 'student' });
              fetchUsers();
              alert('Usuario creado con contraseña por defecto: 123456');
          } else {
              const data = await res.json();
              alert(data.error || 'Error al crear');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;

      try {
          const res = await fetch(`${API_URL}/users.php?id=${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
              setUsers(users.filter(u => u.id !== id));
          } else {
              alert('Error al eliminar');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
                <UserPlus size={18} />
                Nuevo Usuario
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {showForm && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-slate-800 mb-4">Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Completo</label>
                        <input
                            required
                            className="w-full p-2 rounded-lg border border-slate-300"
                            value={newUser.full_name}
                            onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full p-2 rounded-lg border border-slate-300"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Rol</label>
                        <select
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                        >
                            <option value="student">Alumno</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">
                            Guardar
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-300">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 font-bold text-slate-600 text-sm">Nombre</th>
                        <th className="p-4 font-bold text-slate-600 text-sm">Email</th>
                        <th className="p-4 font-bold text-slate-600 text-sm">Rol</th>
                        <th className="p-4 font-bold text-slate-600 text-sm text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-medium text-slate-800">{user.full_name}</td>
                            <td className="p-4 text-slate-500">{user.email}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                      user.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Eliminar usuario"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                No hay usuarios registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
