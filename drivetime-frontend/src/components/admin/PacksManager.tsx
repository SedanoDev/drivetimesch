import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Package, Plus, Trash2 } from 'lucide-react';

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

  const fetchPacks = () => {
      fetch(`${API_URL}/packs.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setPacks(data);
      })
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
              fetchPacks();
          } else {
              alert('Error al crear');
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

  if (loading) return <div className="p-8">Cargando bonos...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Bonos de Clases</h1>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                <Plus size={18} /> Crear Bono
            </button>
        </div>

        {showForm && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <input placeholder="Nombre (ej: Pack 5)" className="p-2 rounded border" value={newPack.name} onChange={e => setNewPack({...newPack, name: e.target.value})} required />
                    <input type="number" placeholder="Nº Clases" className="p-2 rounded border" value={newPack.classes_count} onChange={e => setNewPack({...newPack, classes_count: parseInt(e.target.value)})} required />
                    <input type="number" placeholder="Precio (€)" className="p-2 rounded border" value={newPack.price} onChange={e => setNewPack({...newPack, price: parseFloat(e.target.value)})} required />
                    <input type="number" placeholder="Descuento (%)" className="p-2 rounded border" value={newPack.discount_percentage} onChange={e => setNewPack({...newPack, discount_percentage: parseFloat(e.target.value)})} />
                    <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">Guardar</button>
                </form>
            </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
                    <button onClick={() => handleDelete(p.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{p.name}</h3>
                            <p className="text-sm text-slate-500">{p.classes_count} clases</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-3xl font-bold text-slate-800">{p.price}€</div>
                        {p.discount_percentage > 0 && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                -{p.discount_percentage}% Dto.
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
