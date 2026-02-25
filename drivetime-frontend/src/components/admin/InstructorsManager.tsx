import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';
import { UserPlus, Edit2, ToggleRight, ToggleLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface Instructor {
  id: string;
  name: string;
  vehicle_type: 'Manual' | 'Automatic';
  is_active: boolean;
  email: string;
}

export function InstructorsManager() {
  const { token } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // Create State
  const [showCreate, setShowCreate] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ full_name: '', email: '' });

  const fetchInstructors = () => {
    setLoading(true);
    fetch(`${API_URL}/instructors.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if(Array.isArray(data)) setInstructors(data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchInstructors();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          // Reuse users API to create instructor user + profile
          const res = await fetch(`${API_URL}/users.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  ...newInstructor,
                  role: 'instructor'
              })
          });

          if (res.ok) {
              alert('Instructor creado correctamente (Password: 123456)');
              setShowCreate(false);
              setNewInstructor({ full_name: '', email: '' });
              fetchInstructors();
          } else {
              const data = await res.json();
              alert(data.error || 'Error al crear');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando profesores...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Profesores</h2>
        <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
            <UserPlus size={18} /> Nuevo Profesor
        </button>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Profesor">
          <form onSubmit={handleCreate} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input
                      required
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newInstructor.full_name}
                      onChange={e => setNewInstructor({...newInstructor, full_name: e.target.value})}
                      placeholder="Ej: Laura García"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                      required
                      type="email"
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newInstructor.email}
                      onChange={e => setNewInstructor({...newInstructor, email: e.target.value})}
                      placeholder="laura@autoescuela.com"
                  />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 mb-4">
                  Se creará un usuario con la contraseña por defecto <strong>123456</strong>.
              </div>
              <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold">Crear</button>
              </div>
          </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg border-2 border-white shadow-sm">
                   {instructor.name.charAt(0)}
               </div>
               <div>
                   <h3 className="font-bold text-slate-800">{instructor.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${instructor.vehicle_type === 'Manual' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                           {instructor.vehicle_type || 'N/A'}
                       </span>
                       {instructor.is_active ? (
                           <span className="text-xs text-green-600 font-medium flex items-center gap-1">● Activo</span>
                       ) : (
                           <span className="text-xs text-red-500 font-medium flex items-center gap-1">● Inactivo</span>
                       )}
                   </div>
               </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Edit2 size={18} />
                </button>
                <button className={`text-slate-400 p-2 rounded-lg transition-colors ${instructor.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-green-600 hover:bg-green-50'}`} title={instructor.is_active ? 'Desactivar' : 'Activar'}>
                    {instructor.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
            </div>
          </div>
        ))}
        {instructors.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No hay profesores registrados.
            </div>
        )}
      </div>
    </div>
  );
}
