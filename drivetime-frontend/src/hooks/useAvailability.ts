import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useAvailability(instructorId: string | null, date: Date | null) {
  const { token } = useAuth();
  const [slots, setSlots] = useState<{ time: string, available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instructorId || !date || !token) {
        setSlots([]);
        return;
    }

    setLoading(true);
    const dateStr = date.toISOString().split('T')[0];

    fetch(`${API_URL}/availability.php?instructorId=${instructorId}&date=${dateStr}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            setSlots(data);
        } else {
            setSlots([]);
        }
    })
    .catch(err => {
        console.error(err);
        setSlots([]);
    })
    .finally(() => setLoading(false));

  }, [instructorId, date, token]);

  return { slots, loading };
}
