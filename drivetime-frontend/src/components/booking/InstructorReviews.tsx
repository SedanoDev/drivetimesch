import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { X, Star, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Review {
    rating: number;
    comment: string;
    student_name: string;
    created_at: string;
}

interface InstructorReviewsProps {
    instructorId: string;
    instructorName: string;
    onClose: () => void;
}

export function InstructorReviews({ instructorId, instructorName, onClose }: InstructorReviewsProps) {
    const { token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/reviews.php?instructor_id=${instructorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setReviews(data);
        })
        .finally(() => setLoading(false));
    }, [instructorId, token]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Valoraciones</h3>
                        <p className="text-sm text-slate-500">{instructorName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Cargando opiniones...</div>
                    ) : reviews.length > 0 ? (
                        reviews.map((review, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                            {review.student_name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{review.student_name}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={14} className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                                    ))}
                                </div>
                                {review.comment && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">"{review.comment}"</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={24} className="opacity-50" />
                            </div>
                            <p>Este profesor aún no tiene valoraciones.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
