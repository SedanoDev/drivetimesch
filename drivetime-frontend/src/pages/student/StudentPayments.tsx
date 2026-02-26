import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingBag, Check, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Pack {
    id: string;
    name: string;
    classes_count: number;
    price: number;
    discount_percentage: number;
}

export function StudentPayments() {
  const { token } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
      if (token) {
          fetch(`${API_URL}/packs.php`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              if (Array.isArray(data)) setPacks(data);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }
  }, [token]);

  const handleBuy = async () => {
      if (!selectedPack) return;
      setProcessing(true);

      // Simulate Payment Process
      setTimeout(() => {
          setProcessing(false);
          alert(`¡Pago realizado con éxito! Se han añadido ${selectedPack.classes_count} clases a tu cuenta.`);
          setSelectedPack(null);
          // Here we would call an API to add credits to the user
          // e.g. POST /api/credits { userId, packId }
      }, 2000);
  };

  return (
    <div className="space-y-8 mb-24">
      <div>
          <h1 className="text-2xl font-bold text-slate-800">Tienda de Packs</h1>
          <p className="text-slate-500">Compra clases por adelantado y ahorra dinero.</p>
      </div>

      {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>)}
          </div>
      ) : packs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">No hay packs disponibles en este momento.</p>
          </div>
      ) : (
          <div className="grid md:grid-cols-3 gap-6">
              {packs.map(pack => (
                  <div key={pack.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col relative overflow-hidden">
                      {pack.discount_percentage > 0 && (
                          <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                              -{pack.discount_percentage}% Dto.
                          </div>
                      )}

                      <div className="mb-4">
                          <h3 className="text-xl font-bold text-slate-800">{pack.name}</h3>
                          <div className="flex items-baseline gap-1 mt-2">
                              <span className="text-3xl font-bold text-blue-600">{pack.price}€</span>
                              <span className="text-slate-400 text-sm">/ pack</span>
                          </div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                          <li className="flex items-center gap-3 text-slate-600 text-sm">
                              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                              </div>
                              <strong>{pack.classes_count}</strong> Clases Prácticas
                          </li>
                          <li className="flex items-center gap-3 text-slate-600 text-sm">
                              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                              </div>
                              Validez de 6 meses
                          </li>
                          <li className="flex items-center gap-3 text-slate-600 text-sm">
                              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                              </div>
                              Cancelación gratuita (24h)
                          </li>
                      </ul>

                      <button
                          onClick={() => setSelectedPack(pack)}
                          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                          <ShoppingBag size={18} /> Comprar Pack
                      </button>
                  </div>
              ))}
          </div>
      )}

      {/* Payment Modal Mock */}
      {selectedPack && (
          <Modal isOpen={!!selectedPack} onClose={() => !processing && setSelectedPack(null)} title="Confirmar Compra">
              <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-slate-600">Producto</span>
                          <span className="font-bold text-slate-800">{selectedPack.name}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-slate-600">Clases</span>
                          <span className="font-bold text-slate-800">{selectedPack.classes_count}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="font-bold text-lg text-slate-800">Total a Pagar</span>
                          <span className="font-bold text-2xl text-blue-600">{selectedPack.price}€</span>
                      </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                      <AlertCircle className="text-yellow-600 shrink-0" size={20} />
                      <p className="text-xs text-yellow-700">
                          Estás en modo demostración. No se realizará ningún cargo real en tu tarjeta.
                      </p>
                  </div>

                  <button
                      onClick={handleBuy}
                      disabled={processing}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {processing ? 'Procesando...' : <><CreditCard size={20} /> Pagar Ahora</>}
                  </button>
              </div>
          </Modal>
      )}
    </div>
  );
}
