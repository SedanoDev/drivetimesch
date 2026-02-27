import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';
import { Trash2, UserPlus, AlertCircle, Shield, User as UserIcon, GraduationCap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const [showCreate, setShowCreate] = useState(false);
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
              setShowCreate(false);
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

  const getRoleIcon = (role: string) => {
      switch(role) {
          case 'admin': return <Shield size={16} />;
          case 'instructor': return <UserIcon size={16} />;
          case 'student': return <GraduationCap size={16} />;
          default: return <UserIcon size={16} />;
      }
  };

  const getRoleLabel = (role: string) => {
      switch(role) {
          case 'admin': return 'Administrador';
          case 'instructor': return 'Instructor';
          case 'student': return 'Alumno';
          default: return role;
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Gestión de Usuarios</h2>
            <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-sm"
            >
                <UserPlus size={18} />
                Nuevo Usuario
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 mb-4">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Crear Nuevo Usuario">
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input
                        required
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newUser.full_name}
                        onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        required
                        type="email"
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newUser.email}
                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                        placeholder="juan@ejemplo.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                    <select
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                    >
                        <option value="student">Alumno</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 font-medium">
                    ℹ️ Se creará un usuario con la contraseña por defecto: <strong>123456</strong>.
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 font-medium transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-colors">
                        Crear Usuario
                    </button>
                </div>
            </form>
        </Modal>

        <div className="grid grid-cols-1 gap-3">
            {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              user.role === 'instructor' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {user.full_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{user.full_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>{user.email}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full
                                    ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                      user.role === 'instructor' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                    {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDelete(user.id)}
                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar usuario"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            {users.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No hay usuarios registrados.
                </div>
            )}
        </div>
    </div>
  );
}
