import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

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

  useEffect(() => {
    fetch(`${API_URL}/instructors.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setInstructors(data))
    .catch(console.error);
  }, [token]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Profesores</h2>
        <button className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
            + Nuevo Profesor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                   {instructor.name.charAt(0)}
               </div>
               <div>
                   <h3 className="font-bold text-slate-800 text-sm">{instructor.name}</h3>
                   <span className="text-xs text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                       {instructor.vehicle_type}
                   </span>
                   {instructor.is_active ? (
                       <span className="text-xs text-green-600 font-medium">Activo</span>
                   ) : (
                       <span className="text-xs text-red-500 font-medium">Inactivo</span>
                   )}
               </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-blue-600 text-xs font-medium px-2 py-1">
                    Editar
                </button>
                <button className="text-slate-400 hover:text-red-600 text-xs font-medium px-2 py-1">
                    {instructor.is_active ? 'Desactivar' : 'Activar'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
