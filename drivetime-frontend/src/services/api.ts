import type { Instructor, TimeSlot } from '../types';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export async function fetchInstructors(): Promise<Instructor[]> {
    try {
        const response = await fetch(`${API_URL}/instructors.php`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch instructors:", error);
        return [];
    }
}

export async function fetchAvailability(date: string, instructorId: string): Promise<TimeSlot[]> {
    try {
         // In a real app, you'd pass date & instructorId as query params
        const response = await fetch(`${API_URL}/availability.php?date=${date}&instructorId=${instructorId}`);
        if (!response.ok) {
             throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch availability:", error);
        return [];
    }
}

export async function createBooking(booking: {
    instructor_id: string;
    student_name: string;
    booking_date: string;
    start_time: string;
}): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/bookings.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(booking),
        });

        return response.ok;
    } catch (error) {
        console.error("Failed to create booking:", error);
        return false;
    }
}
