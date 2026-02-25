import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

interface Student {
    id: string;
    full_name: string;
    email: string;
    total_classes: number;
    last_class: string;
}

export function InstructorStudents() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/instructor_students.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setStudents(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando alumnos...</div>;

  return (
    <div>
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Mis Alumnos</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 font-bold text-slate-600 text-sm">Alumno</th>
                        <th className="p-4 font-bold text-slate-600 text-sm text-center">Clases Totales</th>
                        <th className="p-4 font-bold text-slate-600 text-sm text-right">Última Clase</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {students.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{student.full_name}</div>
                                        <div className="text-xs text-slate-400">{student.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-center font-bold text-slate-700">
                                {student.total_classes}
                            </td>
                            <td className="p-4 text-right text-slate-500 text-sm font-mono">
                                {student.last_class ? (
                                    <span className="flex items-center justify-end gap-1">
                                        <Calendar size={14} />
                                        {new Date(student.last_class).toLocaleDateString()}
                                    </span>
                                ) : '-'}
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr>
                            <td colSpan={3} className="p-12 text-center text-slate-400">
                                <p>No tienes alumnos asignados todavía.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
