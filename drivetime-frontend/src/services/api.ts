import { apiFetch } from './apiClient';
import type { Instructor } from '../types';

export async function fetchInstructors(): Promise<Instructor[]> {
    return apiFetch<Instructor[]>('/instructors.php');
}

export async function createBooking(booking: {
    instructor_id: string;
    booking_date: string;
    start_time: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await apiFetch('/bookings.php', {
            method: 'POST',
            body: JSON.stringify(booking),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Booking failed:", error);
        return { success: false, error: error.message || 'Error desconocido' };
    }
}
