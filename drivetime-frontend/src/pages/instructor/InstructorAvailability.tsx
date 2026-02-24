import { useState } from 'react';

export function InstructorAvailability() {
  const [schedule, setSchedule] = useState([
      { day: 1, name: 'Lunes', start: '09:00', end: '18:00', active: true },
      { day: 2, name: 'Martes', start: '09:00', end: '18:00', active: true },
      { day: 3, name: 'Miércoles', start: '09:00', end: '18:00', active: true },
      { day: 4, name: 'Jueves', start: '09:00', end: '18:00', active: true },
      { day: 5, name: 'Viernes', start: '09:00', end: '14:00', active: true },
  ]);

  const handleSave = () => {
      alert("Guardado (Simulación - Backend pendiente para POST availability)");
      // TODO: Implement POST /api/availability.php
  };

  return (
    <div>
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Mi Disponibilidad</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
            <p className="text-sm text-slate-500 mb-6">Configura tu horario semanal habitual. Las reservas se bloquearán fuera de estas horas.</p>

            <div className="space-y-4">
                {schedule.map((day, idx) => (
                    <div key={day.day} className="flex items-center gap-4">
                        <div className="w-24 font-medium text-slate-700">{day.name}</div>
                        <input type="time" value={day.start} onChange={(e) => {
                            const newSched = [...schedule];
                            newSched[idx].start = e.target.value;
                            setSchedule(newSched);
                        }} className="border p-2 rounded-lg text-sm" />
                        <span>-</span>
                        <input type="time" value={day.end} onChange={(e) => {
                            const newSched = [...schedule];
                            newSched[idx].end = e.target.value;
                            setSchedule(newSched);
                        }} className="border p-2 rounded-lg text-sm" />

                        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={day.active} onChange={() => {
                                const newSched = [...schedule];
                                newSched[idx].active = !newSched[idx].active;
                                setSchedule(newSched);
                            }} />
                            Activo
                        </label>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">
                    Guardar Horario
                </button>
            </div>
        </div>
    </div>
  );
}
