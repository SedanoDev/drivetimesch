import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Car, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', plate: '', status: 'active' });

  const fetchVehicles = () => {
      fetch(`${API_URL}/vehicles.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setVehicles(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchVehicles();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/vehicles.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(newVehicle)
          });
          if (res.ok) {
              setShowForm(false);
              setNewVehicle({ make: '', model: '', plate: '', status: 'active' });
              fetchVehicles();
          } else {
              alert('Error al crear');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('¿Eliminar vehículo?')) return;
      await fetch(`${API_URL}/vehicles.php?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVehicles();
  };

  if (loading) return <div className="p-8">Cargando vehículos...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Flota</h1>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                <Plus size={18} /> Añadir Vehículo
            </button>
        </div>

        {showForm && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <input placeholder="Marca" className="p-2 rounded border" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} required />
                    <input placeholder="Modelo" className="p-2 rounded border" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} required />
                    <input placeholder="Matrícula" className="p-2 rounded border" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} required />
                    <select className="p-2 rounded border" value={newVehicle.status} onChange={e => setNewVehicle({...newVehicle, status: e.target.value})}>
                        <option value="active">Activo</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                    <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">Guardar</button>
                </form>
            </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
                    <button onClick={() => handleDelete(v.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Car size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{v.make} {v.model}</h3>
                            <p className="text-sm text-slate-500 font-mono">{v.plate}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {v.status === 'active' ? 'Activo' : 'Mantenimiento'}
                        </span>
                        {v.instructor_name ? (
                            <span className="text-slate-600">Asignado a: <strong>{v.instructor_name}</strong></span>
                        ) : (
                            <span className="text-slate-400 italic">Sin asignar</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
