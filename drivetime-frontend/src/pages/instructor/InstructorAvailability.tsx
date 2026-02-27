import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Save, Info, Settings } from 'lucide-react';
import { Calendar } from '../../components/booking/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface WeeklySlot {
    day: number;
    start: string;
    end: string;
    active: boolean;
}

export function InstructorAvailability() {
  const { user, token } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  // Weekly Template State
  const [weeklyTemplate, setWeeklyTemplate] = useState<WeeklySlot[]>([]);

  // Edit Form State (Single Day)
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
              if (data.available_days) {
                  // Construct date strings for current month
                  const year = selectedDate.getFullYear();
                  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                  const dates = data.available_days.map((d: number) => `${year}-${month}-${d.toString().padStart(2, '0')}`);
                  setAvailableDates(dates);
              } else if (Array.isArray(data)) {
                  setAvailableDates(data);
              }
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

  // Weekly Template Logic
  const openWeeklyModal = () => {
      setShowWeeklyModal(true);
      // Fetch current template
      fetch(`${API_URL}/availability.php?mode=weekly&instructorId=${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data) && data.length > 0) {
              setWeeklyTemplate(data);
          } else {
              // Initialize default if empty
              const defaults = Array.from({ length: 7 }, (_, i) => ({
                  day: i,
                  start: '09:00',
                  end: '18:00',
                  active: i >= 1 && i <= 5 // Mon-Fri default
              }));
              setWeeklyTemplate(defaults);
          }
      });
  };

  const handleSaveWeekly = async () => {
      const res = await fetch(`${API_URL}/availability.php?mode=weekly`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(weeklyTemplate)
      });

      if (res.ok) {
          setShowWeeklyModal(false);
          fetchMonthAvailability(); // Refresh calendar
          alert("Plantilla semanal actualizada.");
      } else {
          alert("Error al guardar plantilla.");
      }
  };

  const updateWeeklySlot = (day: number, field: keyof WeeklySlot, value: any) => {
      setWeeklyTemplate(prev => prev.map(slot =>
          slot.day === day ? { ...slot, [field]: value } : slot
      ));
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Gestión de Disponibilidad</h1>
                <p className="text-slate-500 text-sm">Selecciona un día en el calendario para editar su horario específico.</p>
            </div>
            <button
                onClick={openWeeklyModal}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
            >
                <Settings size={16} /> Editar Plantilla Semanal
            </button>
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
                    disableUnavailable={false} // Allow instructors to select unavailable days to edit them
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

        {/* Weekly Template Modal */}
        {showWeeklyModal && (
            <Modal isOpen={showWeeklyModal} onClose={() => setShowWeeklyModal(false)} title="Plantilla Semanal">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <p className="text-sm text-slate-500 mb-4">Define tu horario base. Los días marcados en azul son laborables.</p>
                    {weeklyTemplate.map(slot => (
                        <div key={slot.day} className={`flex items-center gap-4 p-3 rounded-xl border ${slot.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-75'}`}>
                            <div className="w-24 font-bold text-slate-700">{dayNames[slot.day]}</div>

                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={slot.active}
                                    onChange={e => updateWeeklySlot(slot.day, 'active', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>

                            {slot.active ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="time"
                                        value={slot.start}
                                        onChange={e => updateWeeklySlot(slot.day, 'start', e.target.value)}
                                        className="p-2 border border-slate-200 rounded-lg text-sm w-full"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="time"
                                        value={slot.end}
                                        onChange={e => updateWeeklySlot(slot.day, 'end', e.target.value)}
                                        className="p-2 border border-slate-200 rounded-lg text-sm w-full"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 text-sm text-slate-400 italic text-center">Cerrado</div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setShowWeeklyModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold">Cancelar</button>
                    <button onClick={handleSaveWeekly} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Guardar Plantilla</button>
                </div>
            </Modal>
        )}
    </div>
  );
}
