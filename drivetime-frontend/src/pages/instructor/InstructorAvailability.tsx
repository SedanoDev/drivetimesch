import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Save, Info } from 'lucide-react';
import { Calendar } from '../../components/booking/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function InstructorAvailability() {
  const { user, token } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Form State
  const [dayConfig, setDayConfig] = useState({
      start: '09:00',
      end: '18:00',
      active: true,
      isOverride: false
  });

  // Fetch Monthly Availability (Green Dots)
  const fetchMonthAvailability = () => {
      if (user?.id && token) {
          fetch(`${API_URL}/availability.php?mode=month&instructorId=${user.id}&month=${selectedDate.getMonth()+1}&year=${selectedDate.getFullYear()}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              if (Array.isArray(data)) setAvailableDates(data);
          })
          .catch(console.error);
      }
  };

  useEffect(() => {
      fetchMonthAvailability();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate.getMonth(), user, token]);

  // Fetch Details for Selected Date
  useEffect(() => {
      if (token && selectedDate) {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          setLoading(true);
          fetch(`${API_URL}/availability.php?mode=details&date=${dateStr}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              if (data.effective) {
                  setDayConfig({
                      start: data.effective.start_time.substring(0,5),
                      end: data.effective.end_time.substring(0,5),
                      active: !!data.effective.is_active,
                      isOverride: data.is_override
                  });
              } else {
                  // No schedule found (default off)
                  setDayConfig({
                      start: '09:00',
                      end: '18:00',
                      active: false,
                      isOverride: false
                  });
              }
          })
          .finally(() => setLoading(false));
      }
  }, [selectedDate, token]);

  const handleSaveDate = async () => {
      setSaving(true);
      try {
          const res = await fetch(`${API_URL}/availability.php?mode=date`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  date: format(selectedDate, 'yyyy-MM-dd'),
                  start: dayConfig.start,
                  end: dayConfig.end,
                  active: dayConfig.active
              })
          });

          if (res.ok) {
              fetchMonthAvailability(); // Refresh dots
              setDayConfig(prev => ({ ...prev, isOverride: true })); // It is now an override
              alert("Guardado para este día.");
          } else {
              alert("Error al guardar.");
          }
      } catch (err) {
          alert("Error de conexión.");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Disponibilidad</h1>
            <p className="text-slate-500 text-sm">Selecciona un día en el calendario para editar su horario específico.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 flex-1 min-h-0">
            {/* Left: Calendar */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
                <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    availableDates={availableDates}
                    onMonthChange={(d) => setSelectedDate(d)} // Trigger refetch on nav
                    className="border-0 shadow-none w-full"
                />
                <div className="mt-6 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-slate-300 rounded-full"></div>
                        <span className="text-slate-400">No disponible</span>
                    </div>
                </div>
            </div>

            {/* Right: Editor */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 capitalize">
                            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {dayConfig.isOverride ? (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                                    Horario Personalizado
                                </span>
                            ) : (
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                    Usa Plantilla Semanal
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                        <Clock size={24} />
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-400">Cargando horario...</div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="font-medium text-slate-700">Estado del día</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={dayConfig.active}
                                    onChange={e => setDayConfig({...dayConfig, active: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-slate-900">
                                    {dayConfig.active ? 'Abierto' : 'Cerrado'}
                                </span>
                            </label>
                        </div>

                        <div className={`grid grid-cols-2 gap-6 transition-opacity ${!dayConfig.active ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Apertura</label>
                                <input
                                    type="time"
                                    value={dayConfig.start}
                                    onChange={e => setDayConfig({...dayConfig, start: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cierre</label>
                                <input
                                    type="time"
                                    value={dayConfig.end}
                                    onChange={e => setDayConfig({...dayConfig, end: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <button
                                onClick={handleSaveDate}
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Guardando...' : <><Save size={20} /> Guardar Horario para este Día</>}
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                                <Info size={12} />
                                Esto creará una excepción para esta fecha específica.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
