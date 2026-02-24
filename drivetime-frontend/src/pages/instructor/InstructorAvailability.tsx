import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

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
  const { user, token } = useAuth();
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
                // Merge fetched data with default structure (to keep day names)
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
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Mi Disponibilidad</h1>

        {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
            <p className="text-sm text-slate-500 mb-6">Configura tu horario semanal habitual. Las reservas se bloquearán fuera de estas horas.</p>

            <div className="space-y-4">
                {schedule.map((day, idx) => (
                    <div key={day.day} className="flex items-center gap-4 border-b border-slate-50 pb-4 last:border-0">
                        <div className="w-24 font-medium text-slate-700">{day.name}</div>

                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={day.start}
                                disabled={!day.active}
                                onChange={(e) => {
                                    const newSched = [...schedule];
                                    newSched[idx].start = e.target.value;
                                    setSchedule(newSched);
                                }}
                                className="border border-slate-200 p-2 rounded-lg text-sm disabled:opacity-50"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="time"
                                value={day.end}
                                disabled={!day.active}
                                onChange={(e) => {
                                    const newSched = [...schedule];
                                    newSched[idx].end = e.target.value;
                                    setSchedule(newSched);
                                }}
                                className="border border-slate-200 p-2 rounded-lg text-sm disabled:opacity-50"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer ml-auto">
                            <input
                                type="checkbox"
                                checked={day.active}
                                onChange={() => {
                                    const newSched = [...schedule];
                                    newSched[idx].active = !newSched[idx].active;
                                    setSchedule(newSched);
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className={day.active ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                {day.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </label>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar Horario'}
                </button>
            </div>
        </div>
    </div>
  );
}
