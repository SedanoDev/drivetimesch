import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Package, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface Pack {
    id: string;
    name: string;
    classes_count: number;
    price: number;
    discount_percentage: number;
}

export function PacksManager() {
  const { token } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPack, setNewPack] = useState({ name: '', classes_count: 5, price: 0, discount_percentage: 0 });
  const [error, setError] = useState('');

  const fetchPacks = () => {
      fetch(`${API_URL}/packs.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setPacks(data);
          else setError('Error cargando datos');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchPacks();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/packs.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(newPack)
          });

          if (res.ok) {
              setShowForm(false);
              setNewPack({ name: '', classes_count: 5, price: 0, discount_percentage: 0 });
              fetchPacks();
          } else {
              const data = await res.json();
              alert(data.error || 'Error al crear');
          }
      } catch (err) {
          alert('Error de conexión');
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('¿Eliminar bono?')) return;
      await fetch(`${API_URL}/packs.php?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchPacks();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando bonos...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Bonos de Clases</h1>
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus size={18} /> Crear Bono
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle size={20} /> {error}
            </div>
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Bono">
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Pack</label>
                    <input
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPack.name}
                        onChange={e => setNewPack({...newPack, name: e.target.value})}
                        placeholder="Ej: Pack 10 Clases"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº Clases</label>
                        <input
                            type="number"
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPack.classes_count}
                            onChange={e => setNewPack({...newPack, classes_count: parseInt(e.target.value)})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio (€)</label>
                        <input
                            type="number"
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPack.price}
                            onChange={e => setNewPack({...newPack, price: parseFloat(e.target.value)})}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descuento Visual (%)</label>
                    <input
                        type="number"
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPack.discount_percentage}
                        onChange={e => setNewPack({...newPack, discount_percentage: parseFloat(e.target.value)})}
                        placeholder="Ej: 10"
                    />
                    <p className="text-xs text-slate-400 mt-1">Opcional. Solo para mostrar la etiqueta de oferta.</p>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors">Crear Bono</button>
                </div>
            </form>
        </Modal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-md transition-all">
                    <button onClick={() => handleDelete(p.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white/80 rounded-full">
                        <Trash2 size={18} />
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transform -rotate-6">
                            <Package size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 leading-tight">{p.name}</h3>
                            <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                <Tag size={14} />
                                <span>{p.classes_count} clases</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                        <div>
                            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{p.price}€</div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Precio Final</div>
                        </div>
                        {p.discount_percentage > 0 && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-green-200">
                                -{p.discount_percentage}% Dto.
                            </span>
                        )}
                    </div>
                </div>
            ))}
            {packs.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No hay bonos creados.</p>
                </div>
            )}
        </div>
    </div>
  );
}
