import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface DaySchedule {
    day: number;
    name: string;
    start: string;
    end: string;
    active: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
    { day: 1, name: 'Lunes', start: '09:00', end: '18:00', active: true },
    { day: 2, name: 'Martes', start: '09:00', end: '18:00', active: true },
    { day: 3, name: 'Miércoles', start: '09:00', end: '18:00', active: true },
    { day: 4, name: 'Jueves', start: '09:00', end: '18:00', active: true },
    { day: 5, name: 'Viernes', start: '09:00', end: '14:00', active: true },
];

export function InstructorAvailability() {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/availability.php?mode=config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const newSchedule = DEFAULT_SCHEDULE.map(day => {
                    const found = data.find((d: any) => d.day === day.day);
                    return found ? { ...day, start: found.start, end: found.end, active: !!found.active } : day;
                });
                setSchedule(newSchedule);
            }
        })
        .catch(err => console.error("Error fetching availability:", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async () => {
      setSaving(true);
      setMessage('');

      try {
          const res = await fetch(`${API_URL}/availability.php`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(schedule.map(s => ({
                  day: s.day,
                  start: s.start,
                  end: s.end,
                  active: s.active
              })))
          });

          if (res.ok) {
              setMessage('Horario guardado correctamente.');
              setTimeout(() => setMessage(''), 3000);
          } else {
              setMessage('Error al guardar.');
          }
      } catch (err) {
          setMessage('Error de conexión.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando disponibilidad...</div>;

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Mi Horario Semanal</h1>
                <p className="text-slate-500 text-sm mt-1">Define tu jornada laboral habitual.</p>
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
            >
                {saving ? 'Guardando...' : <><Check size={18} /> Guardar Cambios</>}
            </button>
        </div>

        {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-4xl mx-auto">
            <div className="space-y-6">
                {schedule.map((day, idx) => (
                    <div key={day.day} className={`group flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-xl border transition-all ${day.active ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                        <div className="flex items-center gap-4 min-w-[150px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${day.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                {day.name.substring(0, 1)}
                            </div>
                            <span className={`font-bold ${day.active ? 'text-slate-800' : 'text-slate-400'}`}>{day.name}</span>
                        </div>

                        <div className="flex-1 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Clock size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="time"
                                    value={day.start}
                                    disabled={!day.active}
                                    onChange={(e) => {
                                        const newSched = [...schedule];
                                        newSched[idx].start = e.target.value;
                                        setSchedule(newSched);
                                    }}
                                    className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                            </div>
                            <span className="text-slate-400 font-bold">-</span>
                            <div className="relative flex-1">
                                <Clock size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="time"
                                    value={day.end}
                                    disabled={!day.active}
                                    onChange={(e) => {
                                        const newSched = [...schedule];
                                        newSched[idx].end = e.target.value;
                                        setSchedule(newSched);
                                    }}
                                    className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer relative">
                            <input
                                type="checkbox"
                                checked={day.active}
                                onChange={() => {
                                    const newSched = [...schedule];
                                    newSched[idx].active = !newSched[idx].active;
                                    setSchedule(newSched);
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-2 text-sm font-medium text-slate-600 hidden sm:block">
                                {day.active ? 'Disponible' : 'Descanso'}
                            </span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
