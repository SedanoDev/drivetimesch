import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Review {
    id: string;
    student_name: string;
    instructor_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export function ReviewsManager() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = () => {
      setLoading(true);
      fetch(`${API_URL}/reviews.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setReviews(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
      if (token) fetchReviews();
  }, [token]);

  const handleDelete = async (id: string) => {
      if (!confirm("¿Estás seguro de que quieres eliminar esta reseña? Esta acción actualizará la calificación del instructor.")) return;

      setDeletingId(id);
      try {
          const res = await fetch(`${API_URL}/reviews.php?id=${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
              setReviews(prev => prev.filter(r => r.id !== id));
          } else {
              alert("Error al eliminar");
          }
      } catch (err) {
          alert("Error de conexión");
      } finally {
          setDeletingId(null);
      }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Moderación de Reseñas</h1>
            <p className="text-slate-500">Gestiona las valoraciones de los alumnos.</p>
        </div>

        {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando reseñas...</div>
        ) : reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Sin reseñas aún</h3>
                <p className="text-slate-500">Cuando los alumnos valoren sus clases, aparecerán aquí.</p>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="p-4">Alumno</th>
                                <th className="p-4">Instructor</th>
                                <th className="p-4">Valoración</th>
                                <th className="p-4">Comentario</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reviews.map(review => (
                                <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{review.student_name}</td>
                                    <td className="p-4 text-slate-600">{review.instructor_name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                            <Star size={16} fill="currentColor" />
                                            {review.rating}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={review.comment}>
                                        {review.comment || <span className="text-slate-400 italic">Sin comentario</span>}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {format(new Date(review.created_at), 'd MMM yyyy', { locale: es })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            disabled={deletingId === review.id}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar reseña"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}
