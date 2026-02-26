import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Check, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../../components/booking/calendar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

  // Preview State
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

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

  // Fetch Preview Dots
  useEffect(() => {
      if (user?.id && token) {
          fetch(`${API_URL}/availability.php?mode=month&instructorId=${user.id}&month=${viewDate.getMonth()+1}&year=${viewDate.getFullYear()}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              if (Array.isArray(data)) setAvailableDates(data);
          })
          .catch(console.error);
      }
  }, [viewDate, user, token, schedule]); // Refetch when schedule changes locally (saved)

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
              // Trigger preview update
              setViewDate(new Date(viewDate));
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
    <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Mi Horario Semanal</h1>
                <p className="text-slate-500 text-sm mt-1">Configura tu plantilla semanal. Los cambios afectarán a futuras fechas.</p>
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

        <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Clock className="text-blue-500" /> Plantilla Semanal
                </h3>
                <div className="space-y-6">
                    {schedule.map((day, idx) => (
                        <div key={day.day} className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all ${day.active ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                            <div className="flex items-center gap-4 min-w-[120px]">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${day.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {day.name.substring(0, 1)}
                                </div>
                                <span className={`font-bold text-sm ${day.active ? 'text-slate-800' : 'text-slate-400'}`}>{day.name}</span>
                            </div>

                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="time"
                                    value={day.start}
                                    disabled={!day.active}
                                    onChange={(e) => {
                                        const newSched = [...schedule];
                                        newSched[idx].start = e.target.value;
                                        setSchedule(newSched);
                                    }}
                                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="time"
                                    value={day.end}
                                    disabled={!day.active}
                                    onChange={(e) => {
                                        const newSched = [...schedule];
                                        newSched[idx].end = e.target.value;
                                        setSchedule(newSched);
                                    }}
                                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
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
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CalendarIcon className="text-green-500" /> Vista Previa (Alumno)
                </h3>
                <div className="flex justify-center">
                    <Calendar
                        selectedDate={previewDate}
                        onSelectDate={setPreviewDate}
                        availableDates={availableDates}
                        onMonthChange={setViewDate}
                        className="border-0 shadow-none"
                    />
                </div>
                <div className="text-center text-sm text-slate-400 mt-4">
                    <p>Los días con punto verde son visibles para los alumnos.</p>
                </div>
            </div>
        </div>
    </div>
  );
}
