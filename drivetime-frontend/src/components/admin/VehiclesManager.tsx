import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Car, Plus, Trash2, AlertCircle, Edit2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    plate: string;
    status: string;
    instructor_name?: string;
}

export function VehiclesManager() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', plate: '', status: 'active' });
  const [error, setError] = useState('');

  const fetchVehicles = () => {
      fetch(`${API_URL}/vehicles.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setVehicles(data);
          else setError('Error cargando datos');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchVehicles();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const method = editingId ? 'PUT' : 'POST';
          const body: any = { ...vehicleForm };
          if (editingId) body.id = editingId;

          const res = await fetch(`${API_URL}/vehicles.php`, {
              method,
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(body)
          });

          if (res.ok) {
              setShowForm(false);
              setEditingId(null);
              setVehicleForm({ make: '', model: '', plate: '', status: 'active' });
              fetchVehicles();
          } else {
              const data = await res.json();
              alert(data.error || 'Error al guardar');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  const handleEdit = (v: Vehicle) => {
      setVehicleForm({ make: v.make, model: v.model, plate: v.plate, status: v.status });
      setEditingId(v.id);
      setShowForm(true);
  };

  const handleDelete = async (id: string) => {
      if (!confirm('¿Eliminar vehículo?')) return;
      await fetch(`${API_URL}/vehicles.php?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVehicles();
  };

  const openCreate = () => {
      setEditingId(null);
      setVehicleForm({ make: '', model: '', plate: '', status: 'active' });
      setShowForm(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando vehículos...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Flota</h1>
            <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus size={18} /> Añadir Vehículo
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle size={20} /> {error}
            </div>
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? "Editar Vehículo" : "Nuevo Vehículo"}>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                        <input
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={vehicleForm.make}
                            onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})}
                            placeholder="Ej: Toyota"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                        <input
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={vehicleForm.model}
                            onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})}
                            placeholder="Ej: Yaris"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                    <input
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                        value={vehicleForm.plate}
                        onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})}
                        placeholder="1234 ABC"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                    <select
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={vehicleForm.status}
                        onChange={e => setVehicleForm({...vehicleForm, status: e.target.value})}
                    >
                        <option value="active">Activo</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors">Guardar</button>
                </div>
            </form>
        </Modal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-md transition-all">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-1 rounded-full">
                        <button onClick={() => handleEdit(v)} className="text-slate-400 hover:text-blue-500 p-1">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="text-slate-400 hover:text-red-500 p-1">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${v.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Car size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{v.make} {v.model}</h3>
                            <p className="text-sm text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded inline-block mt-1 border border-slate-200">{v.plate}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-50">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${v.status === 'active' ? 'bg-green-100 text-green-700' : v.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                            {v.status === 'active' ? 'Activo' : v.status === 'maintenance' ? 'Taller' : 'Inactivo'}
                        </span>
                        {v.instructor_name ? (
                            <span className="text-slate-600 truncate max-w-[120px]" title={v.instructor_name}>👤 {v.instructor_name}</span>
                        ) : (
                            <span className="text-slate-400 italic text-xs">Sin asignar</span>
                        )}
                    </div>
                </div>
            ))}
            {vehicles.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No hay vehículos registrados.</p>
                </div>
            )}
        </div>
    </div>
  );
}
