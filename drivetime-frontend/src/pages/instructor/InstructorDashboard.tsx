import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function InstructorDashboard() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    // Reuse bookings endpoint but for instructor
    fetch(`${API_URL}/bookings.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setClasses(data))
    .catch(console.error);
  }, [token]);

  // Group classes by Date
  // ...

  return (
    <div>
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Mi Agenda</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? <p className="text-slate-500">No tienes clases asignadas.</p> : null}

            {classes.map(c => (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg text-slate-800">{c.start_time}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${c.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.status}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600 mb-1">
                        📅 {c.booking_date}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {c.student_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{c.student_name}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
