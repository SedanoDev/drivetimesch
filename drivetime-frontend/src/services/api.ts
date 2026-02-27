import { apiFetch } from './apiClient';
import type { Instructor } from '../types';

export async function fetchInstructors(): Promise<Instructor[]> {
    return apiFetch<Instructor[]>('/instructors.php');
}

export async function createBooking(booking: {
    instructor_id: string;
    date: string;
    time_slot: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        await apiFetch('/bookings.php', {
            method: 'POST',
            body: JSON.stringify({
                instructor_id: booking.instructor_id,
                student_id: currentUser?.id,
                student_name: currentUser?.name || 'Demo Student',
                date: booking.date,
                time_slot: booking.time_slot,
                duration_minutes: 60
            }),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Booking failed:", error);
        return { success: false, error: error.message || 'Error desconocido' };
    }
}
