import type { Instructor } from '../types';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

// Helper to get token
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export async function fetchInstructors(): Promise<Instructor[]> {
    try {
        const response = await fetch(`${API_URL}/instructors.php`, {
            headers: getAuthHeader()
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch instructors:", error);
        return [];
    }
}

export async function createBooking(booking: {
    instructor_id: string;
    booking_date: string;
    start_time: string;
}): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/bookings.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(booking),
        });
        
        return response.ok;
    } catch (error) {
        console.error("Failed to create booking:", error);
        return false;
    }
}
